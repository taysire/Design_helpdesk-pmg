"""Matplotlib chart generation — embedded as base64 in HTML report."""

from __future__ import annotations

import base64
import io
from typing import Any

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

from config import BRAND, PRIORITY_ORDER


def _fig_to_base64(fig: plt.Figure) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=120, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("ascii")


def _apply_style() -> None:
    plt.rcParams.update({
        "font.family": "Segoe UI, Arial, sans-serif",
        "font.size": 10,
        "axes.titlesize": 12,
        "axes.titleweight": "bold",
        "axes.edgecolor": BRAND["border"],
        "axes.labelcolor": BRAND["ink"],
        "xtick.color": BRAND["muted"],
        "ytick.color": BRAND["muted"],
        "figure.facecolor": "white",
    })


def chart_volume_trend(history: list[dict[str, Any]]) -> str:
    _apply_style()
    labels = [h["label"] for h in history]
    created = [h["created"] for h in history]
    completed = [h["completed"] for h in history]

    x = range(len(labels))
    width = 0.35
    fig, ax = plt.subplots(figsize=(9, 4))
    ax.bar([i - width / 2 for i in x], created, width, label="Créés", color=BRAND["primary"], alpha=0.9)
    ax.bar([i + width / 2 for i in x], completed, width, label="Clôturés (statut)", color=BRAND["success"], alpha=0.85)
    ax.set_xticks(list(x))
    ax.set_xticklabels(labels, rotation=0)
    ax.set_ylabel("Tickets")
    ax.set_title("Volume hebdomadaire — tendance")
    ax.legend(frameon=False)
    ax.grid(axis="y", linestyle="--", alpha=0.4)
    ax.spines[["top", "right"]].set_visible(False)
    return _fig_to_base64(fig)


def chart_priority_comparison(current: dict[str, int], previous: dict[str, int]) -> str:
    _apply_style()
    keys = list(dict.fromkeys(
        [k for k in PRIORITY_ORDER if k in current or k in previous]
        + list(current.keys()) + list(previous.keys())
    ))[:6]
    if not keys:
        keys = ["Aucune donnée"]

    cur = [current.get(k, 0) for k in keys]
    prev = [previous.get(k, 0) for k in keys]
    short = [k.split("(")[0].strip()[:18] for k in keys]

    x = range(len(keys))
    width = 0.35
    fig, ax = plt.subplots(figsize=(9, 4))
    ax.bar([i - width / 2 for i in x], prev, width, label="Semaine préc.", color="#94A3B8", alpha=0.9)
    ax.bar([i + width / 2 for i in x], cur, width, label="Semaine cour.", color=BRAND["primary"], alpha=0.9)
    ax.set_xticks(list(x))
    ax.set_xticklabels(short, rotation=15, ha="right")
    ax.set_ylabel("Tickets")
    ax.set_title("Répartition par priorité")
    ax.legend(frameon=False)
    ax.grid(axis="y", linestyle="--", alpha=0.4)
    ax.spines[["top", "right"]].set_visible(False)
    return _fig_to_base64(fig)


def chart_horizontal_bar(data: dict[str, int], title: str, color: str | None = None) -> str:
    _apply_style()
    if not data:
        data = {"Aucune donnée": 0}
    labels = list(data.keys())[::-1]
    values = [data[k] for k in labels][::-1]

    fig, ax = plt.subplots(figsize=(8, max(3, len(labels) * 0.45)))
    ax.barh(labels, values, color=color or BRAND["primary"], alpha=0.88)
    ax.set_title(title)
    ax.set_xlabel("Tickets")
    ax.grid(axis="x", linestyle="--", alpha=0.4)
    ax.spines[["top", "right"]].set_visible(False)
    return _fig_to_base64(fig)


def chart_status_pie(status_data: dict[str, int]) -> str:
    _apply_style()
    if not status_data:
        status_data = {"N/A": 1}
    labels = list(status_data.keys())
    sizes = list(status_data.values())
    colors = [BRAND["primary"], BRAND["success"], BRAND["warning"], BRAND["critical"], "#94A3B8", "#CBD5E1"]

    fig, ax = plt.subplots(figsize=(6, 5))
    ax.pie(sizes, labels=labels, autopct="%1.0f%%", startangle=140,
           colors=colors[:len(labels)], textprops={"fontsize": 9})
    ax.set_title("Répartition par statut (export)")
    return _fig_to_base64(fig)


def chart_two_week_comparison(kpis: dict[str, Any]) -> str:
    _apply_style()
    s = kpis["summary"]
    labels = ["Sem. précédente", "Sem. courante"]
    created = [s["created_last_week"], s["created_this_week"]]
    completed = [s["completed_last_week"], s["completed_this_week"]]
    sla = [s.get("sla_previous_sla_compliance_pct", 0), s.get("sla_current_sla_compliance_pct", 0)]

    fig, axes = plt.subplots(1, 2, figsize=(10, 4))

    x = range(2)
    width = 0.35
    axes[0].bar([i - width / 2 for i in x], created, width, label="Créés", color=BRAND["primary"], alpha=0.9)
    axes[0].bar([i + width / 2 for i in x], completed, width, label="Clôturés", color=BRAND["success"], alpha=0.85)
    axes[0].set_xticks(list(x))
    axes[0].set_xticklabels(labels)
    axes[0].set_title("Volume — 2 semaines")
    axes[0].legend(frameon=False, fontsize=9)
    axes[0].grid(axis="y", linestyle="--", alpha=0.35)
    axes[0].spines[["top", "right"]].set_visible(False)

    colors = [BRAND["success"] if v >= 90 else BRAND["warning"] if v >= 75 else BRAND["critical"] for v in sla]
    axes[1].bar(labels, sla, color=colors, alpha=0.9)
    axes[1].set_ylim(0, 105)
    axes[1].set_ylabel("%")
    axes[1].set_title("Conformité SLA")
    axes[1].axhline(90, color="#94A3B8", linestyle="--", linewidth=1, alpha=0.6)
    axes[1].grid(axis="y", linestyle="--", alpha=0.35)
    axes[1].spines[["top", "right"]].set_visible(False)

    fig.tight_layout()
    return _fig_to_base64(fig)


def build_all_charts(kpis: dict[str, Any]) -> dict[str, str]:
    return {
        "two_weeks": chart_two_week_comparison(kpis),
        "volume_trend": chart_volume_trend(kpis["volume_history"]),
        "priority": chart_priority_comparison(
            kpis["by_priority"]["current_week"],
            kpis["by_priority"]["previous_week"],
        ),
        "category": chart_horizontal_bar(
            kpis["by_category"]["current_week"],
            "Top catégories — semaine courante",
            BRAND["primary_dark"],
        ),
        "assignee": chart_horizontal_bar(
            kpis["by_assignee"]["current_week"],
            "Charge par assigné — semaine courante",
            BRAND["warning"],
        ),
        "requester": chart_horizontal_bar(
            kpis["by_requester"]["current_week"],
            "Top requérants — semaine courante",
            "#0891B2",
        ),
        "status": chart_status_pie(kpis["by_status"].get("two_weeks") or kpis["by_status"]["current_week"]),
    }
