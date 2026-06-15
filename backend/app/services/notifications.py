"""Notification channels — email, Slack, Jira (mode log par défaut)."""

from __future__ import annotations

import logging
import uuid
from typing import TYPE_CHECKING

import httpx

from app.config import get_settings
from app.models.notification import Notification
from app.services.graph_mail import GraphMailClient, GraphMailError
from app.services.lifecycle import normalize_status
from app.services.notification_templates import build_ticket_email

if TYPE_CHECKING:
    from sqlalchemy.orm import Session

    from app.models.ticket import Ticket

logger = logging.getLogger(__name__)

REPORTER_CONTACTS: dict[str, str] = {
    "me": "you@pmg.com",
    "pr": "priya.rao@pmg.com",
    "mt": "mara.tremblay@pmg.com",
    "al": "alex.larose@pmg.com",
    "jd": "jordan.dubois@pmg.com",
    "sc": "sam.cote@pmg.com",
}

STATUS_EMAIL_EVENTS = {
    ("new", "inprog"): "status_in_progress",
    ("inprog", "waiting_info"): "status_need_info",
    ("new", "waiting_info"): "status_need_info",
    ("inprog", "resolved"): "status_resolved",
    ("waiting_info", "resolved"): "status_resolved",
    ("waiting_vendor", "resolved"): "status_resolved",
    ("resolved", "closed"): "status_closed",
}

EMAIL_SUBJECTS = {
    "status_in_progress": "Ticket {id} — en cours de traitement",
    "status_need_info": "Ticket {id} — information requise",
    "status_resolved": "Ticket {id} — résolu",
    "status_closed": "Ticket {id} — fermé",
    "comment_it": "Ticket {id} — nouveau commentaire TI",
    "ticket_created": "Ticket {id} — confirmation de création",
    "ticket_reopened": "Ticket {id} — réouvert",
}

STATUS_HEADLINES = {
    "status_in_progress": "Votre ticket est maintenant en cours de traitement.",
    "status_need_info": "Des informations supplémentaires sont requises pour votre ticket.",
    "status_resolved": "Votre ticket a été résolu.",
    "status_closed": "Votre ticket a été fermé.",
    "comment_it": "Un agent TI a ajouté un commentaire à votre ticket.",
    "ticket_created": "Votre demande a bien été enregistrée.",
    "ticket_reopened": "Votre ticket a été réouvert.",
}


def _reporter_email(reporter_id: str) -> str:
    if "@" in reporter_id:
        return reporter_id
    return REPORTER_CONTACTS.get(reporter_id, f"{reporter_id}@pmg.com")


def _record(
    db: Session,
    ticket: Ticket,
    channel: str,
    event: str,
    recipient: str,
    status: str,
    subject: str | None = None,
    body: str | None = None,
    detail: str | None = None,
) -> Notification:
    row = Notification(
        ticket_id=ticket.id,
        channel=channel,
        event=event,
        recipient=recipient,
        status=status,
        subject=subject,
        body=body,
        detail=detail,
    )
    db.add(row)
    return row


def _build_email_bodies(
    ticket: Ticket,
    event: str,
    *,
    new_status: str | None = None,
    comment: str | None = None,
) -> tuple[str, str]:
    settings = get_settings()
    headline = STATUS_HEADLINES.get(event, "Mise à jour de votre ticket.")
    return build_ticket_email(
        ticket,
        headline=headline,
        new_status=new_status,
        comment=comment,
        portal_url=settings.helpdesk_portal_url,
    )


def _send_email(
    db: Session,
    ticket: Ticket,
    event: str,
    subject: str,
    body: str,
    *,
    new_status: str | None = None,
    comment: str | None = None,
    graph_client: GraphMailClient | None = None,
) -> Notification:
    settings = get_settings()
    recipient = _reporter_email(ticket.reporter_id)
    if not settings.notifications_enabled:
        return _record(db, ticket, "email", event, recipient, "skipped", subject, body, "disabled")

    mode = settings.notify_email_mode.lower()
    plain, html = _build_email_bodies(
        ticket,
        event,
        new_status=new_status,
        comment=comment,
    )

    if mode == "log":
        logger.info("EMAIL [%s] -> %s | %s", event, recipient, subject)
        return _record(db, ticket, "email", event, recipient, "sent", subject, plain, "mode=log")

    if mode == "graph":
        client = graph_client or GraphMailClient(settings)
        if not client.is_configured():
            logger.warning("Graph email skipped — missing GRAPH_* configuration")
            return _record(
                db, ticket, "email", event, recipient, "failed",
                subject, plain, "graph not configured",
            )
        try:
            client.send_mail(to=recipient, subject=subject, html_body=html, text_body=plain)
            return _record(db, ticket, "email", event, recipient, "sent", subject, plain, "mode=graph")
        except GraphMailError as exc:
            logger.warning("Graph email delivery failed for %s: %s", ticket.id, exc)
            return _record(db, ticket, "email", event, recipient, "failed", subject, plain, str(exc))
        except Exception as exc:
            logger.warning("Unexpected email delivery error for %s: %s", ticket.id, exc)
            return _record(db, ticket, "email", event, recipient, "failed", subject, plain, str(exc))

    return _record(db, ticket, "email", event, recipient, "failed", subject, plain, f"mode={mode} not supported")


