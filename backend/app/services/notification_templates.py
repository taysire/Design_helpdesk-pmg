"""HTML/plain templates for ticket notification emails."""

from __future__ import annotations

from html import escape
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.ticket import Ticket

STATUS_LABELS = {
    "new": "Nouveau",
    "inprog": "En cours",
    "waiting_info": "En attente d'information",
    "waiting_vendor": "En attente fournisseur",
    "resolved": "Résolu",
    "closed": "Fermé",
}

ASSIGNEE_LABELS = {
    "jd": "Jordan Dubois",
    "ab": "Abdoul Bagayoko",
    "me": "Non assigné",
}


def _status_label(status: str) -> str:
    return STATUS_LABELS.get(status, status)


def _assignee_label(assignee_id: str | None) -> str:
    if not assignee_id:
        return "Non assigné"
    return ASSIGNEE_LABELS.get(assignee_id, assignee_id)


def _portal_ticket_url(portal_url: str, ticket_id: str) -> str:
    base = portal_url.rstrip("/")
    return f"{base}/#ticket/{ticket_id}"


def build_ticket_email(
    ticket: Ticket,
    *,
    headline: str,
    new_status: str | None = None,
    comment: str | None = None,
    portal_url: str = "http://localhost:8888",
) -> tuple[str, str]:
    """
    Build plain-text and HTML bodies for a ticket notification.
    Returns (plain_text, html).
    """
    status_text = _status_label(new_status) if new_status else _status_label(ticket.status)
    assignee = _assignee_label(ticket.assignee_id)
    link = _portal_ticket_url(portal_url, ticket.id)

    comment_block_plain = ""
    comment_block_html = ""
    if comment:
        comment_block_plain = f"\nCommentaire :\n{comment}\n"
        comment_block_html = (
            f'<div class="comment"><strong>Commentaire</strong><p>{escape(comment)}</p></div>'
        )

    plain = (
        f"Bonjour,\n\n{headline}\n\n"
        f"Ticket : {ticket.id}\n"
        f"Titre : {ticket.title}\n"
        f"Statut : {status_text}\n"
        f"Requérant : {ticket.reporter_id}\n"
        f"Assigné à : {assignee}\n"
        f"{comment_block_plain}\n"
        f"Consulter le ticket : {link}\n\n"
        "— PMG Helpdesk"
    )

    html = f"""<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Segoe UI,system-ui,sans-serif;color:#0B0D10;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:24px 12px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#082E66,#1660CF);padding:24px 28px;color:#ffffff;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;opacity:0.85;">PMG Helpdesk</div>
            <div style="font-size:20px;font-weight:700;margin-top:8px;">{escape(headline)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;line-height:1.5;">
              <tr><td style="padding:8px 0;color:#6B7280;width:140px;">Ticket</td><td style="padding:8px 0;font-weight:700;">{escape(ticket.id)}</td></tr>
              <tr><td style="padding:8px 0;color:#6B7280;">Titre</td><td style="padding:8px 0;">{escape(ticket.title)}</td></tr>
              <tr><td style="padding:8px 0;color:#6B7280;">Statut</td><td style="padding:8px 0;"><span style="background:#EFF6FF;color:#082E66;padding:4px 10px;border-radius:999px;font-weight:600;">{escape(status_text)}</span></td></tr>
              <tr><td style="padding:8px 0;color:#6B7280;">Requérant</td><td style="padding:8px 0;">{escape(ticket.reporter_id)}</td></tr>
              <tr><td style="padding:8px 0;color:#6B7280;">Assigné à</td><td style="padding:8px 0;">{escape(assignee)}</td></tr>
            </table>
            {comment_block_html}
            <div style="margin-top:24px;">
              <a href="{escape(link)}" style="display:inline-block;background:#1660CF;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">Voir le ticket</a>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px;background:#F8FAFC;font-size:12px;color:#6B7280;border-top:1px solid #E5E7EB;">
            Notification automatique — PMG Helpdesk
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

    return plain, html
