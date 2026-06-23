"""Matplotlib chart generation — embedded as base64 in HTML report."""

from __future__ import annotations

import base64
import io
from typing import Any

import matplotlib
import pandas as pd

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


def chart_volume_trend(history: list[dict[str, Any]], *, volume_only: bool = False) -> str:
    _apply_style()
    labels = [h["label"] for h in history]
    created = [h["created"] for h in history]

    x = range(len(labels))
    fig, ax = plt.subplots(figsize=(9, 4))
    if volume_only:
        ax.bar(list(x), created, color=BRAND["primary"], alpha=0.9, label="Tickets créés")
        ax.set_title("Évolution du volume — tickets créés")
    else:
        completed = [h["completed"] for h in history]
        width = 0.35
        ax.bar([i - width / 2 for i in x], created, width, label="Créés", color=BRAND["primary"], alpha=0.9)
        ax.bar([i + width / 2 for i in x], completed, width, label="Clôturés (statut)", color=BRAND["success"], alpha=0.85)
        ax.set_title("Volume hebdomadaire — tendance")
        ax.legend(frameon=False)
    ax.set_xticks(list(x))
    ax.set_xticklabels(labels, rotation=0)
    ax.set_ylabel("Tickets")
    ax.grid(axis="y", linestyle="--", alpha=0.4)
    ax.spines[["top", "right"]].set_visible(False)
    return _fig_to_base64(fig)


def chart_daily_volume(daily_counts: dict[str, int], title: str = "Tickets crees par jour (lun-ven)") -> str:
    _apply_style()
    if not daily_counts:
        daily_counts = {"N/A": 0}
    days = sorted(daily_counts.keys())
    values = [daily_counts[d] for d in days]
    labels = [pd.Timestamp(d).strftime("%d/%m") for d in days]

    fig, ax = plt.subplots(figsize=(10, 4))
    bars = ax.bar(labels, values, color=BRAND["primary"], alpha=0.9, width=0.65)
    ax.set_ylabel("Tickets créés")
    ax.set_title(title)
    ax.grid(axis="y", linestyle="--", alpha=0.35)
    ax.spines[["top", "right"]].set_visible(False)
    for bar, val in zip(bars, values):
        if val > 0:
            ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.3, str(val),
                    ha="center", va="bottom", fontweight="bold", fontsize=9)
    fig.tight_layout()
    return _fig_to_base64(fig)


# Palette alignée sur le rapport de référence (apps + équipements)
COMBINED_PALETTE = {
    "Imprimante": "#1ABC9C",
    "Kroll": "#F9E79F",
    "RingCentral": "#BB8FCE",
    "Scanner": "#E74C3C",
    "DSQ": "#5DADE2",
    "Power BI": "#82E0AA",
    "AVD / Remote Desktop": "#F1948A",
    "BioMetrx": "#AF7AC5",
    "Clavier": "#A9DFBF",
    "Souris": "#85C1E9",
    "Casque bluetooth": "#D7BDE2",
    "Ordinateur gelé": "#F5B7B1",
    "Parcours CRM": "#76D7C4",
    "UKG": "#F8C471",
    "Portail RAMQ": "#AED6F1",
    "Boîte QC (Outlook)": "#D5DBDB",
    "Autres": "#F4D03F",
}


def _color_for_category(name: str, idx: int) -> str:
    if name in COMBINED_PALETTE:
        return COMBINED_PALETTE[name]
    fallback = ["#48C9B0", "#F7DC6F", "#C39BD3", "#EC7063", "#5499C7", "#58D68D"]
    return fallback[idx % len(fallback)]


