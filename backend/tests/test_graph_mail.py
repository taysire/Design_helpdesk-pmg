"""Unit tests for Microsoft Graph mail client and email delivery modes."""

from unittest.mock import MagicMock, patch

import pytest

from app.config import Settings
from app.services.graph_mail import GraphMailClient, GraphMailError
from app.services.notifications import _send_email
from app.models.ticket import Ticket


def _ticket() -> Ticket:
    return Ticket(
        id="INC-TEST",
        ticket_type="incident",
        title="Printer offline",
        category="hardware",
        priority="P3",
        status="new",
        reporter_id="me",
        assignee_id="jd",
        body="Cannot print",
    )


def _settings(**overrides) -> Settings:
    base = {
        "notifications_enabled": True,
        "notify_email_mode": "log",
        "graph_tenant_id": "",
        "graph_client_id": "",
        "graph_client_secret": "",
        "graph_sender_email": "",
        "helpdesk_portal_url": "http://localhost:8888",
    }
    base.update(overrides)
    return Settings(**base)


def test_graph_client_not_configured():
    client = GraphMailClient(_settings())
    assert client.is_configured() is False


def test_graph_client_configured():
    client = GraphMailClient(_settings(
        graph_tenant_id="tenant-id",
        graph_client_id="client-id",
        graph_client_secret="secret",
        graph_sender_email="ti@example.com",
    ))
    assert client.is_configured() is True


def test_send_email_log_mode_records_sent():
    db = MagicMock()
    ticket = _ticket()
    settings = _settings(notify_email_mode="log")

    with patch("app.services.notifications.get_settings", return_value=settings):
        notif = _send_email(db, ticket, "status_in_progress", "Subject", "Body")

    assert notif.status == "sent"
    assert notif.detail == "mode=log"
    assert notif.recipient == "you@pmg.com"
    db.add.assert_called_once()


def test_send_email_graph_mode_success():
    db = MagicMock()
    ticket = _ticket()
    settings = _settings(
        notify_email_mode="graph",
        graph_tenant_id="tenant-id",
        graph_client_id="client-id",
        graph_client_secret="secret",
        graph_sender_email="ti@example.com",
    )
    graph = MagicMock(spec=GraphMailClient)
    graph.is_configured.return_value = True

    with patch("app.services.notifications.get_settings", return_value=settings):
        notif = _send_email(
            db, ticket, "status_in_progress", "Ticket INC-TEST — en cours",
            "Body", new_status="inprog", graph_client=graph,
        )

    assert notif.status == "sent"
    assert notif.detail == "mode=graph"
    graph.send_mail.assert_called_once()
    call = graph.send_mail.call_args.kwargs
    assert call["to"] == "you@pmg.com"
    assert "INC-TEST" in call["html_body"]
    assert "Printer offline" in call["html_body"]
    assert "inprog" in call["html_body"] or "En cours" in call["html_body"]


def test_send_email_graph_failure_does_not_raise():
    db = MagicMock()
    ticket = _ticket()
    settings = _settings(
        notify_email_mode="graph",
        graph_tenant_id="tenant-id",
        graph_client_id="client-id",
        graph_client_secret="secret",
        graph_sender_email="ti@example.com",
    )
    graph = MagicMock(spec=GraphMailClient)
    graph.is_configured.return_value = True
    graph.send_mail.side_effect = GraphMailError("Graph sendMail failed: 403")

    with patch("app.services.notifications.get_settings", return_value=settings):
        notif = _send_email(
            db, ticket, "status_in_progress", "Subject", "Body",
            graph_client=graph,
        )

    assert notif.status == "failed"
    assert "403" in (notif.detail or "")


def test_send_email_graph_misconfigured():
    db = MagicMock()
    ticket = _ticket()
    settings = _settings(notify_email_mode="graph")

    with patch("app.services.notifications.get_settings", return_value=settings):
        notif = _send_email(db, ticket, "status_in_progress", "Subject", "Body")

    assert notif.status == "failed"
    assert notif.detail == "graph not configured"
