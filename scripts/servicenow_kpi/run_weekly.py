#!/usr/bin/env python3
"""
Pipeline hebdomadaire — rétrocompatibilité.

Délègue à run_automated.py (SharePoint Tickets → KPI → email).
"""

from run_automated import main

if __name__ == "__main__":
    raise SystemExit(main())