def chart_combined_problems(data: dict[str, int], period_label: str = "") -> str:
    """
    Donut + barres horizontales — applications et équipements combinés.
    Style : « IT Support Requests Analysis (Combined Data) ».
    """
    _apply_style()
    if not data:
        data = {"Aucune donnée": 0}

    labels = list(data.keys())
    values = [data[k] for k in labels]
    colors = [_color_for_category(lbl, i) for i, lbl in enumerate(labels)]
    total = sum(values) or 1

    fig, axes = plt.subplots(1, 2, figsize=(14, max(5.5, len(labels) * 0.38)))
    fig.suptitle(
        "Analyse des demandes TI — données combinées",
        fontsize=15, fontweight="bold", y=1.02,
    )

    # Donut — distribution %
    wedges, _, autotexts = axes[0].pie(
        values,
        labels=None,
        autopct=lambda pct: f"{pct:.1f}%" if pct >= 3 else "",
        startangle=90,
        colors=colors,
        pctdistance=0.75,
        wedgeprops={"width": 0.42, "edgecolor": "white", "linewidth": 1.5},
    )
    for t in autotexts:
        t.set_fontsize(8)
        t.set_fontweight("bold")
    axes[0].set_title("Distribution des problèmes TI\n(Top 10 + Autres)", fontsize=11, pad=12)
    legend_labels = [f"{lbl} ({val})" for lbl, val in zip(labels, values)]
    axes[0].legend(
        wedges, legend_labels,
        loc="center left", bbox_to_anchor=(-0.35, 0.5),
        fontsize=8, frameon=False,
    )

    # Barres horizontales — occurrences
    y_pos = range(len(labels))
    bars = axes[1].barh(list(y_pos), values, color=colors, alpha=0.92, height=0.7)
    axes[1].set_yticks(list(y_pos))
    axes[1].set_yticklabels(labels)
    axes[1].invert_yaxis()
    axes[1].set_xlabel("Occurrences")
    axes[1].set_title("Catégories de problèmes — Top", fontsize=11, pad=12)
    axes[1].grid(axis="x", linestyle="--", alpha=0.3)
    axes[1].spines[["top", "right"]].set_visible(False)
    for bar, val in zip(bars, values):
        axes[1].text(
            bar.get_width() + max(values) * 0.02, bar.get_y() + bar.get_height() / 2,
            str(val), va="center", fontweight="bold", fontsize=10,
        )

    subtitle = "À quoi votre problème est associé ?"
    if period_label:
        subtitle += f"  ·  Période : {period_label}"
    fig.text(0.5, 0.96, subtitle, ha="center", fontsize=10, color=BRAND["muted"])

    fig.tight_layout(rect=[0.08, 0, 1, 0.93])
    return _fig_to_base64(fig)


def _breakdown_lines(data: dict[str, int], *, top_n: int = 10) -> tuple[list[str], int, int]:
    if not data:
        return ["Aucune donnée"], 0, 0
    total = sum(data.values())
    ranked = sorted(data.items(), key=lambda x: -x[1])
    top_items = ranked[:top_n]
    top_keys = {k for k, _ in top_items}
    autres = sum(v for k, v in ranked if k not in top_keys)
    lines = []
    for label, count in top_items:
        pct = count / total * 100 if total else 0
        lines.append(f"  {label}: {count} ({pct:.1f}%)")
    if autres:
        pct = autres / total * 100 if total else 0
        lines.append(f"  Autres: {autres} ({pct:.1f}%)")
    return lines, total, len(data)


def _draw_proportional_bar(ax, data: dict[str, int], *, top_n: int = 8) -> None:
    ranked = sorted(data.items(), key=lambda x: -x[1])[:top_n]
    if not ranked:
        ax.text(0.5, 0.5, "Aucune donnée", ha="center", va="center")
        ax.set_axis_off()
        return
    total = sum(v for _, v in ranked) or 1
    left = 0.0
    legend_patches = []
    for idx, (label, val) in enumerate(ranked):
        width = val / total
        color = _color_for_category(label, idx)
        ax.barh(0, width, left=left, height=0.55, color=color, edgecolor="white", linewidth=1.2)
        if width >= 0.08:
            ax.text(
                left + width / 2, 0, f"{label}\n({val})",
                ha="center", va="center", fontsize=7.5, fontweight="bold", color="#1a1a1a",
            )
        legend_patches.append((label, val, color))
        left += width
    ax.set_xlim(0, 1)
    ax.set_ylim(-0.6, 0.6)
    ax.set_yticks([])
    ax.set_xticks([])
    ax.set_xlabel("Proportion relative (Top 8)", fontsize=9, color=BRAND["muted"])
    ax.spines[["top", "right", "left"]].set_visible(False)


