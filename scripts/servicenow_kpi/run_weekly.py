#!/usr/bin/env python3
"""
Pipeline hebdomadaire automatisé :

  Microsoft Lists / SharePoint
        ↓ Microsoft Graph API
        ↓ Script KPI
        ↓ Email automatique (Graph sendMail ou SMTP)

Usage (planification Windows Task Scheduler) :

    python run_weekly.py

Variables d'environnement : voir .env.example
"""

from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path

import pandas as pd

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

from charts import build_all_charts
from config import REPORTS_DIR, EmailConfig, ReportConfig
from data_sources.sharepoint_list import SharePointListSource
from email_sender import email_config_from_env, send_report_automatically
from kpi_calculator import KpiCalculator
from recommendations import generate_recommendations
from report_builder import build_html_report, save_report


def _load_env() -> None:
    if load_dotenv is None:
        return
    env_path = Path(__file__).resolve().parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)


def run_pipeline(
    *,
    report: ReportConfig | None = None,
    email: EmailConfig | None = None,
    send_email: bool = True,
) -> tuple[Path, dict, str | None]:
    report = report or ReportConfig(
        output_dir=REPORTS_DIR,
        source_label="Microsoft Lists / SharePoint (Graph API)",
    )
    email = email or email_config_from_env()
    report.ensure_dirs()

    data_source = SharePointListSource()
    df = data_source.load()

    ref = None
    if report.reference_date:
        ref = pd.Timestamp(datetime.strptime(report.reference_date, "%Y-%m-%d").date())

    calculator = KpiCalculator(
        df,
        reference_date=ref,
        top_n=report.top_n,
        trend_weeks=report.trend_weeks,
    )
    kpis = calculator.compute()
    charts = build_all_charts(kpis)
    recommendations = generate_recommendations(kpis, lang=report.lang)

    html = build_html_report(
        kpis,
        charts,
        recommendations,
        organization=report.organization,
        source_label=report.source_label,
    )
    path = save_report(html, report.output_dir)

    channel: str | None = None
    if send_email and email.to_addrs:
        channel = send_report_automatically(path, email, html=html)

    return path, kpis["summary"], channel


def main() -> int:
    _load_env()

    try:
        path, summary, channel = run_pipeline()
    except KeyError as exc:
        print(f"Configuration manquante: {exc}", file=sys.stderr)
        print("Copiez .env.example vers .env et renseignez les variables Azure / Graph.", file=sys.stderr)
        return 1
    except ValueError as exc:
        print(f"Erreur: {exc}", file=sys.stderr)
        return 2
    except RuntimeError as exc:
        print(f"Erreur Graph: {exc}", file=sys.stderr)
        return 3

    print(f"Rapport généré: {path}")
    print(f"  Total tickets     : {summary['total_tickets']}")
    print(f"  Créés cette sem.  : {summary['created_this_week']}")
    print(f"  Créés sem. préc.  : {summary['created_last_week']}")
    print(f"  Taux clôture      : {summary['closure_rate_pct']}%")
    if channel:
        print(f"  Email envoyé via  : {channel} → {', '.join(email_config_from_env().to_addrs)}")
    else:
        print("  Email             : non envoyé (GRAPH_EMAIL_TO / SMTP_TO non configuré)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
