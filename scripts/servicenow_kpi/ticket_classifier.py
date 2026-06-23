"""Classify ticket titles into applications vs equipment vs other."""

from __future__ import annotations

import re
import unicodedata
from typing import Literal

import pandas as pd

ClassificationKind = Literal["application", "equipment", "excluded", "other"]

# Canonical application labels (graph « Top applications »)
APPLICATION_LABELS = (
    "RingCentral",
    "DSQ",
    "AVD / Remote Desktop",
    "Kroll",
    "Scanner",
    "Parcours CRM",
    "UKG",
    "Portail RAMQ",
    "Boîte QC (Outlook)",
)

# Canonical equipment labels (graph « Types de tickets / équipements »)
EQUIPMENT_LABELS = (
    "Imprimante",
    "Souris",
    "Casque bluetooth",
    "Ordinateur gelé",
)


def _normalize(text: object) -> str:
    if pd.isna(text):
        return ""
    raw = str(text).strip()
    decomposed = unicodedata.normalize("NFKD", raw)
    ascii_text = decomposed.encode("ascii", "ignore").decode("ascii")
    return re.sub(r"\s+", " ", ascii_text.lower())


def _contains_any(text: str, *needles: str) -> bool:
    return any(n in text for n in needles)


def classify_title(title: object) -> tuple[str | None, str | None, ClassificationKind]:
    """
    Return (application_label, equipment_label, kind).
    Tickets are always counted in totals; only application/equipment labels feed charts.
    """
    t = _normalize(title)
    if not t:
        return None, None, "other"

    # ── Exclusions (counted in total, hidden from application chart) ─────────
    if _contains_any(
        t,
        "demande d'arrivee",
        "arrive d'employe",
        "arrivee d'employe",
        "shortkey",
        "shortkeys",
        "shortcut",
    ):
        return None, None, "excluded"

    # ── Equipment (priority over applications) ───────────────────────────────
    if _contains_any(t, "imprimante", "printer", "impression"):
        return None, "Imprimante", "equipment"

    if _contains_any(t, "souris", "mouse"):
        return None, "Souris", "equipment"

    if _contains_any(t, "casque", "bluetooh", "bluetooth", "ecouteur"):
        return None, "Casque bluetooth", "equipment"

    if _contains_any(
        t,
        "ordinateur gele",
        "ordi gele",
        "ordinateir geler",
        "geler",
        "gele",
        "frozen",
        "ne s'ouvre pas",
        "n'arrive pas a ouvrir",
        "n'arrive pas a ce connecter",
        "ordi en general",
        "ordi general",
        "ordinateur en general",
        "acces pour ouvrir ordi",
    ):
        return None, "Ordinateur gelé", "equipment"

    if _contains_any(t, "clavier", "keyboard"):
        return None, "Clavier", "equipment"

    # Plain « boite qc » without Outlook context → not an application
    if _contains_any(t, "boite qc", "boite courriel") and "outlook" not in t and "courriel" not in t:
        return None, None, "excluded"

    # ── Applications ─────────────────────────────────────────────────────────
    if _contains_any(t, "ringcentral", "ring central"):
        return "RingCentral", None, "application"

    if "dsq" in t:
        return "DSQ", None, "application"

    if _contains_any(t, "avd", "remote desktop", "remote desktop"):
        return "AVD / Remote Desktop", None, "application"

    if "kroll" in t:
        return "Kroll", None, "application"

    if _contains_any(t, "scanner", "scaner"):
        return "Scanner", None, "application"

    if _contains_any(t, "parcours crm"):
        return "Parcours CRM", None, "application"

    if "ukg" in t:
        return "UKG", None, "application"

    if _contains_any(t, "portail ramq", "ramq"):
        return "Portail RAMQ", None, "application"

    if _contains_any(t, "outlook", "courriel qc", "boite qc", "boite courriel", "courriel quebec"):
        return "Boîte QC (Outlook)", None, "application"

    if _contains_any(t, "power bi", "powerbi"):
        return "Power BI", None, "application"

    if _contains_any(t, "biometrx", "biometrix"):
        return "BioMetrx", None, "application"

    return None, None, "other"


def problem_category_label(
    application: str | None,
    equipment: str | None,
    kind: ClassificationKind,
) -> str | None:
    """Single label for combined apps + equipment chart."""
    if kind == "excluded":
        return None
    return equipment or application or ("Autres" if kind == "other" else None)


def top_n_plus_others(counts: dict[str, int], top_n: int = 10) -> dict[str, int]:
    """Top N categories + rollup remaining into « Autres »."""
    if not counts:
        return {}
    items = sorted(counts.items(), key=lambda x: (-x[1], x[0]))
    head = dict(items[:top_n])
    tail_sum = sum(v for _, v in items[top_n:])
    if tail_sum > 0:
        head["Autres"] = head.get("Autres", 0) + tail_sum
    return head


def apply_classification(df: pd.DataFrame) -> pd.DataFrame:
    """Add application_label, equipment_label, classification_kind columns."""
    out = df.copy()
    apps: list[str | None] = []
    equip: list[str | None] = []
    kinds: list[ClassificationKind] = []

    for title in out.get("title", pd.Series(dtype=str)):
        app, eq, kind = classify_title(title)
        apps.append(app)
        equip.append(eq)
        kinds.append(kind)

    out["application_label"] = apps
    out["equipment_label"] = equip
    out["classification_kind"] = kinds
    out["problem_category"] = [
        problem_category_label(a, e, k) for a, e, k in zip(apps, equip, kinds)
    ]
    return out


def count_by_column(df: pd.DataFrame, column: str, top_n: int = 15) -> dict[str, int]:
    if df.empty or column not in df.columns:
        return {}
    series = df[column].dropna()
    series = series[series.astype(str).str.len() > 0]
    if series.empty:
        return {}
    counts = series.value_counts().head(top_n)
    return {str(k): int(v) for k, v in counts.items()}


def count_combined_problems(df: pd.DataFrame, top_n: int = 10) -> dict[str, int]:
    """Apps + equipment merged; top N + Autres."""
    if df.empty or "problem_category" not in df.columns:
        return {}
    series = df["problem_category"].dropna()
    raw = {str(k): int(v) for k, v in series.value_counts().items()}
    return top_n_plus_others(raw, top_n)