def chart_problem_type_dashboard(
    previous: dict[str, int],
    current: dict[str, int],
    *,
    label_previous: str = "Semaine 1",
    label_current: str = "Semaine 2",
) -> str:
    """
    Tableau + barre proportionnelle pour chaque semaine (style capture de référence).
    """
    _apply_style()
    fig = plt.figure(figsize=(15, 9))
    fig.suptitle(
        "Évolution des types de problèmes — Applications & Équipements",
        fontsize=16, fontweight="bold", y=0.98,
    )
    fig.text(
        0.5, 0.94,
        "Répartition par catégorie · Comparaison semaine précédente vs semaine courante",
        ha="center", fontsize=10, color=BRAND["muted"],
    )

    grid = fig.add_gridspec(2, 2, hspace=0.45, wspace=0.28, left=0.06, right=0.97, top=0.90, bottom=0.06)

    for row, (data, week_label) in enumerate([(previous, label_previous), (current, label_current)]):
        lines, total, unique = _breakdown_lines(data)
        text_content = (
            f"Problem Type Breakdown:\n"
            f"({week_label})\n\n"
            + "\n".join(lines)
            + f"\n\nTotal Issues: {total}\nUnique Problem Types: {unique}"
        )

        ax_text = fig.add_subplot(grid[row, 0])
        ax_text.set_axis_off()
        ax_text.add_patch(plt.Rectangle(
            (0.02, 0.02), 0.96, 0.96,
            transform=ax_text.transAxes,
            facecolor="#FFF9E6", edgecolor="#E8D48B", linewidth=1.5, zorder=0,
        ))
        ax_text.text(
            0.05, 0.95, text_content,
            transform=ax_text.transAxes, va="top", ha="left",
            fontsize=9, fontfamily="monospace", linespacing=1.45, zorder=1,
        )

        ax_bar = fig.add_subplot(grid[row, 1])
        ax_bar.set_title(f"Proportional View (Top 8) — {week_label}", fontsize=11, pad=10, fontweight="bold")
        _draw_proportional_bar(ax_bar, data)

    return _fig_to_base64(fig)


def chart_category_evolution_arrows(
    previous: dict[str, int],
    current: dict[str, int],
    *,
    top_n: int = 10,
) -> str:
    """Barres groupées avec flèches d'évolution entre semaines."""
    _apply_style()
    keys = sorted(
        set(previous) | set(current),
        key=lambda k: -(current.get(k, 0) + previous.get(k, 0)),
    )[:top_n]
    if not keys:
        keys = ["Aucune donnée"]
    prev_vals = [previous.get(k, 0) for k in keys]
    cur_vals = [current.get(k, 0) for k in keys]
    x = range(len(keys))
    width = 0.36
    fig, ax = plt.subplots(figsize=(12, max(4.5, len(keys) * 0.5)))
    ax.bar([i - width / 2 for i in x], prev_vals, width, label="Semaine précédente", color="#94A3B8", alpha=0.92)
    ax.bar([i + width / 2 for i in x], cur_vals, width, label="Semaine courante", color=BRAND["primary"], alpha=0.92)
    for i, (p, c) in enumerate(zip(prev_vals, cur_vals)):
        delta = c - p
        if delta > 0:
            arrow, color = "↑", BRAND["critical"]
        elif delta < 0:
            arrow, color = "↓", BRAND["success"]
        else:
            arrow, color = "→", BRAND["muted"]
        ax.text(i + width / 2 + 0.15, max(p, c) + 0.3, f"{arrow}{abs(delta)}", color=color, fontweight="bold", fontsize=9)
    ax.set_xticks(list(x))
    ax.set_xticklabels([k[:22] for k in keys], rotation=25, ha="right")
    ax.set_ylabel("Tickets")
    ax.set_title("Évolution par catégorie — semaine précédente vs courante")
    ax.legend(frameon=False, loc="upper right")
    ax.grid(axis="y", linestyle="--", alpha=0.35)
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    return _fig_to_base64(fig)


