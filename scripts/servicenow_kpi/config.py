"""Configuration — ServiceNow weekly KPI reporting."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────────

PACKAGE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = PACKAGE_DIR.parent.parent
CACHE_DIR = PACKAGE_DIR / ".cache"
DEFAULT_SNAPSHOT = CACHE_DIR / "servicenow_snapshot.csv"
DEFAULT_CSV = DEFAULT_SNAPSHOT  # cache optionnel écrit par l'API (lecture = ServiceNow)
REPORTS_DIR = PROJECT_ROOT / "reports" / "weekly"
CHARTS_CACHE_DIR = PACKAGE_DIR / ".charts_cache"

# ── ServiceNow export columns (French) ────────────────────────────────────────

COLUMN_MAP = {
    "Requérant": "requester",
    "Catégorie de Ticket": "category",
    "Date du signalement": "reported_at",
    "Titre": "title",
    "Description du problème": "description",
    "Priorité": "priority",
    "Attribuée à": "assignee",
    "Statut": "status",
    "Commentaire": "comment",
    "Source du problème": "source",
    "Created": "created",
    "Superviseur": "supervisor",
    "Date de résolution": "resolved_at",
    "Date de fermeture": "closed_at",
    "Durée de résolution (minutes)": "resolution_minutes",
    "Durée de résolution (hh:mm)": "resolution_hhmm",
    "SLA respecté": "sla_met",
}

REQUIRED_COLUMNS = {"Created", "Statut", "Priorité", "Catégorie de Ticket"}

# ── Business rules ────────────────────────────────────────────────────────────

COMPLETED_STATUSES = frozenset({
    "terminée", "terminee", "terminé", "termine",
    "résolu", "resolu", "résolue", "resolue",
    "fermé", "ferme", "fermée", "fermee",
    "closed", "resolved", "completed", "done",
    "annulé", "annule", "annulée", "annulee",
    "cancelled", "canceled",
})

NEW_STATUSES = frozenset({
    "nouveau", "new", "ouvert", "open",
})

PRIORITY_ORDER = [
    "Critique (dans la prochaine minute)",
    "Élevé (dans l'heure)",
    "Moyen (dans la journée)",
    "Faible (dans la semaine)",
    "Planifié",
]

PRIORITY_SHORT = {
    "Critique (dans la prochaine minute)": "P1 Critique",
    "Élevé (dans l'heure)": "P2 Élevé",
    "Moyen (dans la journée)": "P3 Moyen",
    "Faible (dans la semaine)": "P4 Faible",
    "Planifié": "Planifié",
}

PRIORITY_FROM_SHORT = {
    "Critique": "Critique (dans la prochaine minute)",
    "Élevé": "Élevé (dans l'heure)",
    "Elevé": "Élevé (dans l'heure)",
    "Moyen": "Moyen (dans la journée)",
    "Faible": "Faible (dans la semaine)",
    "Planifié": "Planifié",
    "Planifie": "Planifié",
}

DATE_FORMATS = ("%d/%m/%Y %H:%M", "%d/%m/%Y %H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d")

# SharePoint list « Tickets » — champs de référence (données réelles uniquement)
UNIQUE_ID_FIELD = "ID"
DATE_FIELD = "Created"
SHAREPOINT_LIST_URL = "https://pmgqc.sharepoint.com/sites/ServiceNow/Lists/Tickets"

# ── Report branding ───────────────────────────────────────────────────────────

BRAND = {
    "primary": "#1660CF",
    "primary_dark": "#082E66",
    "success": "#16A34A",
    "warning": "#D97706",
    "critical": "#DC2626",
    "ink": "#0B0D10",
    "muted": "#6B7280",
    "border": "#E5E7EB",
    "bg": "#F8FAFC",
}


@dataclass
class ReportConfig:
    """Runtime options for report generation."""

    csv_path: Path = field(default_factory=lambda: DEFAULT_CSV)
    output_dir: Path = field(default_factory=lambda: REPORTS_DIR)
    reference_date: str | None = None  # ISO date; default = max(created) in data
    lang: str = "fr"
    top_n: int = 10
    trend_weeks: int = 2
    organization: str = "PMG Helpdesk"
    source_label: str = "SharePoint — Liste Tickets"
    weekly_cap: int | None = 25
    current_week_only: bool = False
    period_start: str | None = None  # ISO YYYY-MM-DD
    period_end: str | None = None
    volume_only: bool = False  # ignore statut, durée, SLA — volume réel uniquement
    exclude_weekends: bool = True  # exclure tickets créés samedi/dimanche
    snow_instance: str | None = None
    week_mode: str = "production"  # production | test_current

    def ensure_dirs(self) -> None:
        self.output_dir.mkdir(parents=True, exist_ok=True)
        CHARTS_CACHE_DIR.mkdir(parents=True, exist_ok=True)
        CACHE_DIR.mkdir(parents=True, exist_ok=True)


@dataclass
class GraphConfig:
    """Microsoft Graph / SharePoint List connection."""

    tenant_id: str | None = None
    client_id: str | None = None
    client_secret: str | None = None
    site_host: str | None = None
    site_path: str = "/sites/ServiceNow"
    list_name: str = "Tickets"
    list_id: str | None = None
    site_id: str | None = None
    sender_upn: str | None = None
    email_to: list[str] = field(default_factory=list)
    email_subject: str = "Rapport hebdomadaire KPI - PMG Helpdesk"


@dataclass
class EmailConfig:
    """Email delivery — Graph (preferred) or SMTP fallback."""

    to_addrs: list[str] = field(default_factory=list)
    subject: str = "Rapport hebdomadaire KPI - PMG Helpdesk"
    sender_upn: str | None = None
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_user: str | None = None
    smtp_password: str | None = None
    from_addr: str | None = None
    prefer_graph: bool = True