def _send_slack(
    db: Session,
    ticket: Ticket,
    event: str,
    message: str,
) -> Notification:
    settings = get_settings()
    channel = settings.notify_slack_channel
    if not settings.notifications_enabled:
        return _record(db, ticket, "slack", event, channel, "skipped", body=message, detail="disabled")

    webhook = settings.notify_slack_webhook_url
    if not webhook:
        logger.info("SLACK [%s] %s | %s", event, channel, message)
        return _record(db, ticket, "slack", event, channel, "sent", body=message, detail="mode=log")

    try:
        with httpx.Client(timeout=8.0) as client:
            res = client.post(webhook, json={"text": message})
            res.raise_for_status()
        return _record(db, ticket, "slack", event, channel, "sent", body=message)
    except Exception as exc:
        logger.warning("Slack delivery failed: %s", exc)
        return _record(db, ticket, "slack", event, channel, "failed", body=message, detail=str(exc))


def _create_jira(
    db: Session,
    ticket: Ticket,
    event: str,
) -> Notification | None:
    settings = get_settings()
    if ticket.jira_key:
        return None
    if not settings.notifications_enabled or not settings.notify_jira_enabled:
        return None
    if ticket.category not in settings.jira_categories_list:
        return None

    project = settings.notify_jira_project
    if settings.notify_jira_mode == "log":
        key = f"{project}-{uuid.uuid4().hex[:4].upper()}"
        ticket.jira_key = key
        summary = f"[{ticket.id}] {ticket.title}"
        logger.info("JIRA [%s] %s — %s", event, key, summary)
        return _record(
            db, ticket, "jira", event, project, "sent",
            subject=summary, detail=f"mode=log key={key}",
        )

    return _record(db, ticket, "jira", event, project, "failed", detail="jira mode not configured")


def dispatch_ticket_created(db: Session, ticket: Ticket) -> list[Notification]:
    sent: list[Notification] = []
    subject = EMAIL_SUBJECTS["ticket_created"].format(id=ticket.id)
    body = f"Votre ticket {ticket.id} a été créé.\n\nTitre : {ticket.title}\nPriorité : {ticket.priority}"
    sent.append(_send_email(
        db, ticket, "ticket_created", subject, body, new_status=ticket.status,
    ))

    if ticket.priority in ("P1", "P2"):
        msg = f":rotating_light: *{ticket.priority}* · {ticket.id} · {ticket.title}"
        sent.append(_send_slack(db, ticket, "priority_alert", msg))

    jira = _create_jira(db, ticket, "ticket_created")
    if jira:
        sent.append(jira)
    return sent


def dispatch_status_change(
    db: Session,
    ticket: Ticket,
    old_status: str,
    new_status: str,
    *,
    comment: str | None = None,
) -> list[Notification]:
    sent: list[Notification] = []
    old_s = normalize_status(old_status)
    new_s = normalize_status(new_status)
    event_key = STATUS_EMAIL_EVENTS.get((old_s, new_s))

    if event_key:
        subject = EMAIL_SUBJECTS[event_key].format(id=ticket.id)
        body = (
            f"Bonjour,\n\nLe statut de votre ticket {ticket.id} a changé.\n"
            f"Nouveau statut : {new_s}\n\nTitre : {ticket.title}"
        )
        sent.append(_send_email(
            db, ticket, event_key, subject, body,
            new_status=new_s, comment=comment,
        ))

    if new_s == "inprog" and old_s in ("resolved", "closed"):
        subject = EMAIL_SUBJECTS["ticket_reopened"].format(id=ticket.id)
        body = f"Le ticket {ticket.id} a été réouvert.\n\nTitre : {ticket.title}"
        sent.append(_send_email(
            db, ticket, "ticket_reopened", subject, body,
            new_status=new_s, comment=comment,
        ))
        msg = f":repeat: Ticket réouvert · {ticket.id} · {ticket.title}"
        sent.append(_send_slack(db, ticket, "ticket_reopened", msg))

    if new_s == "inprog" and ticket.priority in ("P1", "P2"):
        msg = f":eyes: *{ticket.priority}* pris en charge · {ticket.id} · {ticket.title}"
        sent.append(_send_slack(db, ticket, "status_in_progress", msg))

    return sent


def dispatch_comment(
    db: Session,
    ticket: Ticket,
    author_role: str,
    text: str,
) -> list[Notification]:
    sent: list[Notification] = []
    if author_role in ("it", "admin"):
        subject = EMAIL_SUBJECTS["comment_it"].format(id=ticket.id)
        body = f"Nouveau commentaire TI sur {ticket.id} :\n\n{text}"
        sent.append(_send_email(
            db, ticket, "comment_it", subject, body,
            new_status=ticket.status, comment=text,
        ))
    elif ticket.priority in ("P1", "P2"):
        msg = f":speech_balloon: Réponse employé · {ticket.id} · {text[:120]}"
        sent.append(_send_slack(db, ticket, "comment_enduser", msg))
    return sent


def get_notification_config() -> dict:
    settings = get_settings()
    email_mode = settings.notify_email_mode
    if email_mode == "graph" and not settings.graph_email_ready:
        email_mode = "graph (misconfigured)"
    return {
        "enabled": settings.notifications_enabled,
        "channels": {
            "email": {
                "mode": email_mode,
                "active": settings.notifications_enabled,
                "graph_configured": settings.graph_email_ready,
                "sender": settings.graph_sender_email or None,
            },
            "slack": {
                "active": settings.notifications_enabled and bool(settings.notify_slack_webhook_url),
                "channel": settings.notify_slack_channel,
                "mode": "webhook" if settings.notify_slack_webhook_url else "log",
            },
            "jira": {
                "active": settings.notifications_enabled and settings.notify_jira_enabled,
                "mode": settings.notify_jira_mode,
                "project": settings.notify_jira_project,
                "categories": settings.jira_categories_list,
            },
        },
    }