def chart_combined_comparison(
    previous: dict[str, int],
    current: dict[str, int],
    top_n: int = 10,
) -> str:
    """Comparaison sem. 1 vs sem. 2 — catégories combinées."""
    _apply_style()
    all_keys = list(dict.fromkeys(list(current.keys()) + list(previous.keys())))
    ranked = sorted(all_keys, key=lambda k: current.get(k, 0) + previous.get(k, 0), reverse=True)
    keys = ranked[:top_n] or ["Aucune donnée"]
    prev = [previous.get(k, 0) for k in keys]
    cur = [current.get(k, 0) for k in keys]
    x = range(len(keys))
    width = 0.35
    fig, ax = plt.subplots(figsize=(10, max(4, len(keys) * 0.45)))
    ax.barh([i - width / 2 for i in x], prev, width, label="Semaine 1", color="#94A3B8", alpha=0.9)
    ax.barh([i + width / 2 for i in x], cur, width, label="Semaine 2", color=BRAND["primary"], alpha=0.9)
    ax.set_yticks(list(x))
    ax.set_yticklabels(keys)
    ax.set_xlabel("Tickets")
    ax.set_title("Applications & équipements — comparaison 2 semaines")
    ax.legend(frameon=False)
    ax.grid(axis="x", linestyle="--", alpha=0.35)
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    return _fig_to_base64(fig)


def chart_applications_period(apps: dict[str, int], title: str = "Applications / systèmes concernés") -> str:
    return chart_horizontal_bar(apps, title, "#0891B2")


def chart_equipment_period(equipment: dict[str, int], title: str = "Types de tickets / équipements") -> str:
    return chart_horizontal_bar(equipment, title, "#7C3AED")


def chart_applications_comparison(
    previous: dict[str, int],
    current: dict[str, int],
    top_n: int = 12,
) -> str:
    _apply_style()
    keys = list(dict.fromkeys(
        list(current.keys()) + [k for k in previous.keys() if k not in current]
    ))[:top_n]
    if not keys:
        keys = ["Aucune donnée"]

    prev = [previous.get(k, 0) for k in keys]
    cur = [current.get(k, 0) for k in keys]
    short = [k[:28] for k in keys]

    x = range(len(keys))
    width = 0.35
    fig, ax = plt.subplots(figsize=(10, max(4, len(keys) * 0.42)))
    ax.barh([i - width / 2 for i in x], prev, width, label="Sem. 1 (1–7 juin)", color="#94A3B8", alpha=0.9)
    ax.barh([i + width / 2 for i in x], cur, width, label="Sem. 2 (8–14 juin)", color=BRAND["primary"], alpha=0.9)
    ax.set_yticks(list(x))
    ax.set_yticklabels(short)
    ax.set_xlabel("Nombre de tickets")
    ax.set_title("Applications concernées — comparaison 2 semaines")
    ax.legend(frameon=False, loc="lower right")
    ax.grid(axis="x", linestyle="--", alpha=0.35)
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    return _fig_to_base64(fig)


