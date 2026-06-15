"""Email delivery — Microsoft Graph sendMail (preferred) or SMTP fallback."""

from __future__ import annotations

import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path

from config import EmailConfig
from env_loader import azure_credentials, graph_email_recipients, graph_sender_upn
from graph_client import GRAPH_BASE, GraphClient


def _parse_recipients(value: str | None) -> list[str]:
    if not value:
        return []
    return [addr.strip() for addr in value.split(",") if addr.strip()]


def email_config_from_env() -> EmailConfig:
    return EmailConfig(
        to_addrs=graph_email_recipients(),
        subject=os.getenv("EMAIL_SUBJECT", "Rapport hebdomadaire KPI — PMG Helpdesk"),
        sender_upn=graph_sender_upn(),
        smtp_host=os.getenv("SMTP_HOST"),
        smtp_port=int(os.getenv("SMTP_PORT", "587")),
        smtp_user=os.getenv("SMTP_USER"),
        smtp_password=os.getenv("SMTP_PASSWORD"),
        from_addr=os.getenv("SMTP_FROM"),
        prefer_graph=os.getenv("EMAIL_PREFER_GRAPH", "true").lower() != "false",
    )


def send_report_via_graph(
    html: str,
    *,
    to_addrs: list[str],
    sender_upn: str,
    subject: str = "Rapport hebdomadaire KPI — PMG Helpdesk",
    client: GraphClient | None = None,
) -> None:
    """Send HTML report using Microsoft Graph /users/{upn}/sendMail."""
    if not to_addrs:
        raise ValueError("At least one recipient is required.")
    if not sender_upn:
        raise ValueError("GRAPH_SENDER_UPN is required for Graph email.")

    graph = client or GraphClient()
    payload = {
        "message": {
            "subject": subject,
            "body": {"contentType": "HTML", "content": html},
            "toRecipients": [
                {"emailAddress": {"address": addr}} for addr in to_addrs
            ],
        },
        "saveToSentItems": True,
    }
    url = f"{GRAPH_BASE}/users/{sender_upn}/sendMail"
    graph.post(url, payload)


def send_report_via_smtp(
    report_path: Path,
    *,
    to_addrs: list[str],
    subject: str = "Rapport hebdomadaire KPI — PMG Helpdesk",
    smtp_host: str | None = None,
    smtp_port: int = 587,
    smtp_user: str | None = None,
    smtp_password: str | None = None,
    from_addr: str | None = None,
) -> None:
    """Send HTML report via SMTP."""
    host = smtp_host or os.getenv("SMTP_HOST")
    user = smtp_user or os.getenv("SMTP_USER")
    password = smtp_password or os.getenv("SMTP_PASSWORD")
    sender = from_addr or os.getenv("SMTP_FROM", user)

    if not host or not to_addrs:
        raise ValueError("SMTP_HOST and at least one recipient are required.")

    html = report_path.read_text(encoding="utf-8")
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = sender or "noreply@pmg.local"
    msg["To"] = ", ".join(to_addrs)
    msg.attach(MIMEText(html, "html", "utf-8"))

    with smtplib.SMTP(host, smtp_port) as server:
        server.starttls()
        if user and password:
            server.login(user, password)
        server.sendmail(msg["From"], to_addrs, msg.as_string())


def send_report_email(
    report_path: Path,
    *,
    to_addrs: list[str],
    subject: str = "Rapport hebdomadaire KPI — PMG Helpdesk",
    smtp_host: str | None = None,
    smtp_port: int = 587,
    smtp_user: str | None = None,
    smtp_password: str | None = None,
    from_addr: str | None = None,
) -> None:
    """Backward-compatible SMTP wrapper."""
    send_report_via_smtp(
        report_path,
        to_addrs=to_addrs,
        subject=subject,
        smtp_host=smtp_host,
        smtp_port=smtp_port,
        smtp_user=smtp_user,
        smtp_password=smtp_password,
        from_addr=from_addr,
    )


def send_report_automatically(
    report_path: Path,
    email: EmailConfig | None = None,
    *,
    html: str | None = None,
) -> str:
    """
    Send report via Graph if configured, otherwise SMTP.
    Returns the channel used: 'graph' or 'smtp'.
    """
    cfg = email or email_config_from_env()
    body = html or report_path.read_text(encoding="utf-8")

    graph_ready = False
    if cfg.prefer_graph and cfg.sender_upn and cfg.to_addrs:
        try:
            azure_credentials()
            graph_ready = True
        except KeyError:
            graph_ready = False

    if graph_ready:
        send_report_via_graph(
            body,
            to_addrs=cfg.to_addrs,
            sender_upn=cfg.sender_upn,
            subject=cfg.subject,
        )
        return "graph"

    send_report_via_smtp(
        report_path,
        to_addrs=cfg.to_addrs,
        subject=cfg.subject,
        smtp_host=cfg.smtp_host,
        smtp_port=cfg.smtp_port,
        smtp_user=cfg.smtp_user,
        smtp_password=cfg.smtp_password,
        from_addr=cfg.from_addr,
    )
    return "smtp"
