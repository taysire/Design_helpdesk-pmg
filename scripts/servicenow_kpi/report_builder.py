"""Professional HTML weekly KPI report builder."""

from __future__ import annotations

from datetime import datetime
from html import escape
from pathlib import Path
from typing import Any

from config import BRAND
from executive_summary import build_executive_summary


def _delta_badge(delta: int, pct: float | None, *, invert: bool = False) -> str:
    """Visual badge for week-over-week delta (↑ hausse, ↓ baisse, → stable)."""
    if pct is None and delta == 0:
        return '<span class="badge badge-neutral">→ stable</span>'
    good = delta < 0 if not invert else delta > 0
    if delta == 0 or (pct is not None and abs(pct) < 5):
        return '<span class="badge badge-neutral">→ stable</span>'
    if good:
        cls, arrow = "badge-good", "↓"
    else:
        cls, arrow = "badge-bad", "↑"
    sign = f"+{delta}" if delta > 0 else str(delta)
    pct_str = f" ({pct:+.1f}%)" if pct is not None else ""
    return f'<span class="badge {cls}">{arrow} {sign}{pct_str}</span>'


def _trend_badge(pct: float | None, invert: bool = False) -> str:
    if pct is None:
        return '<span class="badge badge-neutral">—</span>'
    good = pct < 0 if not invert else pct > 0
    if abs(pct) < 5:
        cls, arrow = "badge-neutral", "→"
    elif good:
        cls, arrow = "badge-good", "↓" if not invert else "↑"
    else:
        cls, arrow = "badge-bad", "↑" if not invert else "↓"
    sign = f"+{pct}" if pct > 0 else str(pct)
    return f'<span class="badge {cls}">{arrow} {sign}%</span>'


def _severity_class(severity: str) -> str:
    return {
        "critical": "rec-critical",
        "warning": "rec-warning",
        "success": "rec-success",
        "info": "rec-info",
    }.get(severity, "rec-info")


def _table_from_dict(data: dict[str, int], limit: int = 10) -> str:
    if not data:
        return "<p class='muted'>Aucune donnée</p>"
    rows = list(data.items())[:limit]
    body = "".join(
        f"<tr><td>{escape(str(k))}</td><td class='num'>{v}</td></tr>"
        for k, v in rows
    )
    return f"<table class='data-table'><tbody>{body}</tbody></table>"


def _kpi_card(label: str, value: str | int, sub: str = "", badge: str = "", accent: str = "") -> str:
    accent_cls = f" kpi-accent-{accent}" if accent else ""
    return f"""
    <div class="kpi-card{accent_cls}">
      <div class="kpi-label">{escape(label)}</div>
      <div class="kpi-value">{escape(str(value))}</div>
      {f'<div class="kpi-sub">{sub}</div>' if sub else ''}
      {badge}
    </div>"""


def _sla_bar(pct: float, label: str) -> str:
    color = "var(--success)" if pct >= 90 else "var(--warning)" if pct >= 75 else "var(--critical)"
    return f"""
    <div class="sla-row">
      <div class="sla-head"><span>{escape(label)}</span><strong>{pct}%</strong></div>
      <div class="sla-track"><div class="sla-fill" style="width:{min(pct,100)}%;background:{color}"></div></div>
    </div>"""


def _columns_list_html(columns: list[str]) -> str:
    if not columns:
        return "<p class='muted'>Aucune colonne détectée</p>"
    chips = "".join(f"<span class='col-chip'>{escape(c)}</span>" for c in columns)
    return f"<div class='col-chips'>{chips}</div>"


