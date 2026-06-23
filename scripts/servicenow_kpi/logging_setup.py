"""File + console logging for automated KPI pipeline."""

from __future__ import annotations

import logging
import sys
from datetime import datetime
from pathlib import Path

# UTF-8 console on Windows (evite erreurs d'encodage dans les logs)
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

PACKAGE_DIR = Path(__file__).resolve().parent
LOGS_DIR = PACKAGE_DIR / "logs"


def setup_logging(*, verbose: bool = True) -> Path:
    """Configure logging to console and logs/weekly-kpi-YYYY-MM-DD.log."""
    LOGS_DIR.mkdir(parents=True, exist_ok=True)
    log_path = LOGS_DIR / f"weekly-kpi-{datetime.now().strftime('%Y-%m-%d')}.log"

    level = logging.INFO if verbose else logging.WARNING
    root = logging.getLogger()
    root.handlers.clear()
    root.setLevel(level)

    formatter = logging.Formatter(
        "%(asctime)s %(levelname)s %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    console = logging.StreamHandler(sys.stdout)
    console.setFormatter(formatter)
    root.addHandler(console)

    file_handler = logging.FileHandler(log_path, encoding="utf-8")
    file_handler.setFormatter(formatter)
    root.addHandler(file_handler)

    logging.getLogger("servicenow_kpi").info("Journal : %s", log_path)
    return log_path
