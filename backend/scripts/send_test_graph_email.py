#!/usr/bin/env python3
"""Send a test ticket notification via Graph (reads .env, never prints secrets)."""

from __future__ import annotations

import os
import sys
from unittest.mock import MagicMock

from app.env_bootstrap import bootstrap_env
from app.config import get_settings
from app.models.ticket import Ticket
from app.services.notifications import _send_email

bootstrap_env()
os.environ["NOTIFY_EMAIL_MODE"] = "graph"
get_settings.cache_clear()
settings = get_settings()

print(f"Email mode     : {settings.notify_email_mode}")
print(f"Graph ready    : {settings.graph_email_ready}")
print(f"Sender set     : {bool(settings.graph_sender_email)}")
print(f"Portal URL     : {settings.helpdesk_portal_url}")

if settings.notify_email_mode != "graph":
    print("ERROR: NOTIFY_EMAIL_MODE must be 'graph'")
    sys.exit(1)

if not settings.graph_email_ready:
    print("ERROR: Graph credentials incomplete (GRAPH_* or MS_* in .env)")
    sys.exit(1)

ticket = Ticket(
    id="INC-TEST",
    ticket_type="incident",
    title="Test notification Graph — PMG Helpdesk",
    category="hardware",
    priority="P3",
    status="inprog",
    reporter_id="ti@pharmaciepmg.ca",
    assignee_id="jd",
    body="Courriel de test automatique (Phase 8).",
)

db = MagicMock()
notif = _send_email(
    db,
    ticket,
    "status_in_progress",
    f"Ticket {ticket.id} — en cours de traitement (test)",
    "Test",
    new_status="inprog",
    comment="Ceci est un test d'envoi Graph depuis le backend Helpdesk.",
)

print(f"Delivery status: {notif.status}")
print(f"Recipient      : {notif.recipient}")
if notif.detail:
    print(f"Detail         : {notif.detail}")

sys.exit(0 if notif.status == "sent" else 1)
