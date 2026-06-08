// ReportsDashboard — KPI et reporting TI (style Jira / Zendesk Explore)

function ReportsDashboard({ tickets, onOpenTicket, onSendWeeklyReport }) {
  const { t, lang } = useI18n();
  const analytics = React.useMemo(() => computeHelpdeskAnalytics(tickets, t, lang), [tickets, t, lang]);
  const weeklyReport = React.useMemo(() => buildWeeklyReport(analytics, t, lang), [analytics, t, lang]);
  const [showReport, setShowReport] = React.useState(false);

  const sendReport = () => {
    onSendWeeklyReport && onSendWeeklyReport(weeklyReport);
    setShowReport(false);
  };

  return (
    <div className="hd-page hd-analytics" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>{t('analytics.title')}</h1>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999,
              background: 'var(--success-50)', color: 'var(--success-700)', border: '1px solid var(--success-100)',
            }}>{t('analytics.live')}</span>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-secondary)', maxWidth: 560, lineHeight: 1.5 }}>
            {t('analytics.subtitle')}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setShowReport(true)}>
          <Icon name="send" size={14} color="white"/>
          {t('analytics.sendWeeklyReport')}
        </Button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          {/* Volume KPI row */}
          <AnalyticsSection title={t('analytics.sectionVolume')}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <AnalyticsKpiCard icon="plus" label={t('analytics.createdToday')} value={analytics.counts.createdToday} tone="accent"/>
              <AnalyticsKpiCard icon="plus" label={t('analytics.createdWeek')} value={analytics.counts.createdWeek}
                delta={analytics.trends.createdWeekDelta} deltaLabel={t('analytics.vsPrevWeek')}/>
              <AnalyticsKpiCard icon="plus" label={t('analytics.createdMonth')} value={analytics.counts.createdMonth}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
              <AnalyticsKpiCard icon="check-circle" label={t('analytics.resolvedToday')} value={analytics.counts.resolvedToday} tone="success"/>
              <AnalyticsKpiCard icon="check-circle" label={t('analytics.resolvedWeek')} value={analytics.counts.resolvedWeek}
                delta={analytics.trends.resolvedWeekDelta} deltaLabel={t('analytics.vsPrevWeek')}/>
              <AnalyticsKpiCard icon="check-circle" label={t('analytics.resolvedMonth')} value={analytics.counts.resolvedMonth}/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 12 }}>
              <AnalyticsKpiCard icon="tag" label={t('analytics.closedToday')} value={analytics.counts.closedToday}/>
              <AnalyticsKpiCard icon="tag" label={t('analytics.closedWeek')} value={analytics.counts.closedWeek}/>
              <AnalyticsKpiCard icon="tag" label={t('analytics.closedMonth')} value={analytics.counts.closedMonth}/>
            </div>
          </AnalyticsSection>

          {/* Status + SLA row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <AnalyticsKpiCard icon="inbox" label={t('analytics.openTickets')} value={analytics.counts.open}/>
            <AnalyticsKpiCard icon="clock" label={t('analytics.waitingTickets')} value={analytics.counts.waiting} tone="warning"/>
            <AnalyticsKpiCard icon="alert" label={t('analytics.overdueTickets')} value={analytics.counts.overdue} tone="critical"/>
            <AnalyticsKpiCard icon="check-circle" label={t('analytics.slaCompliance')} value={`${analytics.sla.rate}%`}
              sub={`${analytics.sla.met}/${analytics.sla.total}`} tone={analytics.sla.rate >= 90 ? 'success' : 'warning'}/>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <AnalyticsKpiCard icon="clock" label={t('analytics.avgFirstResponse')} value={analytics.mttfrLabel} wide/>
            <AnalyticsKpiCard icon="refresh" label={t('analytics.avgResolution')} value={analytics.mttrLabel} wide/>
          </div>

          {/* Weekly trend line chart */}
          <AnalyticsPanel title={t('analytics.weeklyTrend')} hint={t('analytics.weeklyTrendHint')}>
            <AnalyticsLineChart
              series={[
                { key: 'created', label: t('analytics.created'), color: '#1660CF' },
                { key: 'resolved', label: t('analytics.resolved'), color: '#16A34A' },
              ]}
              data={analytics.weeklyTrend}
            />
          </AnalyticsPanel>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <AnalyticsPanel title={t('analytics.byPriority')}>
              <AnalyticsDonutChart data={analytics.byPriority}/>
            </AnalyticsPanel>
            <AnalyticsPanel title={t('analytics.byCategory')}>
              <AnalyticsDonutChart data={analytics.byCategory}/>
            </AnalyticsPanel>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <DepartmentDistributionChart data={analytics.byDepartment} total={analytics.deptTotal} t={t}/>
            <TopIncidentsChart data={analytics.topIncidents} total={analytics.incidentTotal} t={t}/>
          </div>

          {analytics.usersAffected.length > 0 && (
            <AnalyticsPanel title={t('analytics.usersAffected')} hint={t('analytics.usersAffectedHint')}>
              <AnalyticsDonutChart data={analytics.usersAffected}/>
            </AnalyticsPanel>
          )}
        </div>

        {/* Right insights column */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 72 }}>
          <div className="hd-surface" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{t('analytics.insightsTitle')}</h3>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-secondary)', lineHeight: 1.5 }}>
              {t('analytics.insightsHint')}
            </p>
            <button type="button" onClick={() => setShowReport(true)}
              style={{
                fontFamily: 'inherit', fontSize: 12, fontWeight: 600, textAlign: 'left',
                padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              }}>
              <Icon name="send" size={14} color="var(--accent-700)"/>
              {t('analytics.previewWeeklyReport')}
            </button>
            <div style={{ height: 1, background: 'var(--ink-100)' }}/>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>
              {t('analytics.attentionPoints')}
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: 'var(--fg-secondary)', lineHeight: 1.6 }}>
              {weeklyReport.sections.find(s => s.title === t('analytics.reportAttention'))?.lines.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>

          {analytics.overdueTickets.length > 0 && (
            <div className="hd-surface" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--critical-700)' }}>
                {t('analytics.overdueList')}
              </h3>
              {analytics.overdueTickets.map(tk => (
                <button key={tk.id} type="button" onClick={() => onOpenTicket && onOpenTicket(tk.id)}
                  style={{
                    fontFamily: 'inherit', textAlign: 'left', padding: '8px 10px', borderRadius: 6,
                    border: '1px solid var(--critical-100)', background: 'var(--critical-50)',
                    cursor: 'pointer', fontSize: 12,
                  }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--fg)' }}>{tk.id}</div>
                  <div style={{ color: 'var(--fg-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tk.title}</div>
                  <div style={{ marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                    <PriorityPill priority={tk.priority}/>
                    <span style={{ color: 'var(--critical-700)', fontSize: 11 }}>{tk.hours}h</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>

      {showReport && (
        <WeeklyReportModal
          report={weeklyReport}
          analytics={analytics}
          onClose={() => setShowReport(false)}
          onSend={sendReport}
        />
      )}
    </div>
  );
}

function AnalyticsSection({ title, children }) {
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>{title}</h2>
      {children}
    </section>
  );
}

function AnalyticsKpiCard({ icon, label, value, sub, delta, deltaLabel, tone, wide }) {
  const toneColors = {
    accent: { bg: 'var(--accent-50)', fg: 'var(--accent-700)' },
    success: { bg: 'var(--success-50)', fg: 'var(--success-700)' },
    warning: { bg: '#FFFBEB', fg: '#92400E' },
    critical: { bg: 'var(--critical-50)', fg: 'var(--critical-700)' },
  };
  const c = toneColors[tone] || { bg: 'white', fg: 'var(--fg)' };
  return (
    <div style={{
      background: c.bg, border: '1px solid var(--border)', borderRadius: 10,
      padding: wide ? '16px 18px' : '14px 16px', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name={icon} size={16} color={tone ? c.fg : 'var(--fg-muted)'}/>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--fg-secondary)', letterSpacing: '0.02em' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: wide ? 22 : 28, fontWeight: 700, letterSpacing: '-0.02em', color: c.fg, lineHeight: 1 }}>{value}</span>
        {sub && <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>{sub}</span>}
      </div>
      {delta != null && (
        <span style={{
          fontSize: 11, fontWeight: 600,
          color: delta > 0 ? 'var(--warning-700)' : (delta < 0 ? 'var(--success-700)' : 'var(--fg-muted)'),
        }}>
          {delta > 0 ? '+' : ''}{delta} {deltaLabel}
        </span>
      )}
    </div>
  );
}

function AnalyticsPanel({ title, hint, icon, badge, accent, children }) {
  return (
    <div className="hd-surface" style={{
      padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14,
      borderTop: accent ? `3px solid ${accent}` : undefined,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          {icon && (
            <span style={{
              width: 32, height: 32, borderRadius: 8, flexShrink: 0,
              background: accent ? `${accent}14` : 'var(--ink-50)',
              border: `1px solid ${accent ? `${accent}33` : 'var(--border)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name={icon} size={16} color={accent || 'var(--accent-700)'}/>
            </span>
          )}
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{title}</h3>
            {hint && <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--fg-muted)', lineHeight: 1.45 }}>{hint}</p>}
          </div>
        </div>
        {badge != null && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
            padding: '3px 8px', borderRadius: 6, background: 'var(--ink-50)',
            color: 'var(--fg-secondary)', border: '1px solid var(--ink-100)', flexShrink: 0,
          }}>{badge}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function DepartmentDistributionChart({ data, total, t }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <AnalyticsPanel
      title={t('analytics.byDepartment')}
      hint={t('analytics.byDepartmentHint')}
      icon="building"
      badge={`${total} ${t('analytics.tickets')}`}
      accent="#1660CF"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.map((d, i) => {
          const unspecified = d.label === 'Non spécifié' || d.label === 'Unspecified';
          const color = DEPARTMENT_CHART_COLORS[i % DEPARTMENT_CHART_COLORS.length];
          return (
            <div key={d.label} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  background: `${color}18`, color, fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="users" size={12} color={color}/>
                </span>
                <span style={{
                  flex: 1, color: unspecified ? 'var(--fg-muted)' : 'var(--fg)',
                  fontStyle: unspecified ? 'italic' : 'normal',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{d.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--fg)' }}>{d.value}</span>
                <span style={{ fontSize: 11, color: 'var(--fg-muted)', width: 36, textAlign: 'right' }}>{d.pct}%</span>
              </div>
              <div style={{
                height: 10, background: 'var(--ink-100)', borderRadius: 4, overflow: 'hidden',
                border: unspecified ? '1px dashed var(--ink-200)' : 'none',
              }}>
                <div style={{
                  height: '100%', width: `${(d.value / max) * 100}%`,
                  background: `linear-gradient(90deg, ${color}, ${color}99)`,
                  borderRadius: 4, transition: 'width 200ms ease',
                }}/>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{
        marginTop: 4, paddingTop: 12, borderTop: '1px solid var(--ink-100)',
        fontSize: 11, color: 'var(--fg-muted)',
      }}>
        {t('analytics.byDepartmentFooter')}
      </div>
    </AnalyticsPanel>
  );
}

function TopIncidentsChart({ data, total, t }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const rankStyle = (rank) => {
    if (rank === 1) return { bg: '#FEF3C7', fg: '#92400E', border: '#FDE68A' };
    if (rank === 2) return { bg: '#F1F5F9', fg: '#475569', border: '#E2E8F0' };
    if (rank === 3) return { bg: '#FFEDD5', fg: '#9A3412', border: '#FED7AA' };
    return { bg: 'var(--ink-50)', fg: 'var(--fg-muted)', border: 'var(--ink-100)' };
  };

  return (
    <AnalyticsPanel
      title={t('analytics.topIncidents')}
      hint={t('analytics.topIncidentsHint')}
      icon="alert"
      badge={`${total} ${t('analytics.incidents')}`}
      accent="#D97706"
    >
      {data.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', fontSize: 13, color: 'var(--fg-muted)' }}>
          {t('analytics.noIncidents')}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.map((d, i) => {
            const color = INCIDENT_CHART_COLORS[i % INCIDENT_CHART_COLORS.length];
            const rs = rankStyle(d.rank);
            return (
              <div key={d.label} style={{
                display: 'flex', flexDirection: 'column', gap: 5,
                padding: '8px 10px', borderRadius: 8,
                background: d.rank <= 3 ? 'var(--ink-50)' : 'transparent',
                border: d.rank <= 3 ? '1px solid var(--ink-100)' : '1px solid transparent',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                  <span style={{
                    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                    background: rs.bg, color: rs.fg, border: `1px solid ${rs.border}`,
                    fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{d.rank}</span>
                  <span style={{ flex: 1, fontWeight: d.rank <= 3 ? 600 : 500, color: 'var(--fg)' }}>{d.label}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13, color: color,
                  }}>{d.value}</span>
                  <span style={{ fontSize: 11, color: 'var(--fg-muted)', width: 36, textAlign: 'right' }}>{d.pct}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--ink-100)', borderRadius: 999, overflow: 'hidden', marginLeft: 32 }}>
                  <div style={{
                    height: '100%', width: `${(d.value / max) * 100}%`,
                    background: color, borderRadius: 999, opacity: 0.85,
                  }}/>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div style={{
        marginTop: 4, paddingTop: 12, borderTop: '1px solid var(--ink-100)',
        fontSize: 11, color: 'var(--fg-muted)',
      }}>
        {t('analytics.topIncidentsFooter')}
      </div>
    </AnalyticsPanel>
  );
}

function AnalyticsDonutChart({ data, size = 140 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let angle = -90;
  const r = size / 2 - 8;
  const cx = size / 2;
  const cy = size / 2;
  const slices = data.map((d, i) => {
    const sweep = (d.value / total) * 360;
    const start = angle;
    angle += sweep;
    const large = sweep > 180 ? 1 : 0;
    const x1 = cx + r * Math.cos((start * Math.PI) / 180);
    const y1 = cy + r * Math.sin((start * Math.PI) / 180);
    const x2 = cx + r * Math.cos(((start + sweep) * Math.PI) / 180);
    const y2 = cy + r * Math.sin(((start + sweep) * Math.PI) / 180);
    const path = sweep >= 359.9
      ? `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy}`
      : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    return { ...d, path, color: CHART_COLORS[i % CHART_COLORS.length], pct: Math.round((d.value / total) * 100) };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth="2"/>)}
        <circle cx={cx} cy={cy} r={r * 0.55} fill="white"/>
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--fg)">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="var(--fg-muted)">total</text>
      </svg>
      <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }}/>
            <span style={{ flex: 1, color: 'var(--fg-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--fg)' }}>{s.value}</span>
            <span style={{ fontSize: 11, color: 'var(--fg-muted)', width: 32, textAlign: 'right' }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsBarChart({ data, horizontal = false, maxBars = 10 }) {
  const items = data.slice(0, maxBars);
  const max = Math.max(...items.map(d => d.value), 1);
  if (horizontal) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((d, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--fg-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{d.label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{d.value}</span>
            </div>
            <div style={{ height: 8, background: 'var(--ink-100)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${(d.value / max) * 100}%`,
                background: CHART_COLORS[i % CHART_COLORS.length], borderRadius: 999,
              }}/>
            </div>
          </div>
        ))}
      </div>
    );
  }
  const h = 160;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: h, paddingTop: 8 }}>
      {items.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <div style={{
            width: '100%', maxWidth: 48,
            height: `${(d.value / max) * (h - 40)}px`,
            background: CHART_COLORS[i % CHART_COLORS.length], borderRadius: '4px 4px 0 0',
          }}/>
          <span style={{ fontSize: 10, color: 'var(--fg-muted)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function AnalyticsLineChart({ data, series, height = 180 }) {
  const keys = series.map(s => s.key);
  const max = Math.max(1, ...data.flatMap(d => keys.map(k => d[k] || 0)));
  const w = 560;
  const pad = { t: 12, r: 12, b: 28, l: 32 };
  const innerW = w - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const step = data.length > 1 ? innerW / (data.length - 1) : innerW;

  const linePath = (key) => data.map((d, i) => {
    const x = pad.l + i * step;
    const y = pad.t + innerH - ((d[key] || 0) / max) * innerH;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={w} height={height} style={{ display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = pad.t + innerH * (1 - pct);
          return <line key={i} x1={pad.l} y1={y} x2={w - pad.r} y2={y} stroke="var(--ink-100)" strokeWidth="1"/>;
        })}
        {series.map(s => (
          <path key={s.key} d={linePath(s.key)} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        ))}
        {data.map((d, i) => {
          const x = pad.l + i * step;
          return (
            <text key={i} x={x} y={height - 6} textAnchor="middle" fontSize="10" fill="var(--fg-muted)">{d.label}</text>
          );
        })}
        <g transform={`translate(${pad.l - 8}, ${pad.t})`}>
          <text x={0} y={innerH} textAnchor="end" fontSize="9" fill="var(--fg-muted)">0</text>
          <text x={0} y={0} textAnchor="end" fontSize="9" fill="var(--fg-muted)">{max}</text>
        </g>
      </svg>
      <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 12 }}>
        {series.map(s => (
          <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 3, background: s.color, borderRadius: 2 }}/>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function WeeklyReportModal({ report, analytics, onClose, onSend }) {
  const { t } = useI18n();
  const attentionSection = report.sections.find(s => s.title === t('analytics.reportAttention'));
  const kpiCards = [
    { label: t('analytics.created'), value: analytics.counts.createdWeek, delta: analytics.trends.createdWeekDelta },
    { label: t('analytics.resolved'), value: analytics.counts.resolvedWeek, delta: analytics.trends.resolvedWeekDelta },
    { label: t('analytics.slaCompliance'), value: `${analytics.sla.rate}%` },
    { label: t('analytics.overdueTickets'), value: analytics.counts.overdue, critical: analytics.counts.overdue > 0 },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(11,13,16,0.45)', zIndex: 200,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white', borderRadius: 12, border: '1px solid var(--border)',
        width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'auto',
        boxShadow: '0 20px 48px rgba(11,13,16,0.15)',
      }}>
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--ink-100)',
          background: 'linear-gradient(180deg, var(--accent-50) 0%, white 100%)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-700)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
              PMG Helpdesk · TI
            </div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{t('analytics.weeklyReportTitle')}</h2>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--fg-secondary)' }}>{report.subject}</p>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 4 }}>
            <Icon name="x" size={18}/>
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            padding: '12px 14px', borderRadius: 8, background: 'var(--ink-50)',
            border: '1px solid var(--ink-100)', fontSize: 12, color: 'var(--fg-secondary)',
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px',
          }}>
            <span><strong style={{ color: 'var(--fg)' }}>{t('analytics.emailTo')}</strong><br/>direction@pmg.com<br/>helpdesk-ti@pmg.com</span>
            <span><strong style={{ color: 'var(--fg)' }}>{t('analytics.emailSchedule')}</strong><br/>{t('analytics.emailScheduleValue')}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {kpiCards.map((card, i) => (
              <div key={i} style={{
                padding: '12px 14px', borderRadius: 8, border: '1px solid var(--border)',
                background: card.critical ? 'var(--critical-50)' : 'white',
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--fg-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: card.critical ? 'var(--critical-700)' : 'var(--fg)' }}>{card.value}</div>
                {card.delta != null && (
                  <div style={{ fontSize: 11, marginTop: 2, color: card.delta > 0 ? 'var(--warning-700)' : 'var(--success-700)' }}>
                    {card.delta > 0 ? '+' : ''}{card.delta} {t('analytics.vsPrevWeek')}
                  </div>
                )}
              </div>
            ))}
          </div>

          {attentionSection && (
            <div style={{
              padding: '12px 14px', borderRadius: 8,
              background: 'var(--warning-50)', border: '1px solid #FDE68A',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <Icon name="alert" size={18} color="#92400E"/>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#92400E', marginBottom: 4 }}>{t('analytics.reportAttention')}</div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: '#78350F', lineHeight: 1.55 }}>
                  {attentionSection.lines.map((line, j) => <li key={j}>{line}</li>)}
                </ul>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <ReportMiniChart
              title={t('analytics.reportTopDepartments')}
              icon="building"
              accent="#1660CF"
              items={analytics.byDepartment.slice(0, 5)}
              colors={DEPARTMENT_CHART_COLORS}
            />
            <ReportMiniChart
              title={t('analytics.reportTopIncidents')}
              icon="alert"
              accent="#D97706"
              items={analytics.topIncidents.slice(0, 5)}
              colors={INCIDENT_CHART_COLORS}
              ranked
            />
          </div>

          {report.sections.filter(s => (
            s.title !== t('analytics.reportAttention')
            && s.title !== t('analytics.reportTopDepartments')
            && s.title !== t('analytics.reportTopIncidents')
          )).map((sec, i) => (
            <div key={i} style={{
              padding: '14px 16px', borderRadius: 8, border: '1px solid var(--ink-100)', background: 'var(--ink-50)',
            }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>
                {sec.title}
              </h3>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--fg-secondary)', lineHeight: 1.65 }}>
                {sec.lines.map((line, j) => <li key={j}>{line}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--ink-100)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--ink-50)' }}>
          <Button variant="secondary" size="md" onClick={onClose}>{t('analytics.cancel')}</Button>
          <Button variant="primary" size="md" onClick={onSend}>
            <Icon name="send" size={13} color="white"/>
            {t('analytics.sendNow')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ReportMiniChart({ title, icon, accent, items, colors, ranked }) {
  const max = Math.max(...items.map(d => d.value), 1);
  return (
    <div style={{ padding: '14px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Icon name={icon} size={14} color={accent}/>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg)' }}>{title}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((d, i) => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
            {ranked && (
              <span style={{
                width: 18, fontFamily: 'var(--font-mono)', fontWeight: 700,
                color: i < 3 ? accent : 'var(--fg-muted)', textAlign: 'center',
              }}>{d.rank}</span>
            )}
            <span style={{ flex: 1, color: 'var(--fg-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</span>
            <div style={{ width: 48, height: 5, background: 'var(--ink-100)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(d.value / max) * 100}%`, background: colors[i % colors.length], borderRadius: 999 }}/>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, width: 16, textAlign: 'right' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  ReportsDashboard, AnalyticsKpiCard, AnalyticsPanel, AnalyticsDonutChart,
  AnalyticsBarChart, AnalyticsLineChart, DepartmentDistributionChart, TopIncidentsChart,
  WeeklyReportModal, ReportMiniChart,
});
