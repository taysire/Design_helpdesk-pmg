#!/usr/bin/env python3
"""Generate bi-weekly KPI HTML report from SharePoint list « Tickets »."""

from __future__ import annotations

import argparse
import logging
import os
import sys
from datetime import datetime
from pathlib import Path

import pandas as pd

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

from charts import build_all_charts
from config import REPORTS_DIR, EmailConfig, ReportConfig, SHAREPOINT_LIST_URL
from data_quality import (
    build_fetch_metadata,
    build_sharepoint_diagnostics,
    check_data_freshness,
    daily_ticket_counts,
    load_expected_daily,
    validate_report_data,
)
from email_sender import email_config_from_env, send_report_automatically
from kpi_calculator import (
    KpiCalculator,
    build_business_week_windows,
    build_test_business_week_windows,
    build_week_windows,
    filter_period_dataframe,
    scope_weekly_dataframe,
)
from recommendations import generate_recommendations
from report_builder import build_html_report, save_report
from date_utils import exclude_weekend_tickets
from env_loader import graph_configured
from ticket_classifier import apply_classification

SOURCE_LABELS = {
    "graph": f"SharePoint — Liste Tickets ({SHAREPOINT_LIST_URL})",
}

logger = logging.getLogger("servicenow_kpi")


def _load_env() -> None:
    if load_dotenv is None:
        return
    env_path = Path(__file__).resolve().parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    _load_env()
    parser = argparse.ArgumentParser(
        description="Génère le rapport bi-hebdomadaire KPI (SharePoint Tickets).",
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
        help="Date de référence ISO (YYYY-MM-DD)",
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
        choices=["graph"],
        default="graph",
        help="Source de données (SharePoint Liste Tickets)",
    )
    parser.add_argument(
        "--email",
        action="store_true",
        help="Envoyer le rapport par email (Microsoft Graph)",
    )
    parser.add_argument(
        "--email-to",
        default=None,
        help="Destinataires (virgules). Défaut: EMAIL ou GRAPH_EMAIL_TO",
    )
    parser.add_argument(
        "--weekly-cap",
        type=int,
        default=25,
        help="Max tickets/semaine pour exports simulés (0 = pas de limite)",
    )
    parser.add_argument(
        "--this-week-only",
        action="store_true",
        help="Rapport limité à la semaine courante uniquement",
    )
    parser.add_argument(
        "--from-date",
        dest="period_start",
        default=None,
        help="Début de période ISO (YYYY-MM-DD)",
    )
    parser.add_argument(
        "--to-date",
        dest="period_end",
        default=None,
        help="Fin de période ISO (YYYY-MM-DD)",
    )
    parser.add_argument(
        "--volume-only",
        action="store_true",
        help="Volume uniquement — aucun calcul de durée ni SLA",
    )
    parser.add_argument(
        "--skip-qa",
        action="store_true",
        help="Désactiver le contrôle qualité (non recommandé)",
    )
    parser.add_argument(
        "--expected-daily",
        type=Path,
        default=None,
        help="JSON {YYYY-MM-DD: count} pour validation stricte des totaux journaliers",
    )
    return parser.parse_args(argv)


def _build_data_source(config: ReportConfig):
    from data_sources.sharepoint_list import SharePointListSource

    if not graph_configured():
        raise ValueError(
            "Microsoft Graph non configuré. Ajoutez MS_TENANT_ID, MS_CLIENT_ID et "
            "MS_CLIENT_SECRET dans .env pour accéder à la liste SharePoint Tickets."
        )
    return SharePointListSource(
        period_start=config.period_start,
        period_end=config.period_end,
    )


