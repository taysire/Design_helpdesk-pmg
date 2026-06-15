#!/usr/bin/env python3
"""Generate weekly ServiceNow KPI HTML report from CSV, SharePoint List, or API."""

from __future__ import annotations

import argparse
import sys
from datetime import datetime
from pathlib import Path

import pandas as pd

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

from charts import build_all_charts
from config import DEFAULT_CSV, REPORTS_DIR, EmailConfig, ReportConfig
from data_sources.csv_source import CsvTicketSource
from email_sender import email_config_from_env, send_report_automatically
from kpi_calculator import KpiCalculator
from recommendations import generate_recommendations
from report_builder import build_html_report, save_report

SOURCE_LABELS = {
    "csv": "export ServiceNow (CSV)",
    "graph": "Microsoft Lists / SharePoint (Graph API)",
    "sharepoint": "Microsoft Lists / SharePoint (Graph API)",
    "api": "ServiceNow REST API",
}


def _load_env() -> None:
    if load_dotenv is None:
        return
    env_path = Path(__file__).resolve().parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Génère le rapport hebdomadaire KPI ServiceNow (HTML).",
    )
    parser.add_argument(
        "--csv",
        type=Path,
        default=DEFAULT_CSV,
        help=f"Chemin vers l'export CSV ServiceNow (défaut: {DEFAULT_CSV.name})",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=REPORTS_DIR,
        help="Répertoire de sortie pour le rapport HTML",
    )
    parser.add_argument(
        "--date",
        dest="reference_date",
        default=None,
        help="Date de référence ISO (YYYY-MM-DD) pour la semaine courante; défaut = max(Created)",
    )
    parser.add_argument(
        "--organization",
        default="PMG Helpdesk",
        help="Nom affiché dans le rapport",
    )
    parser.add_argument(
        "--top-n",
        type=int,
        default=10,
        help="Nombre d'entrées dans les tableaux top-N",
    )
    parser.add_argument(
        "--trend-weeks",
        type=int,
        default=2,
        help="Nombre de semaines dans le graphique de tendance",
    )
    parser.add_argument(
        "--source",
        choices=["csv", "graph", "sharepoint", "api"],
        default="csv",
        help="Source de données (graph = Microsoft Lists via Graph API)",
    )
    parser.add_argument(
        "--email",
        action="store_true",
        help="Envoyer le rapport par email (Graph sendMail ou SMTP)",
    )
    parser.add_argument(
        "--email-to",
        default=None,
        help="Destinataires (virgules). Défaut: GRAPH_EMAIL_TO ou SMTP_TO",
    )
    return parser.parse_args(argv)


def _build_data_source(source: str, csv_path: Path):
    if source in ("graph", "sharepoint"):
        from data_sources.sharepoint_list import SharePointListSource

        return SharePointListSource()
    if source == "api":
        from data_sources.servicenow_api import ServiceNowApiSource

        return ServiceNowApiSource(instance="your-instance.service-now.com")
    return CsvTicketSource(csv_path)


def run(
    config: ReportConfig,
    source: str = "csv",
    *,
    send_email: bool = False,
    email: EmailConfig | None = None,
) -> tuple[Path, dict, str | None]:
    config.ensure_dirs()
    config.source_label = SOURCE_LABELS.get(source, config.source_label)

    data_source = _build_data_source(source, config.csv_path)
    df = data_source.load()

    ref = None
    if config.reference_date:
        ref = pd.Timestamp(datetime.strptime(config.reference_date, "%Y-%m-%d").date())

    calculator = KpiCalculator(
        df,
        reference_date=ref,
        top_n=config.top_n,
        trend_weeks=config.trend_weeks,
    )
    kpis = calculator.compute()
    charts = build_all_charts(kpis)
    recommendations = generate_recommendations(kpis, lang=config.lang)

    html = build_html_report(
        kpis,
        charts,
        recommendations,
        organization=config.organization,
        source_label=config.source_label,
    )
    path = save_report(html, config.output_dir)

    channel: str | None = None
    if send_email:
        mail_cfg = email or email_config_from_env()
        if mail_cfg.to_addrs:
            channel = send_report_automatically(path, mail_cfg, html=html)

    return path, kpis["summary"], channel


def main(argv: list[str] | None = None) -> int:
    _load_env()
    args = _parse_args(argv)
    config = ReportConfig(
        csv_path=args.csv,
        output_dir=args.output,
        reference_date=args.reference_date,
        organization=args.organization,
        top_n=args.top_n,
        trend_weeks=args.trend_weeks,
    )

    email_cfg = email_config_from_env()
    if args.email_to:
        email_cfg.to_addrs = [a.strip() for a in args.email_to.split(",") if a.strip()]

    try:
        path, summary, channel = run(
            config,
            source=args.source,
            send_email=args.email,
            email=email_cfg,
        )
    except FileNotFoundError as exc:
        print(f"Erreur: {exc}", file=sys.stderr)
        return 1
    except NotImplementedError as exc:
        print(f"Source API non configurée: {exc}", file=sys.stderr)
        return 2
    except ValueError as exc:
        print(f"Erreur de données: {exc}", file=sys.stderr)
        return 3
    except (KeyError, RuntimeError) as exc:
        print(f"Erreur Graph / configuration: {exc}", file=sys.stderr)
        return 4

    print(f"Rapport généré: {path}")
    print(f"  Total tickets     : {summary['total_tickets']}")
    print(f"  Créés cette sem.  : {summary['created_this_week']}")
    print(f"  Créés sem. préc.  : {summary['created_last_week']}")
    print(f"  Taux clôture      : {summary['closure_rate_pct']}%")
    if channel:
        print(f"  Email envoyé via  : {channel}")
    elif args.email:
        print("  Email             : non envoyé (destinataires non configurés)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
