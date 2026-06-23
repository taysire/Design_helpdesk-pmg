"""Automatic management recommendations from KPI trends."""

from __future__ import annotations

from typing import Any


def _trend_label(pct: float | None, up_is_bad: bool = True) -> str:
    if pct is None:
        return "stable"
    if abs(pct) < 5:
        return "stable"
    if pct > 0:
        return "hausse" if up_is_bad else "amélioration"
    return "baisse" if up_is_bad else "régression"


def generate_recommendations(kpis: dict[str, Any], lang: str = "fr") -> list[dict[str, str]]:
    s = kpis["summary"]
    volume_only = kpis.get("report_options", {}).get("volume_only", False)
    recs: list[dict[str, str]] = []

    vol = s.get("volume_change_pct")
    created_cur = s["created_this_week"]
    created_prev = s["created_last_week"]
    open_new = s["new_tickets_open"]
    closure = s["closure_rate_pct"]
    week_closure = s["week_closure_rate_current"]
    critical_cur = s["critical_this_week"]
    critical_prev = s["critical_last_week"]

    # SLA compliance
    sla_cur = s.get("sla_current_sla_compliance_pct")
    sla_breaches = s.get("sla_current_sla_breaches", 0)
    if not volume_only and sla_cur is not None and sla_cur < 90 and created_cur > 0:
        recs.append({
            "severity": "warning",
            "title": "Conformité SLA en baisse",
            "body": (
                f"La conformité SLA est à {sla_cur}% cette semaine "
                f"({sla_breaches} dépassements). "
                "Prioriser les tickets critiques et revoir les délais de première réponse."
            ),
        })

    # Volume trend
    if vol is not None and vol > 15:
        recs.append({
            "severity": "warning",
            "title": "Hausse du volume de demandes",
            "body": (
                f"Le volume a augmenté de {vol:+.1f}% cette semaine "
                f"({created_cur} vs {created_prev} la semaine précédente). "
                "Envisager un renfort temporaire ou une revue des catégories récurrentes."
            ),
        })
    elif vol is not None and vol < -15:
        recs.append({
            "severity": "success",
            "title": "Baisse du volume",
            "body": (
                f"Le volume a diminué de {vol:+.1f}% ({created_cur} tickets). "
                "Profiter de la capacité libérée pour traiter le backlog ou documenter les solutions récurrentes."
            ),
        })

    # Backlog
    if not volume_only and open_new > 50:
        recs.append({
            "severity": "critical",
            "title": "Backlog élevé de tickets ouverts",
            "body": (
                f"{open_new} tickets sont encore au statut « Nouveau ». "
                "Prioriser le triage quotidien et définir des objectifs de première réponse."
            ),
        })
    elif not volume_only and open_new > 25:
        recs.append({
            "severity": "warning",
            "title": "Backlog en croissance",
            "body": (
                f"{open_new} tickets ouverts nécessitent un suivi. "
                "Vérifier la charge par assigné et répartir si nécessaire."
            ),
        })

    # Closure rate
    if closure is not None and closure < 40:
        recs.append({
            "severity": "warning",
            "title": "Taux de clôture global faible",
            "body": (
                f"Seulement {closure}% des tickets exportés sont clôturés. "
                "Revoir les tickets anciens et fermer ceux résolus sans mise à jour de statut."
            ),
        })
    if week_closure is not None and week_closure < 30 and created_cur > 5:
        recs.append({
            "severity": "warning",
            "title": "Faible résolution sur les tickets de la semaine",
            "body": (
                f"Taux de clôture hebdomadaire estimé à {week_closure}% "
                f"(basé sur le statut actuel des tickets créés cette semaine). "
                "Accélérer le traitement des demandes récurrentes (imprimante, DSQ, Kroll)."
            ),
        })

    # Critical tickets
    if critical_cur > critical_prev and critical_cur >= 3:
        recs.append({
            "severity": "critical",
            "title": "Augmentation des tickets critiques",
            "body": (
                f"{critical_cur} tickets critiques cette semaine (vs {critical_prev} la semaine précédente). "
                "Activer la procédure P1 : notification immédiate et revue post-incident."
            ),
        })

    # Applications hotspots (volume-only) — use combined categories
    if volume_only:
        combined_period = kpis.get("by_combined", {}).get("period", {})
        if combined_period:
            top_cat, top_count = next(iter(combined_period.items()))
            period_total = s["total_tickets"]
            if period_total > 0 and top_count / period_total > 0.12:
                recs.append({
                    "severity": "info",
                    "title": f"Catégorie dominante : {top_cat}",
                    "body": (
                        f"« {top_cat} » compte {top_count} tickets sur la période "
                        f"({round(top_count / period_total * 100)}% du volume). "
                        "Prioriser la documentation et le support ciblé."
                    ),
                })
        app_period = combined_period
        recurring_apps = [t for t, c in app_period.items() if c >= 3 and t != "Autres"]
        if recurring_apps:
            recs.append({
                "severity": "info",
                "title": "Applications fréquentes",
                "body": (
                    "Applications les plus sollicitées : "
                    + ", ".join(recurring_apps[:5])
                    + ". Documenter les procédures et surveiller les tendances."
                ),
            })
    else:
        titles = kpis.get("top_titles_current_week", {})
        recurring = [t for t, c in titles.items() if c >= 3 and t]
        if recurring:
            recs.append({
                "severity": "info",
                "title": "Incidents récurrents détectés",
                "body": (
                    "Sujets fréquents cette semaine : "
                    + ", ".join(f"« {t} »" for t in recurring[:5])
                    + ". Documenter les procédures de résolution et surveiller les tendances."
                ),
            })

    if not recs:
        recs.append({
            "severity": "success",
            "title": "Situation stable",
            "body": (
                "Aucune alerte majeure détectée. Maintenir le rythme actuel "
                "et continuer le suivi hebdomadaire."
            ),
        })

    if lang == "en":
        # Minimal EN passthrough — extend if needed
        for r in recs:
            if r["severity"] == "success" and "stable" in r["title"].lower():
                r["title"] = "Stable situation"
                r["body"] = "No major alerts. Maintain current pace and weekly monitoring."

    return recs