def run(
    config: ReportConfig,
    source: str = "graph",
    *,
    send_email: bool = False,
    email: EmailConfig | None = None,
    skip_qa: bool = False,
    expected_daily_path: Path | None = None,
) -> tuple[Path, dict, str | None]:
    config.ensure_dirs()
    config.source_label = SOURCE_LABELS.get(source, config.source_label)
    config.volume_only = True

    data_source = _build_data_source(config)
    df = data_source.load()

    raw_fetch_meta = getattr(data_source, "fetch_meta", {}) or {}
    total_before_weekend = int(
        raw_fetch_meta.get("total_in_period_before_weekend", len(df))
    )

    ref = None
    if config.reference_date:
        ref = pd.Timestamp(datetime.strptime(config.reference_date, "%Y-%m-%d").date())
    elif config.period_end:
        ref = pd.Timestamp(datetime.strptime(config.period_end, "%Y-%m-%d").date())

    if config.period_start and config.period_end:
        config.source_label = (
            f"{config.source_label} · période {config.period_start} → {config.period_end}"
        )

    cap = config.weekly_cap if config.weekly_cap and config.weekly_cap > 0 else None
    simulated = df.attrs.get("simulated_export")
    if (simulated or config.current_week_only) and not config.volume_only:
        df = scope_weekly_dataframe(
            df,
            reference_date=ref,
            weekly_cap=cap,
            current_week_only=config.current_week_only,
            include_previous_week=not config.current_week_only,
        )

    weekend_excluded = 0
    if config.exclude_weekends:
        df, weekend_excluded = exclude_weekend_tickets(df)
        if weekend_excluded:
            logger.info("Weekends exclus : %d tickets (sam/dim)", weekend_excluded)

    total_after_exclusion = len(df)
    df = apply_classification(df)

    fetch_meta_dict = df.attrs.get("fetch_meta") or raw_fetch_meta
    fetch_meta_dict = {
        **fetch_meta_dict,
        "total_in_period_before_weekend": total_before_weekend,
        "weekend_excluded": weekend_excluded,
        "total_after_exclusion": total_after_exclusion,
    }

    fetch_meta = build_fetch_metadata(
        df,
        source="sharepoint",
        period_start=config.period_start,
        period_end=config.period_end,
        pages_fetched=int(fetch_meta_dict.get("pages_fetched", 1)),
    )
    fetch_meta.total_fetched = total_after_exclusion
    fetch_meta.log_summary()

    sp_diagnostics = build_sharepoint_diagnostics(
        fetch_meta_dict,
        weekend_excluded=weekend_excluded,
        total_after_exclusion=total_after_exclusion,
    )

    expected_daily = None
    if expected_daily_path and expected_daily_path.exists():
        expected_daily = load_expected_daily(expected_daily_path)

    week1_count = week2_count = None
    if config.period_start and config.period_end and ref is not None:
        if config.week_mode == "test_current":
            current, previous = build_test_business_week_windows(ref)
        else:
            current, previous = build_business_week_windows(ref)
        from kpi_calculator import _in_window

        week1_count = len(_in_window(df, previous))
        week2_count = len(_in_window(df, current))

    validation = None
    if not skip_qa and config.period_start and config.period_end:
        validation = validate_report_data(
            df,
            period_start=config.period_start,
            period_end=config.period_end,
            fetch_meta=fetch_meta,
            expected_daily=expected_daily,
            week1_count=week1_count,
            week2_count=week2_count,
        )
        for w in sp_diagnostics.get("warnings", []):
            validation.warnings.append(w)
        validation.raise_if_failed()

    calculator = KpiCalculator(
        df,
        reference_date=ref,
        top_n=config.top_n,
        trend_weeks=config.trend_weeks,
        volume_only=True,
        week_mode=config.week_mode,
    )
    kpis = calculator.compute()

    freshness = check_data_freshness(
        df,
        config.period_end or "",
        source="sharepoint",
    )

    kpis["quality"] = {
        "validated": validation.ok if validation else not skip_qa,
        "ok": validation.ok if validation else True,
        "daily_counts": (
            validation.daily_counts if validation
            else daily_ticket_counts(df, config.period_start, config.period_end)
            if config.period_start and config.period_end else {}
        ),
        "expected_daily": expected_daily,
        "unclassified_titles": validation.unclassified_titles if validation else {},
        "freshness": freshness,
        "sharepoint": sp_diagnostics,
        "fetch_meta": {
            "source": "sharepoint",
            "total_fetched": total_after_exclusion,
            "total_before_weekend": total_before_weekend,
            "weekend_excluded": weekend_excluded,
            "pages_fetched": fetch_meta_dict.get("pages_fetched", 0),
        },
    }

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
        if not mail_cfg.to_addrs:
            mail_cfg.to_addrs = ["ti@pharmaciepmg.ca"]
        if mail_cfg.to_addrs:
            channel = send_report_automatically(path, mail_cfg, html=html)

    return path, kpis["summary"], channel


def main(argv: list[str] | None = None) -> int:
    _load_env()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
    args = _parse_args(argv)

    from period_utils import resolve_period_and_mode

    week_mode = os.getenv("KPI_WEEK_MODE", "production")
    p_start, p_end, ref, _ = resolve_period_and_mode(
        week_mode=week_mode,
        period_start=args.period_start,
        period_end=args.period_end,
    )

    config = ReportConfig(
        output_dir=args.output,
        reference_date=ref if not args.reference_date else args.reference_date,
        organization=args.organization,
        top_n=args.top_n,
        trend_weeks=args.trend_weeks,
        weekly_cap=args.weekly_cap,
        current_week_only=args.this_week_only,
        period_start=p_start,
        period_end=p_end,
        volume_only=True,
        exclude_weekends=True,
        week_mode="test_current" if week_mode == "current_vs_previous" else "production",
        source_label=SOURCE_LABELS["graph"],
    )

    email_cfg = email_config_from_env()
    if not email_cfg.to_addrs:
        email_cfg.to_addrs = ["ti@pharmaciepmg.ca"]
    if args.email_to:
        email_cfg.to_addrs = [a.strip() for a in args.email_to.split(",") if a.strip()]

    try:
        path, summary, channel = run(
            config,
            source=args.source,
            send_email=args.email,
            email=email_cfg,
            skip_qa=args.skip_qa,
            expected_daily_path=args.expected_daily,
        )
    except FileNotFoundError as exc:
        print(f"Erreur: {exc}", file=sys.stderr)
        return 1
    except ValueError as exc:
        print(f"Erreur de données: {exc}", file=sys.stderr)
        return 3
    except (KeyError, RuntimeError) as exc:
        print(f"Erreur Graph / configuration: {exc}", file=sys.stderr)
        return 4

    print(f"Rapport généré: {path}")
    print(f"  Total tickets     : {summary['total_tickets']}")
    print(f"  Sem. 2 (créés)    : {summary['created_this_week']}")
    print(f"  Sem. 1 (créés)    : {summary['created_last_week']}")
    if summary.get("volume_change_pct") is not None:
        pct = summary["volume_change_pct"]
        sign = f"+{pct}" if pct > 0 else str(pct)
        print(f"  Variation sem. 2  : {sign}%")
    if channel:
        print(f"  Email envoyé via  : {channel}")
    elif args.email:
        print("  Email             : non envoyé (destinataires non configurés)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