def chart_two_week_comparison(kpis: dict[str, Any]) -> str:
    _apply_style()
    s = kpis["summary"]
    cw = kpis["current_week"]
    pw = kpis["previous_week"]
    tw_label = kpis.get("two_week_period", {}).get("label", "")
    labels = [f"Sem. 1\n{pw.range_label}", f"Sem. 2\n{cw.range_label}"]
    created = [s["created_last_week"], s["created_this_week"]]
    volume_only = kpis.get("report_options", {}).get("volume_only", False)

    fig, ax = plt.subplots(figsize=(8, 4))
    colors = ["#94A3B8", BRAND["primary"]]
    bars = ax.bar(labels, created, color=colors, alpha=0.9, width=0.55)
    ax.set_ylabel("Tickets créés")
    ax.set_title(f"Évolution sur 2 semaines{(' — ' + tw_label) if tw_label else ''}")
    ax.grid(axis="y", linestyle="--", alpha=0.35)
    ax.spines[["top", "right"]].set_visible(False)
    for bar, val in zip(bars, created):
        ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.5, str(val),
                ha="center", va="bottom", fontweight="bold", fontsize=12)
    if s.get("volume_change_pct") is not None:
        pct = s["volume_change_pct"]
        sign = f"+{pct}" if pct > 0 else str(pct)
        ax.text(0.5, 0.95, f"Variation sem. 2 vs sem. 1 : {sign}%",
                transform=ax.transAxes, ha="center", va="top", fontsize=10, color=BRAND["muted"])
    if volume_only:
        return _fig_to_base64(fig)

    completed = [s["completed_last_week"], s["completed_this_week"]]
    sla = [s.get("sla_previous_sla_compliance_pct", 0) or 0, s.get("sla_current_sla_compliance_pct", 0) or 0]
    fig, axes = plt.subplots(1, 2, figsize=(10, 4))
    x = range(2)
    width = 0.35
    axes[0].bar([i - width / 2 for i in x], created, width, label="Créés", color=BRAND["primary"], alpha=0.9)
    axes[0].bar([i + width / 2 for i in x], completed, width, label="Clôturés", color=BRAND["success"], alpha=0.85)
    axes[0].set_xticks(list(x))
    axes[0].set_xticklabels(["Sem. préc.", "Sem. cour."])
    axes[0].set_title("Volume — 2 semaines")
    axes[0].legend(frameon=False, fontsize=9)
    axes[0].grid(axis="y", linestyle="--", alpha=0.35)
    axes[0].spines[["top", "right"]].set_visible(False)
    colors_sla = [BRAND["success"] if v >= 90 else BRAND["warning"] if v >= 75 else BRAND["critical"] for v in sla]
    axes[1].bar(["Sem. préc.", "Sem. cour."], sla, color=colors_sla, alpha=0.9)
    axes[1].set_ylim(0, 105)
    axes[1].set_ylabel("%")
    axes[1].set_title("Conformité SLA")
    axes[1].grid(axis="y", linestyle="--", alpha=0.35)
    axes[1].spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    return _fig_to_base64(fig)


def build_all_charts(kpis: dict[str, Any]) -> dict[str, str]:
    volume_only = kpis.get("report_options", {}).get("volume_only", False)
    tw = kpis.get("two_week_period", {})
    period_label = tw.get("label", "")
    combined = kpis.get("by_combined", {})
    pw = kpis.get("previous_week")
    cw = kpis.get("current_week")
    pw_label = pw.range_label if pw else "Semaine 1"
    cw_label = cw.range_label if cw else "Semaine 2"

    charts: dict[str, str] = {
        "problem_evolution": chart_problem_type_dashboard(
            combined.get("previous_week", {}),
            combined.get("current_week", {}),
            label_previous=f"Semaine précédente · {pw_label}",
            label_current=f"Semaine courante · {cw_label}",
        ),
        "category_evolution": chart_category_evolution_arrows(
            combined.get("previous_week", {}),
            combined.get("current_week", {}),
        ),
        "combined_problems": chart_combined_problems(
            combined.get("period", {}),
            period_label=period_label,
        ),
        "combined_cmp": chart_combined_comparison(
            combined.get("previous_week", {}),
            combined.get("current_week", {}),
        ),
        "two_weeks": chart_two_week_comparison(kpis),
        "daily": chart_daily_volume(
            kpis.get("daily_counts", {}),
            "Tickets par jour (lundi-vendredi)",
        ),
        "applications": chart_applications_period(
            kpis.get("by_application", {}).get("period", {}),
            "Applications — période",
        ),
        "equipment": chart_equipment_period(
            kpis.get("by_equipment", {}).get("period", {}),
            "Équipements — période",
        ),
    }
    if not volume_only:
        charts["volume_trend"] = chart_volume_trend(
            kpis["volume_history"], volume_only=volume_only,
        )
        charts.update({
            "priority": chart_priority_comparison(
                kpis["by_priority"]["current_week"],
                kpis["by_priority"]["previous_week"],
            ),
            "status": chart_status_pie(
                kpis["by_status"].get("two_weeks") or kpis["by_status"]["current_week"],
            ),
            "category": chart_horizontal_bar(
                kpis["by_category"]["current_week"],
                "Top catégories — semaine 2",
                BRAND["primary_dark"],
            ),
            "requester": chart_horizontal_bar(
                kpis["by_requester"]["current_week"],
                "Top requérants — semaine 2",
                "#64748B",
            ),
        })
    return charts


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
