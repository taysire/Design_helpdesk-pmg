#!/usr/bin/env python3
"""
Pipeline KPI bi-hebdomadaire automatisé — exécution chaque lundi 9h.

  SharePoint Liste Tickets (Microsoft Graph)
        ↓
  Exclusion weekends (samedi/dimanche)
        ↓
  Contrôle qualité (totaux, colonnes, ID/Created)
        ↓
  Rapport KPI HTML (volume uniquement)
        ↓
  Email automatique → ti@pharmaciepmg.ca

Usage :
    python run_automated.py              # période auto + envoi email
    python run_automated.py --dry-run    # sans envoi email
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from pathlib import Path

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

from config import REPORTS_DIR, ReportConfig
from email_sender import email_config_from_env
from env_loader import graph_configured
from generate_report import run as generate_run
from logging_setup import setup_logging
from period_utils import resolve_period_and_mode

logger = logging.getLogger("servicenow_kpi.automated")


def _load_env() -> None:
    if load_dotenv is None:
        return
    env_path = Path(__file__).resolve().parent / ".env"
    if env_path.exists():
        load_dotenv(env_path)


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Pipeline automatisé KPI SharePoint (rapport → email).",
    )
    parser.add_argument("--dry-run", action="store_true", help="Sans envoi email")
    parser.add_argument("--from-date", dest="period_start", default=None)
    parser.add_argument("--to-date", dest="period_end", default=None)
    parser.add_argument("--skip-qa", action="store_true")
    parser.add_argument("--expected-daily", type=Path, default=None)
    parser.add_argument("--quiet", action="store_true")
    return parser.parse_args(argv)


def run_automated(
    *,
    period_start: str | None = None,
    period_end: str | None = None,
    send_email: bool = True,
    skip_qa: bool = False,
    expected_daily_path: Path | None = None,
    organization: str | None = None,
) -> tuple[Path, dict, str | None]:
    if not graph_configured():
        raise ValueError(
            "Microsoft Graph non configuré. Renseignez MS_TENANT_ID, MS_CLIENT_ID "
            "et MS_CLIENT_SECRET dans .env."
        )

    week_mode = os.getenv("KPI_WEEK_MODE", "production")
    p_start, p_end, ref, week_mode = resolve_period_and_mode(
        week_mode=week_mode,
        period_start=period_start,
        period_end=period_end,
    )

    logger.info("=== Pipeline KPI bi-hebdomadaire (SharePoint) ===")
    logger.info("Mode semaines     : %s", week_mode)
    logger.info("Periode analysee  : %s -> %s (reference %s)", p_start, p_end, ref)

    org = organization or os.getenv("KPI_ORGANIZATION", "PMG Helpdesk")

    config = ReportConfig(
        output_dir=REPORTS_DIR,
        reference_date=ref,
        organization=org,
        period_start=p_start,
        period_end=p_end,
        volume_only=True,
        exclude_weekends=True,
        week_mode="production",
        source_label="SharePoint — Liste Tickets",
    )

    email_cfg = email_config_from_env()
    if not email_cfg.to_addrs:
        email_cfg.to_addrs = ["ti@pharmaciepmg.ca"]
    if not email_cfg.to_addrs and send_email:
        logger.warning("Destinataires non configurés — rapport généré sans envoi")
        send_email = False

    path, summary, channel = generate_run(
        config,
        source="graph",
        send_email=send_email,
        email=email_cfg,
        skip_qa=skip_qa,
        expected_daily_path=expected_daily_path,
    )

    logger.info("=== Rapport généré avec succès ===")
    logger.info("Fichier : %s", path)
    logger.info("Total tickets : %s", summary["total_tickets"])
    logger.info("Semaine 1     : %s", summary["created_last_week"])
    logger.info("Semaine 2     : %s", summary["created_this_week"])
    if summary.get("volume_change_pct") is not None:
        logger.info("Variation %%   : %s%%", summary["volume_change_pct"])
    if channel:
        logger.info("Email envoyé  : %s → %s", channel, ", ".join(email_cfg.to_addrs))

    return path, summary, channel


def main(argv: list[str] | None = None) -> int:
    _load_env()
    args = _parse_args(argv)
    setup_logging(verbose=not args.quiet)

    try:
        run_automated(
            period_start=args.period_start,
            period_end=args.period_end,
            send_email=not args.dry_run,
            skip_qa=args.skip_qa,
            expected_daily_path=args.expected_daily,
        )
    except ValueError as exc:
        logger.error("ECHEC — %s", exc)
        logger.error("Rapport NON envoyé. Vérifiez Graph et SharePoint dans .env.")
        return 1
    except FileNotFoundError as exc:
        logger.error("Fichier introuvable : %s", exc)
        return 2
    except Exception as exc:
        logger.exception("Erreur inattendue : %s", exc)
        return 3

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