def _sharepoint_qa_panel(qa: dict[str, Any]) -> str:
    sp = qa.get("sharepoint") or {}
    if not sp:
        return ""
    warnings = sp.get("warnings") or []
    warn_html = ""
    if warnings:
        items = "".join(f"<li>{escape(w)}</li>" for w in warnings)
        warn_html = f"""
    <div class="warn-box">
      <strong>⚠ Données manquantes ou exclues</strong>
      <ul>{items}</ul>
    </div>"""
    status = (
        "<span class='badge badge-good'>Données validées</span>"
        if qa.get("ok", True) and not sp.get("has_warnings")
        else "<span class='badge badge-bad'>Attention — voir détails</span>"
        if warnings
        else "<span class='badge badge-neutral'>Contrôle effectué</span>"
    )
    cols = sp.get("available_columns") or []
    title = "Qualité des données CSV" if sp.get("source") == "csv" else "Qualité des données SharePoint"
    return f"""
  <div class="section-title">{title}</div>
  <div class="qa-panel sp-panel">
    <p>{status} · Liste : <strong>{escape(str(sp.get('list_name', 'Tickets')))}</strong></p>
    <p class="muted">
      Source : <a href="{escape(str(sp.get('list_url', '')))}" style="color:var(--primary)">{escape(str(sp.get('list_url', '')))}</a>
    </p>
    {warn_html}
    <table class="compare-table data-table sp-meta-table">
      <tbody>
        <tr><td>Identifiant unique</td><td><code>{escape(str(sp.get('unique_id_field', 'ID')))}</code></td></tr>
        <tr><td>Champ date utilisé</td><td><code>{escape(str(sp.get('date_field', 'Created')))}</code></td></tr>
        <tr><td>Éléments dans la liste (total)</td><td class="num">{sp.get('total_list_items', '—')}</td></tr>
        <tr><td>Tickets période (avant exclusion weekends)</td><td class="num">{sp.get('total_in_period_before_weekend', '—')}</td></tr>
        <tr><td>Weekends exclus (sam/dim)</td><td class="num">{sp.get('weekend_excluded', 0)}</td></tr>
        <tr><td>Total après exclusion</td><td class="num"><strong>{sp.get('total_after_exclusion', '—')}</strong></td></tr>
        <tr><td>Sans date Created</td><td class="num">{sp.get('missing_created', 0)}</td></tr>
        <tr><td>Hors période analysée</td><td class="num">{sp.get('outside_period', 0)}</td></tr>
        <tr><td>Pages Graph récupérées</td><td class="num">{sp.get('pages_fetched', '—')}</td></tr>
      </tbody>
    </table>
    <h3>Colonnes disponibles ({len(cols)})</h3>
    {_columns_list_html(cols)}
  </div>"""


def _daily_verification_table(daily: dict[str, int], expected: dict[str, int] | None = None) -> str:
    if not daily:
        return "<p class='muted'>Aucune donnée journalière</p>"
    rows = []
    for day in sorted(daily.keys()):
        count = daily[day]
        exp = expected.get(day) if expected else None
        status = ""
        if exp is not None:
            ok = count == exp
            status = (
                "<span class='badge badge-good'>OK</span>"
                if ok else
                f"<span class='badge badge-bad'>Attendu {exp}</span>"
            )
        rows.append(
            f"<tr><td>{escape(day)}</td><td class='num'>{count}</td>"
            f"<td class='num'>{exp if exp is not None else '—'}</td><td>{status}</td></tr>"
        )
    return (
        "<table class='compare-table data-table'>"
        "<thead><tr><th>Date</th><th style='text-align:right'>Tickets</th>"
        "<th style='text-align:right'>Attendu</th><th>Contrôle</th></tr></thead>"
        f"<tbody>{''.join(rows)}</tbody></table>"
    )


def _week_compare_row(metric: str, prev_val: str | int, cur_val: str | int, badge: str = "") -> str:
    return f"""
    <tr>
      <td>{escape(metric)}</td>
      <td class="num muted-col">{escape(str(prev_val))}</td>
      <td class="num highlight-col">{escape(str(cur_val))}</td>
      <td class="num">{badge}</td>
    </tr>"""


def _comparison_table_html(
    title: str,
    rows: list[dict[str, Any]],
    label_header: str,
    *,
    col_prev: str = "Semaine 1",
    col_cur: str = "Semaine 2",
) -> str:
    if not rows:
        return f"<p class='muted'>Aucune donnée pour {escape(title)}</p>"
    body = []
    for row in rows:
        delta = int(row.get("delta", 0))
        pct = row.get("pct")
        pct_display = f"{pct:+.1f}%" if pct is not None else "—"
        body.append(
            f"<tr>"
            f"<td>{escape(str(row['label']))}</td>"
            f"<td class='num muted-col'>{row['week1']}</td>"
            f"<td class='num highlight-col'>{row['week2']}</td>"
            f"<td class='num'>{delta:+d}</td>"
            f"<td class='num'>{pct_display}</td>"
            f"<td>{_delta_badge(delta, pct)}</td>"
            f"</tr>"
        )
    return f"""
  <div class="section-title">{escape(title)}</div>
  <div class="compare-panel">
    <table class="compare-table">
      <thead>
        <tr>
          <th>{escape(label_header)}</th>
          <th style="text-align:right">{escape(col_prev)}</th>
          <th style="text-align:right">{escape(col_cur)}</th>
          <th style="text-align:right">Évolution</th>
          <th style="text-align:right">Évolution %</th>
          <th>Tendance</th>
        </tr>
      </thead>
      <tbody>{''.join(body)}</tbody>
    </table>
  </div>"""


