"""Professional HTML weekly KPI report builder."""

from __future__ import annotations

from datetime import datetime
from html import escape
from pathlib import Path
from typing import Any

from config import BRAND


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


def _week_compare_row(metric: str, prev_val: str | int, cur_val: str | int, badge: str = "") -> str:
    return f"""
    <tr>
      <td>{escape(metric)}</td>
      <td class="num muted-col">{escape(str(prev_val))}</td>
      <td class="num highlight-col">{escape(str(cur_val))}</td>
      <td class="num">{badge}</td>
    </tr>"""


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

    rec_html = "".join(
        f"""<div class="rec {_severity_class(r['severity'])}">
          <strong>{escape(r['title'])}</strong>
          <p>{escape(r['body'])}</p>
        </div>"""
        for r in recommendations
    )

    def chart_img(key: str, title: str, full_width: bool = False) -> str:
        if key not in charts:
            return ""
        cls = "chart-card chart-full" if full_width else "chart-card"
        return (
            f'<div class="{cls}"><h3>{escape(title)}</h3>'
            f'<img src="data:image/png;base64,{charts[key]}" alt="{escape(title)}"/></div>'
        )

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
  .summary-item {{
    background: var(--card); border: 1px solid var(--border); border-radius: 12px;
    padding: 18px 20px; text-align: center;
    box-shadow: 0 2px 8px rgba(11,13,16,0.04);
  }}
  .summary-item .val {{ font-size: 32px; font-weight: 800; color: var(--primary-dark); letter-spacing: -0.03em; }}
  .summary-item .lbl {{ font-size: 11px; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.07em; color: var(--muted); margin-top: 4px; }}
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
    .summary-strip {{ grid-template-columns: 1fr 1fr; }}
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
    <h1>KPI Helpdesk — 2 dernières semaines</h1>
    <p>{escape(organization)} · Généré le {generated}</p>
    <div class="period">
      <span><strong>Période analysée :</strong> {escape(tw.get('label', cw.range_label))}</span>
      <span><strong>Sem. courante :</strong> {escape(cw.range_label)}</span>
      <span><strong>Sem. précédente :</strong> {escape(pw.range_label)}</span>
    </div>
  </header>

  <div class="summary-strip">
    <div class="summary-item">
      <div class="val">{tw.get('created_total', s['created_this_week'] + s['created_last_week'])}</div>
      <div class="lbl">Tickets créés (2 sem.)</div>
    </div>
    <div class="summary-item">
      <div class="val">{tw.get('completed_total', s['completed_this_week'] + s['completed_last_week'])}</div>
      <div class="lbl">Tickets clôturés (2 sem.)</div>
    </div>
    <div class="summary-item">
      <div class="val">{tw.get('sla_compliance_pct', s.get('sla_two_weeks_sla_compliance_pct', 0))}%</div>
      <div class="lbl">Conformité SLA</div>
    </div>
    <div class="summary-item">
      <div class="val">{tw.get('avg_resolution_min', s.get('sla_two_weeks_avg_resolution_min', 0))} min</div>
      <div class="lbl">Temps moyen résolution</div>
    </div>
  </div>

  <div class="section-title">Comparaison semaine par semaine</div>
  <div class="compare-panel">
    <table class="compare-table">
      <thead>
        <tr>
          <th>Indicateur</th>
          <th style="text-align:right">{escape(pw.range_label)}</th>
          <th style="text-align:right">{escape(cw.range_label)}</th>
          <th style="text-align:right">Tendance</th>
        </tr>
      </thead>
      <tbody>{compare_rows}</tbody>
    </table>
  </div>

  <div class="sla-panel">
    <h3>Performance SLA — 2 semaines</h3>
    {_sla_bar(s.get('sla_previous_sla_compliance_pct', 0), f"Semaine précédente ({pw.range_label})")}
    {_sla_bar(s.get('sla_current_sla_compliance_pct', 0), f"Semaine courante ({cw.range_label})")}
    {_sla_bar(tw.get('sla_compliance_pct', 0), "Période combinée")}
    <p class="muted" style="margin:12px 0 0">
      {tw.get('sla_breaches', s.get('sla_two_weeks_sla_breaches', 0))} dépassements SLA sur la période
    </p>
  </div>

  <div class="section-title">Indicateurs détaillés</div>
  <div class="kpi-grid">
    {_kpi_card("Total export", s['total_tickets'], accent="primary")}
    {_kpi_card("Créés — sem. courante", s['created_this_week'],
               f"Sem. préc. : {s['created_last_week']}", _trend_badge(s['volume_change_pct']), "primary")}
    {_kpi_card("Clôturés — sem. courante", s['completed_this_week'],
               f"Sem. préc. : {s['completed_last_week']}", _trend_badge(s['completed_change_pct'], invert=True), "success")}
    {_kpi_card("Taux clôture global", f"{s['closure_rate_pct']}%", accent="success")}
    {_kpi_card("Critiques — sem. courante", s['critical_this_week'],
               f"Sem. préc. : {s['critical_last_week']}", accent="warning")}
    {_kpi_card("SLA — sem. courante", f"{s.get('sla_current_sla_compliance_pct', 0)}%",
               f"Moy. {s.get('sla_current_avg_resolution_min', 0)} min", accent="success")}
  </div>

  <div class="section-title">Graphiques</div>
  <div class="charts-grid">
    {chart_img("two_weeks", "Vue d'ensemble — 2 semaines", full_width=True)}
    {chart_img("volume_trend", "Tendance volume")}
    {chart_img("priority", "Priorités — comparaison")}
    {chart_img("status", "Statuts — période 2 semaines")}
    {chart_img("category", "Top catégories — sem. courante", full_width=True)}
    {chart_img("assignee", "Charge par assigné")}
    {chart_img("requester", "Top requérants")}
  </div>

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
      <h3>Semaine précédente — assignés</h3>
      {_table_from_dict(kpis['by_assignee']['previous_week'])}
    </div>
    <div class="panel panel-week">
      <h3>Semaine courante — assignés</h3>
      {_table_from_dict(kpis['by_assignee']['current_week'])}
    </div>
    <div class="panel panel-week prev">
      <h3>Semaine précédente — requérants</h3>
      {_table_from_dict(kpis['by_requester']['previous_week'])}
    </div>
    <div class="panel panel-week">
      <h3>Semaine courante — requérants</h3>
      {_table_from_dict(kpis['by_requester']['current_week'])}
    </div>
  </div>

  <div class="section-title">Recommandations management</div>
  {rec_html}

  <div class="footer">
    Source : {escape(source_label)} · Fichier <em>Tickets__KPI</em> ·
    Semaine ISO (lundi–dimanche) · Colonne <em>Created</em> pour les dates de création.
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