def build_html_report(
    kpis: dict[str, Any],
    charts: dict[str, str],
    recommendations: list[dict[str, str]],
    organization: str = "PMG Helpdesk",
    source_label: str = "export ServiceNow (CSV)",
) -> str:
    s = kpis["summary"]
    tw = kpis.get("two_week_period", {})
    cw = kpis["current_week"]
    pw = kpis["previous_week"]
    generated = datetime.now().strftime("%d/%m/%Y %H:%M")

    volume_only = kpis.get("report_options", {}).get("volume_only", False)
    apps = kpis.get("by_application", {})
    equipment = kpis.get("by_equipment", {})
    combined = kpis.get("by_combined", {})
    qa = kpis.get("quality", {})
    daily = qa.get("daily_counts") or kpis.get("daily_counts", {})
    period_label = tw.get("label", f"{pw.range_label} – {cw.range_label}")

    rec_html = "".join(
        f"""<div class="rec {_severity_class(r['severity'])}">
          <strong>{escape(r['title'])}</strong>
          <p>{escape(r['body'])}</p>
        </div>"""
        for r in recommendations
    )

    def chart_img(key: str, title: str = "", full_width: bool = False, *, show_title: bool = True) -> str:
        if key not in charts:
            return ""
        cls = "chart-card chart-full" if full_width else "chart-card"
        title_html = f"<h3>{escape(title)}</h3>" if show_title and title else ""
        alt = escape(title or key)
        return (
            f'<div class="{cls}">{title_html}'
            f'<img src="data:image/png;base64,{charts[key]}" alt="{alt}"/></div>'
        )

    if volume_only:
        exec_sum = build_executive_summary(kpis)
        comp = kpis.get("comparison_tables", {})
        test_mode = kpis.get("report_options", {}).get("week_mode") == "test_current"
        col_prev = f"Semaine précédente · {pw.range_label}" if test_mode else "Semaine 1"
        col_cur = f"Semaine courante · {cw.range_label}" if test_mode else "Semaine 2"
        tbl_kw = {"col_prev": col_prev, "col_cur": col_cur}
        vol_pct = s.get("volume_change_pct")
        vol_delta = s["created_this_week"] - s["created_last_week"]
        vol_display = f"{vol_pct:+.1f}%" if vol_pct is not None else "—"
        sp = qa.get("sharepoint") or {}
        before_excl = sp.get("total_in_period_before_weekend", s["total_tickets"])
        weekend_excl = sp.get("weekend_excluded", 0)
        after_excl = sp.get("total_after_exclusion", s["total_tickets"])
        trend_cls = {
            "hausse": "exec-trend-bad",
            "baisse": "exec-trend-good",
            "stable": "exec-trend-neutral",
        }.get(exec_sum["trend"], "exec-trend-neutral")

        summary_strip = f"""
    <div class="kpi-cards-top">
      {_kpi_card("Avant exclusion", before_excl, "Période · weekends inclus", accent="primary")}
      {_kpi_card("Weekends exclus", weekend_excl, "Sam/dim retirés", accent="warning")}
      {_kpi_card("Après exclusion", after_excl, "Base du rapport", accent="primary")}
      {_kpi_card("Semaine 1", s['created_last_week'], pw.range_label, _delta_badge(0, None), "primary")}
      {_kpi_card("Semaine 2", s['created_this_week'], cw.range_label, _delta_badge(vol_delta, vol_pct), "primary")}
      {_kpi_card("Évolution", f"{vol_delta:+d}", vol_display, _delta_badge(vol_delta, vol_pct), "primary")}
    </div>"""

        executive_panel = f"""
  <div class="exec-panel">
    <h2>Résumé exécutif</h2>
    <p class="exec-trend {trend_cls}">{escape(exec_sum['trend_text'])}</p>
    <p>{escape(exec_sum['changes_text'])}</p>
    <p class="muted">{escape(exec_sum['impact_text'])}</p>
  </div>"""

        comparison_section = "".join([
            _comparison_table_html("Résumé global", comp.get("summary", []), "Indicateur", **tbl_kw),
            _comparison_table_html("Top catégories — Applications", comp.get("applications", []), "Application", **tbl_kw),
            _comparison_table_html("Top catégories — Équipements", comp.get("equipment", []), "Équipement", **tbl_kw),
        ])
        combined_rows = comp.get("combined", [])
        combined_table = ""
        if combined_rows:
            combined_table = _comparison_table_html(
                "Évolution combinée — Applications & Équipements",
                combined_rows,
                "Catégorie",
                **tbl_kw,
            )
        legacy_compare_section = ""
        kpi_detail_section = ""
        daily_panel = ""

        compare_rows = ""
        sla_panel = ""
        kpi_extra = ""
        qa_panel = ""
        daily_panel = ""
        unclassified = qa.get("unclassified_titles") or {}
        unclassified_panel = ""
        if unclassified:
            unclassified_panel = f"""
  <div class="section-title">Titres non classifiés (hors graphiques)</div>
  <div class="panel">{_table_from_dict(unclassified, limit=20)}</div>"""
        detail_section = ""
        stale_panel = ""
        freshness = qa.get("freshness") or {}
        if freshness.get("stale"):
            stale_panel = f"""
  <div class="stale-panel">
    <strong>⚠ Données incomplètes</strong>
    <p>{escape(freshness.get('message', 'Données SharePoint incomplètes pour la période demandée.'))}</p>
    <p class="muted">Dernier ticket : {escape(str(freshness.get('last_ticket', '—')))} · Attendu jusqu'au : {escape(str(freshness.get('period_end', '—')))}</p>
  </div>"""
        hero_charts = f"""
  <div class="charts-hero-stack">
    {chart_img("problem_evolution", full_width=True, show_title=False)}
    {chart_img("combined_problems", full_width=True, show_title=False)}
  </div>"""
        secondary_charts = f"""
  <div class="section-title">Autres graphiques & tendances</div>
  <div class="charts-grid charts-secondary">
    {chart_img("category_evolution", "Évolution par catégorie (↑↓)", full_width=True)}
    {chart_img("two_weeks", "Volume — semaine précédente vs courante", full_width=True)}
    {chart_img("combined_cmp", "Top catégories — barres comparatives", full_width=True)}
    {chart_img("daily", "Tickets par jour (lun–ven)", full_width=True)}
  </div>"""
        charts_section = f"""
  <div class="section-title">Vue principale — évolution des catégories</div>
  <p class="muted section-lead">Breakdown + distribution proportionnelle · semaine précédente vs semaine courante</p>
  {stale_panel}
  {hero_charts}
  {secondary_charts}
  {combined_table}
  {unclassified_panel}"""
        period_desc = "deux dernières semaines complètes passées (lun–ven)"
        hero_title = f"Rapport bi-hebdomadaire KPI — {escape(organization)}"
        hero_sub = (
            f"Période analysée : {period_desc} · Weekends sam/dim exclus · "
            f"Source SharePoint · Généré le {generated}"
        )
        footer_note = (
            "Source : SharePoint Liste Tickets · Identifiant : ID · Date : Created · "
            "Semaines ouvrables lun–ven · Weekends exclus · Fuseau America/Toronto · "
            f"Période : {escape(period_label)}"
        )
    else:
        compare_rows = "".join([
            _week_compare_row("Tickets créés", s["created_last_week"], s["created_this_week"],
                              _trend_badge(s["volume_change_pct"])),
            _week_compare_row("Tickets clôturés", s["completed_last_week"], s["completed_this_week"],
                              _trend_badge(s["completed_change_pct"], invert=True)),
            _week_compare_row("Taux clôture", f"{s['week_closure_rate_previous']}%",
                              f"{s['week_closure_rate_current']}%"),
            _week_compare_row("Tickets critiques", s["critical_last_week"], s["critical_this_week"]),
            _week_compare_row("Conformité SLA", f"{s.get('sla_previous_sla_compliance_pct', 0)}%",
                              f"{s.get('sla_current_sla_compliance_pct', 0)}%"),
            _week_compare_row("Temps moyen (min)", s.get("sla_previous_avg_resolution_min", 0),
                              s.get("sla_current_avg_resolution_min", 0)),
        ])
        summary_strip = f"""
    <div class="summary-strip">
      <div class="summary-item"><div class="val">{tw.get('created_total', s['created_this_week'] + s['created_last_week'])}</div><div class="lbl">Tickets créés (2 sem.)</div></div>
      <div class="summary-item"><div class="val">{tw.get('completed_total', s['completed_this_week'] + s['completed_last_week'])}</div><div class="lbl">Tickets clôturés (2 sem.)</div></div>
      <div class="summary-item"><div class="val">{tw.get('sla_compliance_pct', s.get('sla_two_weeks_sla_compliance_pct', 0))}%</div><div class="lbl">Conformité SLA</div></div>
      <div class="summary-item"><div class="val">{tw.get('avg_resolution_min', s.get('sla_two_weeks_avg_resolution_min', 0))} min</div><div class="lbl">Temps moyen résolution</div></div>
    </div>"""
        sla_panel = f"""
  <div class="sla-panel">
    <h3>Performance SLA — 2 semaines</h3>
    {_sla_bar(s.get('sla_previous_sla_compliance_pct', 0) or 0, f"Semaine précédente ({pw.range_label})")}
    {_sla_bar(s.get('sla_current_sla_compliance_pct', 0) or 0, f"Semaine courante ({cw.range_label})")}
    {_sla_bar(tw.get('sla_compliance_pct', 0) or 0, "Période combinée")}
  </div>"""
        kpi_extra = f"""
    {_kpi_card("Taux clôture global", f"{s['closure_rate_pct']}%", accent="success")}
    {_kpi_card("SLA — sem. courante", f"{s.get('sla_current_sla_compliance_pct', 0)}%",
               f"Moy. {s.get('sla_current_avg_resolution_min', 0)} min", accent="success")}"""
        charts_section = f"""
  <div class="section-title">Graphiques</div>
  <div class="charts-grid">
    {chart_img("two_weeks", "Vue d'ensemble — 2 semaines", full_width=True)}
    {chart_img("applications", "Applications concernées", full_width=True)}
    {chart_img("volume_trend", "Tendance volume")}
    {chart_img("priority", "Priorités — comparaison")}
    {chart_img("status", "Statuts — période 2 semaines")}
    {chart_img("category", "Top catégories — sem. courante", full_width=True)}
    {chart_img("requester", "Top requérants")}
  </div>"""
        hero_title = "Rapport bi-hebdomadaire KPI — ServiceNow"
        hero_sub = f"{escape(organization)} · Généré le {generated}"
        qa_panel = ""
        detail_section = f"""
  <div class="section-title">Détail par semaine</div>
  <div class="two-col">
    <div class="panel panel-week prev">
      <h3>Semaine précédente — catégories</h3>
      {_table_from_dict(kpis['by_category']['previous_week'])}
    </div>
    <div class="panel panel-week">
      <h3>Semaine courante — catégories</h3>
      {_table_from_dict(kpis['by_category']['current_week'])}
    </div>
    <div class="panel panel-week prev">
      <h3>Semaine précédente — requérants</h3>
      {_table_from_dict(kpis['by_requester']['previous_week'])}
    </div>
    <div class="panel panel-week">
      <h3>Semaine courante — requérants</h3>
      {_table_from_dict(kpis['by_requester']['current_week'])}
    </div>
  </div>"""
        executive_panel = ""
        comparison_section = ""
        legacy_compare_section = f"""
  <div class="section-title">Comparaison semaine par semaine</div>
  <div class="compare-panel">
    <table class="compare-table">
      <thead>
        <tr>
          <th>Indicateur</th>
          <th style="text-align:right">Sem. 1 · {escape(pw.range_label)}</th>
          <th style="text-align:right">Sem. 2 · {escape(cw.range_label)}</th>
          <th style="text-align:right">Tendance</th>
        </tr>
      </thead>
      <tbody>{compare_rows}</tbody>
    </table>
  </div>"""
        kpi_detail_section = f"""
  <div class="section-title">Indicateurs détaillés</div>
  <div class="kpi-grid">
    {_kpi_card("Tickets (période)", s['total_tickets'], accent="primary")}
    {_kpi_card("Créés — sem. 2", s['created_this_week'],
               f"Sem. 1 : {s['created_last_week']}", _trend_badge(s['volume_change_pct']), "primary")}
    {_kpi_card("Créés — sem. 1", s['created_last_week'], accent="primary")}
    {_kpi_card("Critiques — sem. 2", s['critical_this_week'],
               f"Sem. 1 : {s['critical_last_week']}", accent="warning")}
    {kpi_extra}
  </div>"""
        footer_note = (
            f"Source : {escape(source_label)} · Fuseau America/Toronto · Semaine ISO (lundi-dimanche)."
        )

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Rapport bi-hebdomadaire KPI — {escape(organization)}</title>
<style>
  :root {{
    --primary: {BRAND['primary']};
    --primary-dark: {BRAND['primary_dark']};
    --success: {BRAND['success']};
    --warning: {BRAND['warning']};
    --critical: {BRAND['critical']};
    --ink: {BRAND['ink']};
    --muted: {BRAND['muted']};
    --border: {BRAND['border']};
    --bg: {BRAND['bg']};
    --card: #ffffff;
  }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0; font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    background: var(--bg); color: var(--ink); line-height: 1.55;
    -webkit-font-smoothing: antialiased;
  }}
  .wrap {{ max-width: 1140px; margin: 0 auto; padding: 28px 20px 56px; }}
  .hero {{
    position: relative; overflow: hidden;
    background: linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 50%, #1d74e8 100%);
    color: white; border-radius: 16px; padding: 32px 36px; margin-bottom: 24px;
    box-shadow: 0 12px 40px rgba(8,46,102,0.28);
  }}
  .hero::after {{
    content: ""; position: absolute; top: -40%; right: -10%; width: 320px; height: 320px;
    background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%);
    border-radius: 50%;
  }}
  .hero-tag {{
    display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; background: rgba(255,255,255,0.18); padding: 5px 10px;
    border-radius: 6px; margin-bottom: 12px;
  }}
  .hero h1 {{ margin: 0 0 10px; font-size: 28px; font-weight: 700; letter-spacing: -0.03em; }}
  .hero p {{ margin: 0; opacity: 0.92; font-size: 14px; }}
  .period {{ display: flex; gap: 12px; flex-wrap: wrap; margin-top: 18px; font-size: 13px; }}
  .period span {{
    background: rgba(255,255,255,0.14); backdrop-filter: blur(4px);
    padding: 8px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.12);
  }}
  .summary-strip {{
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px;
  }}
  .summary-strip-5 {{ grid-template-columns: repeat(5, 1fr); }}
  .summary-strip-6 {{ grid-template-columns: repeat(6, 1fr); }}
  .kpi-cards-top {{
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 28px;
  }}
  .kpi-cards-top .kpi-card {{ margin: 0; }}
  .sp-panel {{ border-left: 4px solid var(--primary); }}
  .sp-meta-table td:first-child {{ font-weight: 600; color: var(--muted); width: 55%; }}
  .col-chips {{ display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }}
  .col-chip {{
    font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 6px;
    background: #EFF6FF; color: var(--primary-dark); border: 1px solid #BFDBFE;
  }}
  .warn-box {{
    background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 8px;
    padding: 12px 14px; margin: 12px 0; font-size: 13px;
  }}
  .warn-box ul {{ margin: 6px 0 0; padding-left: 18px; }}
  code {{ font-size: 12px; background: #F1F5F9; padding: 2px 6px; border-radius: 4px; }}
  .exec-panel {{
    background: var(--card); border: 1px solid var(--border); border-radius: 12px;
    padding: 22px 24px; margin-bottom: 28px; border-left: 4px solid var(--primary);
    box-shadow: 0 2px 8px rgba(11,13,16,0.04);
  }}
  .exec-panel h2 {{ margin: 0 0 12px; font-size: 16px; font-weight: 700; }}
  .exec-trend {{ font-size: 15px; font-weight: 600; margin: 0 0 10px; }}
  .exec-trend-good {{ color: #166534; }}
  .exec-trend-bad {{ color: #991B1B; }}
  .exec-trend-neutral {{ color: var(--muted); }}
  .stale-panel {{
    background: #FEF2F2; border: 1px solid #FECACA; border-left: 4px solid var(--critical);
    border-radius: 12px; padding: 16px 20px; margin-bottom: 20px; font-size: 13px;
  }}
  .stale-panel strong {{ display: block; margin-bottom: 6px; color: #991B1B; }}
  .stale-panel p {{ margin: 4px 0; }}
  .charts-hero-stack {{
    display: flex; flex-direction: column; gap: 22px; margin-bottom: 32px;
  }}
  .charts-hero-stack .chart-card {{
    box-shadow: 0 4px 16px rgba(8,46,102,0.08);
    border: 1px solid var(--border);
  }}
  .charts-secondary {{ margin-bottom: 28px; }}
  .qa-panel {{
    background: var(--card); border: 1px solid var(--border); border-radius: 12px;
    padding: 20px 22px; margin-bottom: 24px;
  }}
  .summary-item {{
    background: var(--card); border: 1px solid var(--border); border-radius: 12px;
    padding: 18px 20px; text-align: center;
    box-shadow: 0 2px 8px rgba(11,13,16,0.04);
  }}
  .summary-item .val {{ font-size: 32px; font-weight: 800; color: var(--primary-dark); letter-spacing: -0.03em; }}
  .summary-item .lbl {{ font-size: 11px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.07em; color: var(--muted); margin-top: 4px; }}
  .section-lead {{ margin: -8px 0 20px; font-size: 14px; }}
  .panel-highlight {{ border-top: 3px solid var(--primary); margin-bottom: 24px; }}
  .section-title {{
    font-size: 17px; font-weight: 700; margin: 32px 0 16px; letter-spacing: -0.02em;
    padding-bottom: 8px; border-bottom: 2px solid var(--primary); display: inline-block;
  }}
  h3 {{ font-size: 13px; font-weight: 700; margin: 0 0 12px; color: var(--ink);
    text-transform: uppercase; letter-spacing: 0.04em; }}
  .kpi-grid {{
    display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px;
  }}
  .kpi-card {{
    background: var(--card); border: 1px solid var(--border); border-radius: 12px;
    padding: 18px 20px; box-shadow: 0 1px 3px rgba(11,13,16,0.05);
    transition: box-shadow 0.15s;
  }}
  .kpi-accent-primary {{ border-top: 3px solid var(--primary); }}
  .kpi-accent-success {{ border-top: 3px solid var(--success); }}
  .kpi-accent-warning {{ border-top: 3px solid var(--warning); }}
  .kpi-label {{ font-size: 10px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.08em; color: var(--muted); }}
  .kpi-value {{ font-size: 30px; font-weight: 800; margin: 8px 0 4px; letter-spacing: -0.03em;
    color: var(--primary-dark); }}
  .kpi-sub {{ font-size: 12px; color: var(--muted); }}
  .badge {{ display: inline-block; font-size: 11px; font-weight: 700; padding: 4px 10px;
    border-radius: 999px; margin-top: 8px; }}
  .badge-good {{ background: #DCFCE7; color: #166534; }}
  .badge-bad {{ background: #FEE2E2; color: #991B1B; }}
  .badge-neutral {{ background: #F1F5F9; color: #475569; }}
  .compare-panel {{
    background: var(--card); border: 1px solid var(--border); border-radius: 12px;
    padding: 20px 22px; margin-bottom: 24px; overflow-x: auto;
    box-shadow: 0 2px 8px rgba(11,13,16,0.04);
  }}
  .compare-table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
  .compare-table th {{
    text-align: left; padding: 10px 12px; font-size: 11px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted);
    border-bottom: 2px solid var(--border);
  }}
  .compare-table td {{ padding: 12px; border-bottom: 1px solid var(--border); }}
  .compare-table .num {{ text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }}
  .compare-table .muted-col {{ color: var(--muted); }}
  .compare-table .highlight-col {{ color: var(--primary-dark); }}
  .sla-panel {{
    background: var(--card); border: 1px solid var(--border); border-radius: 12px;
    padding: 20px 22px; margin-bottom: 24px;
  }}
  .sla-row {{ margin-bottom: 14px; }}
  .sla-head {{ display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; }}
  .sla-track {{ height: 8px; background: #EEF2F7; border-radius: 999px; overflow: hidden; }}
  .sla-fill {{ height: 100%; border-radius: 999px; transition: width 0.3s; }}
  .charts-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }}
  .chart-card {{
    background: var(--card); border: 1px solid var(--border); border-radius: 12px;
    padding: 18px; overflow: hidden; box-shadow: 0 1px 3px rgba(11,13,16,0.04);
  }}
  .chart-card img {{ width: 100%; height: auto; display: block; border-radius: 6px; }}
  .chart-full {{ grid-column: 1 / -1; }}
  .two-col {{ display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }}
  .panel {{
    background: var(--card); border: 1px solid var(--border); border-radius: 12px;
    padding: 18px 20px; box-shadow: 0 1px 3px rgba(11,13,16,0.04);
  }}
  .panel-week {{ border-top: 3px solid var(--primary); }}
  .panel-week.prev {{ border-top-color: #94A3B8; }}
  .data-table {{ width: 100%; border-collapse: collapse; font-size: 13px; }}
  .data-table tr:nth-child(even) td {{ background: #F8FAFC; }}
  .data-table td {{ padding: 9px 8px; border-bottom: 1px solid var(--border); }}
  .data-table td.num {{ text-align: right; font-weight: 700; font-variant-numeric: tabular-nums;
    color: var(--primary-dark); }}
  .rec {{ border-radius: 10px; padding: 14px 16px; margin-bottom: 10px; font-size: 13px; }}
  .rec strong {{ display: block; margin-bottom: 5px; font-size: 14px; }}
  .rec p {{ margin: 0; }}
  .rec-critical {{ background: #FEF2F2; border-left: 4px solid var(--critical); }}
  .rec-warning {{ background: #FFFBEB; border-left: 4px solid var(--warning); }}
  .rec-success {{ background: #F0FDF4; border-left: 4px solid var(--success); }}
  .rec-info {{ background: #EFF6FF; border-left: 4px solid var(--primary); }}
  .muted {{ color: var(--muted); font-size: 13px; }}
  .footer {{ margin-top: 48px; padding-top: 20px; border-top: 1px solid var(--border);
    font-size: 12px; color: var(--muted); text-align: center; }}
  @media (max-width: 900px) {{
    .summary-strip, .summary-strip-5, .summary-strip-4, .summary-strip-6 {{ grid-template-columns: 1fr 1fr; }}
    .kpi-cards-top {{ grid-template-columns: 1fr 1fr; }}
    .charts-grid, .two-col {{ grid-template-columns: 1fr; }}
  }}
  @media (max-width: 520px) {{
    .summary-strip {{ grid-template-columns: 1fr; }}
    .hero h1 {{ font-size: 22px; }}
  }}
  @media print {{
    body {{ background: white; }}
    .wrap {{ padding: 0; max-width: none; }}
    .hero {{ box-shadow: none; }}
  }}
</style>
</head>
<body>
<div class="wrap">
  <header class="hero">
    <div class="hero-tag">Rapport bi-hebdomadaire</div>
    <h1>{hero_title}</h1>
    <p>{hero_sub}</p>
    <div class="period">
      <span><strong>Période :</strong> {escape(tw.get('label', cw.range_label))}</span>
      <span><strong>Sem. 1 :</strong> {escape(pw.range_label)}</span>
      <span><strong>Sem. 2 :</strong> {escape(cw.range_label)}</span>
    </div>
  </header>

  {summary_strip}

  {executive_panel}

  {comparison_section}

  {legacy_compare_section}

  {sla_panel}

  {kpi_detail_section}

  {charts_section}

  {detail_section}

  <div class="footer">
    {footer_note}
  </div>
</div>
</body>
</html>"""


def save_report(html: str, output_dir: Path, prefix: str = "weekly-kpi") -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y-%m-%d")
    path = output_dir / f"{prefix}-{stamp}.html"
    path.write_text(html, encoding="utf-8")
    latest = output_dir / "latest.html"
    latest.write_text(html, encoding="utf-8")
    return path
