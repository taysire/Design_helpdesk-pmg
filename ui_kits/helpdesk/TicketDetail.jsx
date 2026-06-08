// TicketDetail — single ticket view with activity log and side panel

function TicketDetail({
  ticket, onBack, role = 'it',
  onStatusChange, onAddComment, onReopen, onAssign,
}) {
  const { t, lang } = useI18n();
  const isEnd = role === 'enduser';
  const isIt = canChangeStatus(role);
  const reporter = window.PMG_DATA.PEOPLE.find(p => p.id === ticket.reporter);
  const assignee = window.PMG_DATA.PEOPLE.find(p => p.id === ticket.assignee);
  const category = ticket.serviceId
    ? getLocalizedService(ticket.serviceId, lang)
    : getLocalizedCategory(ticket.category, lang);
  const [comment, setComment] = React.useState('');
  const activity = ticket.activity || [];
  const statusNorm = normalizeStatus(ticket.status);
  const showReopen = canReopenTicket(role, ticket);

  const post = () => {
    if (!comment.trim() || !onAddComment) return;
    onAddComment(comment.trim());
    setComment('');
  };

  return (
    <div className="hd-page" style={{display:'grid', gridTemplateColumns:'1fr 300px', gap:24, paddingTop:20}}>
      {/* Left — main thread */}
      <div style={{display:'flex', flexDirection:'column', gap:16, minWidth:0}}>
        <nav style={{display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--fg-secondary)'}} aria-label="Breadcrumb">
          <a onClick={onBack} style={{color:'var(--accent-700)', cursor:'pointer', fontWeight:500}}>{t('ticket.back')}</a>
          <span style={{color:'var(--fg-muted)'}}>/</span>
          <span style={{fontFamily:'var(--font-mono)', color:'var(--fg-muted)'}}>{ticket.id}</span>
        </nav>

        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
            {ticket.serviceId === 'employee-arrival' && (
              <span style={{
                fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:999,
                background:'var(--success-50)', color:'var(--success-700)', border:'1px solid var(--success-100)',
              }}>{t('onboardingReport.badge')}</span>
            )}
            {ticket.serviceId === 'employee-departure' && (
              <span style={{
                fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:999,
                background:'var(--warning-50)', color:'var(--warning-700)', border:'1px solid var(--warning-100)',
              }}>{t('offboardingReport.badge')}</span>
            )}
            {ticket.serviceId === 'it-equipment' && (
              <span style={{
                fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:999,
                background:'var(--accent-50)', color:'var(--accent-700)', border:'1px solid var(--accent-100)',
              }}>{t('equipmentReport.badge')}</span>
            )}
            {ticket.serviceId === 'special-it' && (
              <span style={{
                fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:999,
                background:'var(--accent-50)', color:'var(--accent-700)', border:'1px solid var(--accent-100)',
              }}>{t('serviceReport.serviceBadge')}</span>
            )}
            <PriorityPill priority={ticket.priority}/>
            <StatusBadge status={statusNorm}/>
            <span style={{fontSize:12, color:'var(--fg-muted)'}}>{category?.label} · {t('ticket.opened')} {ticket.opened}</span>
          </div>
          <h1 style={{margin:0, fontSize:24, fontWeight:700, letterSpacing:'-0.02em', lineHeight:1.25, color:'var(--fg)'}}>{ticket.title}</h1>
        </div>

        {isIt && onStatusChange && (
          <TicketItStatusBar
            status={statusNorm}
            onStatusChange={onStatusChange}
            reporterName={reporter?.name}
          />
        )}

        {/* Contenu du signalement — vue structurée */}
        <div style={{
          display:'flex', alignItems:'center', gap:8, marginBottom:4,
        }}>
          <Avatar person={reporter} size={22}/>
          <span style={{fontSize:13, fontWeight:500, color:'var(--fg)'}}>{reporter?.name}</span>
          <span style={{fontSize:11, color:'var(--fg-muted)'}}>{t('ticket.reported')}</span>
        </div>
        <TicketReportBody ticket={ticket}/>

        <Eyebrow>{t('lifecycle.historyTitle')}</Eyebrow>
        <div style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 8,
          padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 0,
        }}>
          <div style={{display:'flex', flexDirection:'column', gap:0, position:'relative', paddingLeft:2}}>
            <div style={{position:'absolute', left:11, top:14, bottom:72, width:1, background:'var(--ink-200)'}}/>
            {activity.map((a, i) => (
              <ActivityItem key={i} entry={a} isLast={i === activity.length - 1}/>
            ))}
          {/* Composer */}
          <div style={{display:'flex', gap:12, marginTop:14, paddingLeft:0}}>
            <Avatar person={window.PMG_DATA.PEOPLE.find(p=>p.id==='me')} size={24}/>
            <div style={{flex:1, display:'flex', flexDirection:'column', gap:8}}>
              <Textarea value={comment} onChange={setComment} rows={2} placeholder={isEnd ? t('ticket.replyEnd') : t('ticket.replyIt')}/>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span style={{fontSize:11, color:'var(--fg-muted)'}}>{isEnd ? t('ticket.replyHintEnd') : t('ticket.replyHintIt')}</span>
                <div style={{display:'flex', gap:8}}>
                  <Button variant="secondary" size="sm"><Icon name="paperclip" size={12}/>{t('ticket.attach')}</Button>
                  <Button variant="primary" size="sm" onClick={post}><Icon name="send" size={12} color="white"/>{t('ticket.comment')}</Button>
                </div>
              </div>
            </div>
          </div>
          </div>
        </div>

        {showReopen && (
          <div style={{
            background: 'var(--accent-50)', border: '1px solid var(--accent-100)', borderRadius: 8,
            padding: '16px 18px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>{t('lifecycle.reopen')}</div>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--fg-secondary)', maxWidth: 480 }}>{t('lifecycle.reopenHint')}</p>
            </div>
            <Button variant="secondary" size="md" onClick={onReopen}>
              <Icon name="refresh" size={14}/>{t('lifecycle.reopen')}
            </Button>
          </div>
        )}
      </div>

      {/* Right — side panel */}
      <aside style={{display:'flex', flexDirection:'column', gap:12, minWidth:0}}>
        <div style={{background:'white', border:'1px solid var(--border)', borderRadius:8, padding:16, display:'flex', flexDirection:'column', gap:0}}>
          <SidePanelField label={t('lifecycle.changeStatus')}>
            {isIt && onStatusChange ? (
              <StatusSelector value={statusNorm} onChange={onStatusChange}/>
            ) : (
              <StatusBadge status={statusNorm} size="md"/>
            )}
          </SidePanelField>
          <PanelDivider/>
          <SidePanelField label={isEnd ? t('ticket.assigneeEnd') : t('ticket.assignee')}>
            {isIt && onAssign ? (
              <select value={ticket.assignee || ''} onChange={e => onAssign(e.target.value || null)}
                style={{
                  fontFamily: 'inherit', fontSize: 13, padding: '8px 10px', width: '100%',
                  borderRadius: 6, border: '1px solid var(--border)', background: 'white',
                }}>
                <option value="">{t('ticket.unassignedIt')}</option>
                {window.PMG_DATA.PEOPLE.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            ) : assignee ? (
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <Avatar person={assignee} size={22}/>
                <div style={{display:'flex', flexDirection:'column', lineHeight:1.2}}>
                  <span style={{fontSize:13, color:'var(--fg)', fontWeight:500}}>{assignee.name}</span>
                  <span style={{fontSize:11, color:'var(--fg-muted)'}}>{assignee.team}</span>
                </div>
              </div>
            ) : (
              <span style={{fontSize:12, color:'var(--fg-muted)', fontStyle:'italic'}}>{isEnd ? t('ticket.unassignedEnd') : t('ticket.unassignedIt')}</span>
            )}
          </SidePanelField>
          <PanelDivider/>
          <SidePanelField label={t('ticket.reporter')}>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <Avatar person={reporter} size={22}/>
              <span style={{fontSize:13, color:'var(--fg)'}}>{reporter?.name}</span>
            </div>
          </SidePanelField>
          <PanelDivider/>
          <SidePanelField label={t('ticket.category')}>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <Icon name={category?.icon} size={14} color="var(--fg-secondary)"/>
              <span style={{fontSize:13, color:'var(--fg)'}}>{category?.label}</span>
            </div>
          </SidePanelField>
          <PanelDivider/>
          <SidePanelField label={t('ticket.priority')}>
            <PriorityPill priority={ticket.priority}/>
          </SidePanelField>
          <PanelDivider/>
          <SidePanelField label={t('ticket.timeline')}>
            <div style={{display:'flex', flexDirection:'column', gap:4, fontSize:12, color:'var(--fg-secondary)'}}>
              <span>{t('ticket.opened')} <strong style={{color:'var(--fg)', fontWeight:500}}>{ticket.opened}</strong></span>
              <span>{t('ticket.updated')} <strong style={{color:'var(--fg)', fontWeight:500}}>{ticket.updated}</strong></span>
            </div>
          </SidePanelField>
        </div>

        {/* Integrations — IT only. End users don't see Jira/Slack plumbing. */}
        {!isEnd && (
          <div style={{background:'white', border:'1px solid var(--border)', borderRadius:8, padding:14, display:'flex', flexDirection:'column', gap:10}}>
            <Eyebrow>{t('ticket.linked')}</Eyebrow>
            <IntegrationRow icon="jira" label={ticket.jira || t('ticket.createJira')} muted={!ticket.jira}/>
            <IntegrationRow icon="slack" label={ticket.slack || t('ticket.mirrorSlack')} muted={!ticket.slack}/>
          </div>
        )}

        {isIt && onStatusChange && statusNorm !== 'resolved' && statusNorm !== 'closed' && (
          <Button variant="primary" size="md" onClick={() => onStatusChange('resolved')}>
            <Icon name="check" size={14} color="white"/>
            {t('ticket.markResolved')}
          </Button>
        )}
        {isIt && onStatusChange && statusNorm === 'resolved' && (
          <Button variant="secondary" size="md" onClick={() => onStatusChange('closed')}>
            <Icon name="check" size={14}/>
            {t('status.closed')}
          </Button>
        )}
        {isEnd && statusNorm === 'waiting_info' && (
          <div style={{
            background:'var(--warning-50)', border:'1px solid var(--warning-100)', borderRadius:8,
            padding:'10px 12px', fontSize:12, color:'var(--warning-700)', lineHeight:1.5,
          }}>
            {t('ticket.waitingInfoBanner')}
          </div>
        )}
      </aside>
    </div>
  );
}

function TicketItStatusBar({ status, onStatusChange, reporterName }) {
  const { t } = useI18n();
  return (
    <div style={{
      background: 'white', border: '1px solid var(--border)', borderRadius: 8,
      padding: '14px 16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center',
      justifyContent: 'space-between', gap: 12,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200 }}>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-muted)' }}>
          {t('lifecycle.changeStatus')}
        </span>
        <span style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>
          {t('lifecycle.itStatusHint', { name: reporterName || '—' })}
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <StatusSelector value={status} onChange={onStatusChange}/>
        {status !== 'resolved' && status !== 'closed' && (
          <Button variant="primary" size="sm" onClick={() => onStatusChange('resolved')}>
            <Icon name="check" size={13} color="white"/>{t('ticket.markResolved')}
          </Button>
        )}
        {status === 'resolved' && (
          <Button variant="secondary" size="sm" onClick={() => onStatusChange('closed')}>
            <Icon name="check" size={13}/>{t('status.closed')}
          </Button>
        )}
      </div>
    </div>
  );
}

function SidePanelField({ label, children }) {
  return (
    <div style={{display:'flex', flexDirection:'column', gap:6, padding:'12px 0'}}>
      <span style={{fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--fg-muted)'}}>{label}</span>
      {children}
    </div>
  );
}

function PanelDivider() {
  return <div style={{height:1, background:'var(--ink-100)'}}/>;
}

function ActivityItem({ entry, isLast }) {
  const { t } = useI18n();
  const who = window.PMG_DATA.PEOPLE.find(p => p.id === entry.who);
  const display = getActivityDisplay(entry, t);
  const toneColor = {
    muted: 'var(--fg-secondary)',
    info: 'var(--info-700)',
    success: 'var(--success-700)',
    warning: 'var(--warning-700)',
    accent: 'var(--accent-700)',
    default: 'var(--fg)',
  }[display.tone] || 'var(--fg-secondary)';

  return (
    <div style={{display:'flex', gap:12, padding:'10px 0', alignItems:'flex-start', position:'relative'}}>
      <div style={{position:'relative', zIndex:1, flexShrink:0}}>
        <Avatar person={who} size={24}/>
      </div>
      <div style={{flex:1, display:'flex', flexDirection:'column', gap:4, minWidth:0}}>
        <div style={{fontSize:12, color:'var(--fg-secondary)', lineHeight:1.45}}>
          <span style={{fontWeight:500, color: toneColor}}>{display.headline}</span>
          <span style={{color:'var(--fg-muted)'}}> · {entry.at}</span>
        </div>
        {display.showBubble && display.body ? (
          <div style={{
            background:'var(--ink-50)', border:'1px solid var(--border)', borderRadius:8,
            padding:'10px 12px', fontSize:13, color:'var(--fg)', lineHeight:1.5, whiteSpace:'pre-wrap',
          }}>{display.body}</div>
        ) : display.body ? (
          <div style={{fontSize:12, color:'var(--fg-secondary)'}}>{display.body}</div>
        ) : null}
      </div>
    </div>
  );
}

function IntegrationRow({ icon, label, muted }) {
  const svg = icon === 'jira' ? (
    <svg width="14" height="14" viewBox="0 0 32 32"><path fill="#2684FF" d="M11.53 2A10.81 10.81 0 0 0 22.34 12.81H17.6a4.27 4.27 0 0 1-4.26-4.26V3.81A1.81 1.81 0 0 0 11.53 2z"/><path fill="#2684FF" opacity="0.7" d="M16.95 7.41A10.81 10.81 0 0 0 27.76 18.23h-4.73a4.27 4.27 0 0 1-4.27-4.27V9.22a1.81 1.81 0 0 0-1.81-1.81z"/><path fill="#2684FF" opacity="0.5" d="M22.36 12.81a10.81 10.81 0 0 0 10.81 10.81h-4.74a4.26 4.26 0 0 1-4.26-4.27V14.62a1.81 1.81 0 0 0-1.81-1.81z"/></svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#E01E5A" d="M5.04 15.16a2.52 2.52 0 1 1-2.52-2.52h2.52v2.52zm1.27 0a2.52 2.52 0 1 1 5.04 0v6.3a2.52 2.52 0 1 1-5.04 0v-6.3z"/><path fill="#36C5F0" d="M8.83 5.04A2.52 2.52 0 1 1 11.35 2.52v2.52H8.83zm0 1.27a2.52 2.52 0 1 1 0 5.04H2.52a2.52 2.52 0 1 1 0-5.04h6.31z"/><path fill="#2EB67D" d="M18.96 8.83a2.52 2.52 0 1 1 2.52 2.52h-2.52V8.83zm-1.27 0a2.52 2.52 0 1 1-5.04 0V2.52a2.52 2.52 0 1 1 5.04 0v6.31z"/><path fill="#ECB22E" d="M15.16 18.96a2.52 2.52 0 1 1-2.52 2.52v-2.52h2.52zm0-1.27a2.52 2.52 0 1 1 0-5.04h6.32a2.52 2.52 0 1 1 0 5.04h-6.32z"/></svg>
  );
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:8, padding:'6px 8px',
      borderRadius:6, cursor:'pointer',
      background: muted ? 'transparent' : 'var(--ink-50)',
      border: muted ? '1px dashed var(--border-strong)' : '1px solid var(--border)',
    }}>
      {svg}
      <span style={{flex:1, fontSize:12, color: muted ? 'var(--fg-muted)' : 'var(--fg)', fontFamily: muted ? 'inherit' : 'var(--font-mono)'}}>{label}</span>
      {!muted && <Icon name="arrow-up-right" size={12} color="var(--fg-muted)"/>}
    </div>
  );
}

// ——— Vue structurée du signalement (Jira-style) ———
const REPORT_INCIDENT_KEYS = {
  Excel: 'excel_issue', 'Power BI': 'pbi_issue', 'Parcours CRM': 'crm_issue',
  BioMetrx: 'biometrx_issue', Kroll: 'kroll_issue', DSQ: 'dsq_error',
  Imprimante: 'printer_problem', RingCentral: 'ringcentral_issue',
  'Audio / Casque': 'audio_situation', Autre: 'other_area_desc',
};
const REPORT_GENERAL_KEYS = new Set(['users_affected', 'problem_area', 'department', 'office_number']);
const REPORT_ENDING_KEYS = new Set(['department', 'office_number', 'link', 'attachments', 'detailed_description']);

function parseTicketBodyToAnswers(body) {
  if (!body || !body.includes('**')) return null;
  const answers = {};
  const defs = window.FORM_STEP_DEFS || {};
  const re = /\*\*(.+?):\*\*\s*/g;
  const matches = [...body.matchAll(re)];
  if (!matches.length) return null;
  for (let i = 0; i < matches.length; i++) {
    const label = matches[i][1].trim();
    const start = matches[i].index + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index : body.length;
    const value = body.slice(start, end).trim();
    for (const id of Object.keys(defs)) {
      if (defs[id].label === label) {
        answers[id] = id === 'attachments' && value
          ? value.split(/,\s*/).map(name => ({ name: name.trim() }))
          : value;
        break;
      }
    }
  }
  return Object.keys(answers).length ? answers : null;
}

function resolveTicketAnswers(ticket) {
  if (ticket.formAnswers && Object.keys(ticket.formAnswers).length > 0) return ticket.formAnswers;
  return parseTicketBodyToAnswers(ticket.body);
}

function buildTicketReportDisplay(ticket, t) {
  const answers = resolveTicketAnswers(ticket);
  if (answers) return buildReportFromAnswers(answers, ticket, t);
  const rv = (k) => t(`reportView.${k}`);
  const category = window.PMG_DATA?.CATEGORIES?.find(c => c.id === ticket.category);
  return {
    incident: null, general: [{ icon: 'tag', label: rv('category'), value: category?.label || ticket.category, badge: true }].filter(f => f.value),
    details: [], description: ticket.body || '', attachments: [],
    technical: [{ icon: 'clock', label: t('ticket.updated'), value: formatReportDate(ticket.updated) }],
    reporterNote: rv('legacyNote'), sections: rv,
  };
}

function buildReportFromAnswers(answers, ticket, t) {
  const rv = (k) => t(`reportView.${k}`);
  const area = answers.problem_area;
  const incidentKey = area && REPORT_INCIDENT_KEYS[area];
  const incidentValue = incidentKey ? answers[incidentKey] : null;
  const general = [
    { icon: 'users', label: rv('usersAffected'), value: answers.users_affected, badge: true },
    { icon: 'tag', label: rv('category'), value: area, badge: true },
    { icon: 'building', label: rv('department'), value: answers.department },
    { icon: 'map-pin', label: rv('office'), value: answers.office_number },
  ].filter(f => f.value != null && String(f.value).trim() !== '');
  const details = [];
  const path = typeof window.resolveFormPath === 'function' ? window.resolveFormPath(answers) : Object.keys(answers);
  const defs = window.FORM_STEP_DEFS || {};
  path.forEach(stepId => {
    if (REPORT_GENERAL_KEYS.has(stepId) || REPORT_ENDING_KEYS.has(stepId) || stepId === incidentKey) return;
    if (window.hasValue && !window.hasValue(answers, stepId)) return;
    if (!answers[stepId]) return;
    const def = defs[stepId];
    if (!def) return;
    details.push({
      label: def.label,
      value: window.formatAnswerLabel ? window.formatAnswerLabel(stepId, answers[stepId]) : String(answers[stepId]),
    });
  });
  const attachments = Array.isArray(answers.attachments) ? answers.attachments : [];
  return {
    incident: incidentValue ? { label: rv('incident'), value: incidentValue } : null,
    general, details, description: answers.detailed_description || '',
    attachments,
    technical: [
      answers.link ? { icon: 'link', label: rv('linkProvided'), value: answers.link, mono: true } : null,
      { icon: 'calendar', label: rv('created'), value: formatReportDate(ticket.opened) },
      { icon: 'clock', label: t('ticket.updated'), value: formatReportDate(ticket.updated) },
      ticket.id ? { icon: 'tag', label: rv('ticketId'), value: ticket.id, mono: true } : null,
    ].filter(Boolean),
    reporterNote: null, sections: rv,
  };
}

function formatReportDate(raw) {
  if (!raw) return '—';
  if (raw === 'just now') return new Date().toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' });
  return raw;
}

function isReportImageFile(name) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name || '');
}

function isOnboardingArrivalTicket(ticket) {
  return ticket.serviceId === 'employee-arrival' || ticket.formAnswers?._onboardingWizard;
}

function isITEquipmentTicket(ticket) {
  return ticket.serviceId === 'it-equipment' || ticket.formAnswers?._equipmentWizard;
}

function isEmployeeDepartureTicket(ticket) {
  return ticket.serviceId === 'employee-departure' || ticket.formAnswers?._offboardingWizard;
}

function isServiceRequestTicket(ticket) {
  if (isOnboardingArrivalTicket(ticket) || isITEquipmentTicket(ticket) || isEmployeeDepartureTicket(ticket)) return false;
  return ticket.serviceId === 'special-it' || ticket.formAnswers?._serviceWizard
    || (ticket.requestType === 'service' && ticket.category === 'service');
}

function ITEquipmentTicketReportBody({ ticket }) {
  const { t } = useI18n();
  const a = ticket.formAnswers || {};
  const er = (k) => t(`equipmentReport.${k}`);
  const reporter = window.PMG_DATA.PEOPLE.find(p => p.id === ticket.reporter);
  const equipItems = formatEquipmentItemsList(a, t);
  const attachments = Array.isArray(a.attachments) ? a.attachments : [];
  const hasJustification = a.requestReason || a.workImpact || a.additionalInfo;

  if (!a._equipmentWizard) {
    return (
      <div data-ticket-report="equipment-legacy" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--fg-secondary)', padding: '10px 12px', background: 'var(--ink-50)', borderRadius: 6, border: '1px solid var(--ink-100)' }}>
          {t('reportView.legacyNote')}
        </div>
        {ticket.body && (
          <ReportSection title={er('justification')} icon="file-text">
            <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{ticket.body}</div>
          </ReportSection>
        )}
      </div>
    );
  }

  return (
    <div data-ticket-report="equipment-v1" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ReportSection title={er('general')} icon="box">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          <ReportInfoCard icon="tag" label={t('equipmentReport.badge')} value={ticket.id} mono/>
          <ReportInfoCard icon="check-circle" label={t('ticket.status')} value={t(`status.${ticket.status}`)} badge/>
          <ReportInfoCard icon="alert" label={t('ticket.priority')} value={ticket.priority} badge/>
          <ReportInfoCard icon="users" label={t('serviceReport.requester')} value={reporter?.name}/>
          <ReportInfoCard icon="calendar" label={t('serviceReport.created')} value={formatReportDate(ticket.opened)}/>
        </div>
      </ReportSection>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <OnboardingProfileCard cardTitle={er('requester')} name={a.requesterName}/>
        <EquipmentMetaCard title={er('department')} icon="building" value={a.department}/>
        <EquipmentMetaCard title={er('requestType')} icon="package" badge={getRequestTypeLabel(a.requestType, t)}/>
      </div>

      <OnboardingChecklistCard title={er('equipment')} icon="monitor" items={equipItems} emptyLabel={er('noneSelected')}/>

      {hasJustification && (
        <ReportSection title={er('justification')} icon="file-text">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {a.requestReason && (
              <EquipmentJustificationBlock label={t('equipmentForm.fields.requestReason')} text={a.requestReason}/>
            )}
            {a.workImpact && (
              <EquipmentJustificationBlock label={t('equipmentForm.fields.workImpact')} text={a.workImpact}/>
            )}
            {a.additionalInfo && (
              <EquipmentJustificationBlock label={t('equipmentForm.fields.additionalInfo')} text={a.additionalInfo}/>
            )}
          </div>
        </ReportSection>
      )}

      {attachments.length > 0 && (
        <ReportSection title={er('attachments')} icon="paperclip">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {attachments.map((file, i) => <ReportAttachmentCard key={i} file={file} showDownload/>)}
          </div>
        </ReportSection>
      )}
    </div>
  );
}

function EquipmentMetaCard({ title, icon, value, badge }) {
  return (
    <div style={{
      background: 'white', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
        borderBottom: '1px solid var(--ink-100)', background: 'var(--ink-50)',
      }}>
        <Icon name={icon} size={18} color="var(--accent-700)"/>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{title}</h3>
      </div>
      <div style={{ padding: '16px 18px' }}>
        {badge ? (
          <span style={{
            display: 'inline-block', padding: '6px 12px', borderRadius: 999, fontSize: 14, fontWeight: 600,
            background: 'var(--accent-50)', color: 'var(--accent-700)', border: '1px solid var(--accent-100)',
          }}>{badge}</span>
        ) : (
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg)' }}>{value || '—'}</div>
        )}
      </div>
    </div>
  );
}

function EquipmentJustificationBlock({ label, text }) {
  return (
    <div style={{
      background: 'var(--ink-50)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px',
    }}>
      <div style={{
        fontSize: 11, fontWeight: 600, color: 'var(--fg-secondary)', textTransform: 'uppercase',
        letterSpacing: '0.04em', marginBottom: 8,
      }}>{label}</div>
      <div style={{ fontSize: 15, lineHeight: 1.65, whiteSpace: 'pre-wrap', color: 'var(--fg)' }}>{text}</div>
    </div>
  );
}

function OnboardingChecklistCard({ title, icon, items, emptyLabel }) {
  return (
    <div style={{
      background: 'white', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
        borderBottom: '1px solid var(--ink-100)', background: 'var(--ink-50)',
      }}>
        <Icon name={icon} size={18} color="var(--accent-700)"/>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{title}</h3>
      </div>
      <div style={{ padding: '14px 16px' }}>
        {items.length ? (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, i) => (
              <li key={i} style={{
                display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 500, color: 'var(--fg)',
                padding: '8px 10px', background: 'var(--ink-50)', borderRadius: 6, border: '1px solid var(--ink-100)',
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 4, background: 'var(--success-50)',
                  border: '1px solid var(--success-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon name="check" size={12} color="var(--success-700)"/>
                </span>
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>{emptyLabel}</span>
        )}
      </div>
    </div>
  );
}

function OnboardingProfileCard({ name, title, department, cardTitle }) {
  return (
    <div style={{
      background: 'white', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
        borderBottom: '1px solid var(--ink-100)', background: 'var(--ink-50)',
      }}>
        <Icon name="users" size={18} color="var(--accent-700)"/>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{cardTitle}</h3>
      </div>
      <div style={{ padding: '18px 16px' }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg)', lineHeight: 1.25, marginBottom: 6 }}>{name}</div>
        {title ? <div style={{ fontSize: 14, color: 'var(--fg-secondary)', marginBottom: 4 }}>{title}</div> : null}
        {department ? (
          <span style={{
            display: 'inline-block', marginTop: 8, padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
            background: 'var(--accent-50)', color: 'var(--accent-700)', border: '1px solid var(--accent-100)',
          }}>{department}</span>
        ) : null}
      </div>
    </div>
  );
}

function OnboardingArrivalDateCard({ dateLabel, formattedDate }) {
  return (
    <div style={{
      background: 'white', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
        borderBottom: '1px solid var(--ink-100)', background: 'var(--ink-50)',
      }}>
        <Icon name="calendar" size={18} color="var(--accent-700)"/>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{dateLabel}</h3>
      </div>
      <div style={{ padding: '18px 16px', fontSize: 18, fontWeight: 600, color: 'var(--fg)' }}>{formattedDate}</div>
    </div>
  );
}

function OffboardingTicketReportBody({ ticket }) {
  const { t, lang } = useI18n();
  const a = ticket.formAnswers || {};
  const obr = (k) => t(`offboardingReport.${k}`);
  const reporter = window.PMG_DATA.PEOPLE.find(p => p.id === ticket.reporter);
  const accessItems = formatOffboardingAccessList(a, t);
  const equipItems = formatOffboardingEquipmentList(a, t);
  const attachments = Array.isArray(a.attachments) ? a.attachments : [];

  if (!a._offboardingWizard) {
    return (
      <div data-ticket-report="offboarding-legacy" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--fg-secondary)', padding: '10px 12px', background: 'var(--ink-50)', borderRadius: 6, border: '1px solid var(--ink-100)' }}>
          {t('reportView.legacyNote')}
        </div>
        {ticket.body && (
          <ReportSection title={obr('comments')} icon="file-text">
            <div style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{ticket.body}</div>
          </ReportSection>
        )}
      </div>
    );
  }

  const commentBlocks = [
    { label: t('offboardingForm.fields.comments'), text: a.comments },
    { label: t('offboardingForm.fields.specialInstructions'), text: a.specialInstructions },
    { label: t('offboardingForm.fields.importantInfo'), text: a.importantInfo },
  ].filter(b => b.text);

  return (
    <div data-ticket-report="offboarding-v1" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ReportSection title={obr('general')} icon="box">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          <ReportInfoCard icon="tag" label={obr('badge')} value={ticket.id} mono/>
          <ReportInfoCard icon="check-circle" label={t('ticket.status')} value={t(`status.${ticket.status}`)} badge/>
          <ReportInfoCard icon="alert" label={t('ticket.priority')} value={ticket.priority} badge/>
          <ReportInfoCard icon="users" label={t('serviceReport.requester')} value={reporter?.name}/>
          <ReportInfoCard icon="calendar" label={t('serviceReport.created')} value={formatReportDate(ticket.opened)}/>
        </div>
      </ReportSection>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
        <OnboardingProfileCard
          cardTitle={obr('employee')}
          name={a.employeeName}
          title={a.jobTitle}
          department={a.department}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <OnboardingArrivalDateCard
            dateLabel={obr('departure')}
            formattedDate={formatOffboardingDate(a.departureDate, lang)}
          />
          <EquipmentMetaCard
            title={obr('departureType')}
            icon="user-minus"
            badge={getDepartureTypeLabel(a.departureType, t)}
          />
          <EquipmentMetaCard title={obr('manager')} icon="users" value={a.manager}/>
        </div>
      </div>

      <OnboardingChecklistCard title={obr('accessToRevoke')} icon="key" items={accessItems} emptyLabel={obr('noneSelected')}/>
      <OnboardingChecklistCard title={obr('equipmentToRecover')} icon="monitor" items={equipItems} emptyLabel={obr('noneSelected')}/>

      {commentBlocks.length > 0 && (
        <ReportSection title={obr('comments')} icon="file-text">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {commentBlocks.map((block, i) => (
              <EquipmentJustificationBlock key={i} label={block.label} text={block.text}/>
            ))}
          </div>
        </ReportSection>
      )}

      {attachments.length > 0 && (
        <ReportSection title={obr('attachments')} icon="paperclip">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {attachments.map((file, i) => <ReportAttachmentCard key={i} file={file} showDownload/>)}
          </div>
        </ReportSection>
      )}
    </div>
  );
}

function OnboardingTicketReportBody({ ticket }) {
  const { t, lang } = useI18n();
  const a = ticket.formAnswers || {};
  const or = (k) => t(`onboardingReport.${k}`);
  const reporter = window.PMG_DATA.PEOPLE.find(p => p.id === ticket.reporter);

  if (!a._onboardingWizard) {
    return (
      <div data-ticket-report="onboarding-legacy" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--fg-secondary)', padding: '10px 12px', background: 'var(--ink-50)', borderRadius: 6, border: '1px solid var(--ink-100)' }}>
          {t('reportView.legacyNote')}
        </div>
        {ticket.body && (
          <ReportSection title={or('comments')} icon="file-text">
            <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--fg)', whiteSpace: 'pre-wrap' }}>{ticket.body}</div>
          </ReportSection>
        )}
      </div>
    );
  }

  const accessItems = formatOnboardingAccessList(a, t);
  const equipItems = formatOnboardingEquipmentList(a, t);
  const comments = [a.comments, a.specialInstructions].filter(Boolean).join('\n\n');

  return (
    <div data-ticket-report="onboarding-v1" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <ReportSection title={or('general')} icon="box">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          <ReportInfoCard icon="tag" label={t('onboardingReport.badge')} value={ticket.id} mono/>
          <ReportInfoCard icon="check-circle" label={t('ticket.status')} value={t(`status.${ticket.status}`)} badge/>
          <ReportInfoCard icon="alert" label={t('ticket.priority')} value={ticket.priority} badge/>
          <ReportInfoCard icon="users" label={t('serviceReport.requester')} value={reporter?.name}/>
          <ReportInfoCard icon="calendar" label={t('serviceReport.created')} value={formatReportDate(ticket.opened)}/>
        </div>
      </ReportSection>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
        <OnboardingProfileCard
          cardTitle={or('employee')}
          name={a.employeeName}
          title={a.jobTitle}
          department={a.department}
        />
        <OnboardingArrivalDateCard
          dateLabel={or('arrival')}
          formattedDate={formatOnboardingDate(a.arrivalDate, lang)}
        />
      </div>

      <OnboardingChecklistCard title={or('accessToCreate')} icon="key" items={accessItems} emptyLabel={or('noneSelected')}/>
      <OnboardingChecklistCard title={or('equipmentToPrepare')} icon="monitor" items={equipItems} emptyLabel={or('noneSelected')}/>

      {comments && (
        <ReportSection title={or('comments')} icon="file-text">
          <div style={{
            background: 'var(--ink-50)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '16px 18px', fontSize: 15, lineHeight: 1.65, color: 'var(--fg)', whiteSpace: 'pre-wrap',
          }}>{comments}</div>
        </ReportSection>
      )}
    </div>
  );
}

function buildServiceTicketDisplay(ticket, t) {
  const sr = (k) => t(`serviceReport.${k}`);
  const answers = ticket.formAnswers || {};
  const cat = getServiceCategoryLabel(answers.serviceCategory, t);
  const reporter = window.PMG_DATA.PEOPLE.find(p => p.id === ticket.reporter);

  const general = [
    { icon: 'tag', label: sr('ticketNumber'), value: ticket.id, mono: true },
    { icon: 'check-circle', label: t('ticket.status'), value: t(`status.${ticket.status}`), badge: true },
    { icon: 'alert', label: t('ticket.priority'), value: ticket.priority, badge: true },
    { icon: 'users', label: sr('requester'), value: reporter?.name },
    { icon: 'building', label: sr('department'), value: answers.department },
    { icon: 'calendar', label: sr('created'), value: formatReportDate(ticket.opened) },
  ].filter(f => f.value != null && String(f.value).trim() !== '');

  const requestDetails = [
    { icon: 'clipboard', label: sr('serviceType'), value: t('services.specialIt.label'), badge: true },
    { icon: 'tag', label: sr('category'), value: cat, badge: true },
    { icon: 'list', label: sr('subcategory'), value: cat },
    { icon: 'check-circle', label: sr('expectedOutcome'), value: answers.expected_outcome },
    { icon: 'calendar', label: sr('dueDate'), value: answers.desired_date },
    { icon: 'clock', label: sr('urgency'), value: answers.urgency },
  ].filter(f => f.value != null && String(f.value).trim() !== '');

  const fieldDetails = getServiceAnswerRows(answers, t)
    .filter(r => !['department', 'attachments', 'desired_date', 'urgency', 'expected_outcome'].includes(r.id));

  const description = answers.detailed_description
    || answers.justification
    || answers.objective
    || answers.info_needed
    || '';

  const attachments = Array.isArray(answers.attachments) ? answers.attachments : [];

  return { general, requestDetails, fieldDetails, description, attachments, sections: sr };
}

function ServiceTicketReportBody({ ticket }) {
  const { t } = useI18n();
  const display = React.useMemo(() => buildServiceTicketDisplay(ticket, t), [ticket, t]);
  const { general, requestDetails, fieldDetails, description, attachments, sections } = display;
  const sr = sections;

  return (
    <div data-ticket-report="service-v1" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {general.length > 0 && (
        <ReportSection title={sr('general')} icon="box">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {general.map((field, i) => <ReportInfoCard key={i} {...field}/>)}
          </div>
        </ReportSection>
      )}
      {(requestDetails.length > 0 || fieldDetails.length > 0) && (
        <ReportSection title={sr('requestDetails')} icon="clipboard">
          {requestDetails.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: fieldDetails.length ? 14 : 0 }}>
              {requestDetails.map((field, i) => <ReportInfoCard key={i} {...field}/>)}
            </div>
          )}
          {fieldDetails.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
              {fieldDetails.map((field, i) => <ReportDetailCard key={i} label={field.label} value={field.value}/>)}
            </div>
          )}
        </ReportSection>
      )}
      {description && (
        <ReportSection title={sr('description')} icon="file-text">
          <div style={{
            background: 'var(--ink-50)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '16px 18px', fontSize: 15, lineHeight: 1.65, color: 'var(--fg)', whiteSpace: 'pre-wrap',
          }}>{description}</div>
        </ReportSection>
      )}
      {attachments.length > 0 && (
        <ReportSection title={sr('attachments')} icon="paperclip">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {attachments.map((file, i) => <ReportAttachmentCard key={i} file={file} showDownload/>)}
          </div>
        </ReportSection>
      )}
    </div>
  );
}

function TicketReportBody({ ticket }) {
  if (isOnboardingArrivalTicket(ticket)) {
    return <OnboardingTicketReportBody ticket={ticket}/>;
  }
  if (isEmployeeDepartureTicket(ticket)) {
    return <OffboardingTicketReportBody ticket={ticket}/>;
  }
  if (isITEquipmentTicket(ticket)) {
    return <ITEquipmentTicketReportBody ticket={ticket}/>;
  }
  if (isServiceRequestTicket(ticket)) {
    return <ServiceTicketReportBody ticket={ticket}/>;
  }
  const { t } = useI18n();
  const display = React.useMemo(() => buildTicketReportDisplay(ticket, t), [ticket, t]);
  const { incident, general, details, description, attachments, technical, reporterNote, sections } = display;
  const rv = sections;
  return (
    <div data-ticket-report="v2" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {reporterNote && (
        <div style={{ fontSize: 12, color: 'var(--fg-secondary)', padding: '10px 12px', background: 'var(--ink-50)', borderRadius: 6, border: '1px solid var(--ink-100)' }}>{reporterNote}</div>
      )}
      {incident && <ReportIncidentCard label={incident.label} value={incident.value}/>}
      {general.length > 0 && (
        <ReportSection title={rv('general')} icon="box">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {general.map((field, i) => <ReportInfoCard key={i} {...field}/>)}
          </div>
        </ReportSection>
      )}
      {details.length > 0 && (
        <ReportSection title={rv('details')} icon="list">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {details.map((field, i) => <ReportDetailCard key={i} {...field}/>)}
          </div>
        </ReportSection>
      )}
      {description && (
        <ReportSection title={rv('description')} icon="file-text">
          <div style={{ background: 'var(--ink-50)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 18px', fontSize: 15, lineHeight: 1.65, color: 'var(--fg)', whiteSpace: 'pre-wrap' }}>{description}</div>
        </ReportSection>
      )}
      {attachments.length > 0 && (
        <ReportSection title={rv('attachments')} icon="paperclip">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
            {attachments.map((file, i) => <ReportAttachmentCard key={i} file={file}/>)}
          </div>
        </ReportSection>
      )}
      {technical.length > 0 && (
        <ReportSection title={rv('technical')} icon="settings">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {technical.map((row, i) => <ReportTechRow key={i} {...row}/>)}
          </div>
        </ReportSection>
      )}
    </div>
  );
}

function ReportSection({ title, icon, children }) {
  return (
    <section style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--ink-100)', background: 'var(--ink-50)' }}>
        <span style={{ width: 28, height: 28, borderRadius: 6, background: 'white', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name={icon} size={15} color="var(--accent-700)"/>
        </span>
        <h3 style={{ margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-secondary)' }}>{title}</h3>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </section>
  );
}

function ReportIncidentCard({ label, value }) {
  return (
    <div style={{ background: 'var(--warning-50)', border: '1px solid var(--warning-100)', borderRadius: 8, padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <span style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0, background: 'white', border: '1px solid var(--warning-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="alert" size={22} color="var(--warning-700)"/>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--warning-700)', marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.35, color: 'var(--fg)' }}>{value}</div>
      </div>
    </div>
  );
}

function ReportInfoCard({ icon, label, value, badge }) {
  return (
    <div style={{ padding: '12px 14px', borderRadius: 8, border: '1px solid var(--ink-100)', background: 'white', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 72 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name={icon} size={16} color="var(--fg-muted)"/>
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', lineHeight: 1.3 }}>{label}</span>
      </div>
      {badge ? (
        <span style={{ display: 'inline-block', alignSelf: 'flex-start', padding: '4px 10px', borderRadius: 999, fontSize: 13, fontWeight: 600, background: 'var(--accent-50)', color: 'var(--accent-700)', border: '1px solid var(--accent-100)' }}>{value}</span>
      ) : (
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', lineHeight: 1.35 }}>{value}</span>
      )}
    </div>
  );
}

function ReportDetailCard({ label, value }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: 6, border: '1px solid var(--ink-100)', background: 'var(--ink-50)' }}>
      <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)', lineHeight: 1.4 }}>{value}</div>
    </div>
  );
}

function ReportTechRow({ icon, label, value, mono }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, padding: '10px 12px', borderRadius: 6, background: 'var(--ink-50)', border: '1px solid var(--ink-100)', fontSize: 13 }}>
      <span style={{ color: 'var(--fg-secondary)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Icon name={icon} size={14} color="var(--fg-muted)"/>{label}
      </span>
      <span style={{ color: 'var(--fg)', fontWeight: 500, textAlign: 'right', wordBreak: 'break-word', fontFamily: mono ? 'var(--font-mono)' : 'inherit', fontSize: mono ? 12 : 13 }}>{value}</span>
    </div>
  );
}

function ReportAttachmentCard({ file, showDownload }) {
  const { t } = useI18n();
  const name = file.name || file;
  const isImg = file.previewUrl || isReportImageFile(name);
  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'white', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 120, background: 'var(--ink-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--ink-100)' }}>
        {file.previewUrl ? (
          <img src={file.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
        ) : (
          <Icon name={isImg ? 'image' : 'paperclip'} size={isImg ? 32 : 28} color={isImg ? 'var(--accent-300)' : 'var(--fg-muted)'}/>
        )}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={name}>{name}</div>
        {file.size != null && <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>{(file.size / 1024).toFixed(0)} Ko</div>}
        {showDownload && (
          <button type="button" style={{
            marginTop: 8, fontSize: 11, fontWeight: 600, color: 'var(--accent-700)', background: 'none', border: 'none',
            cursor: 'pointer', padding: 0, fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <Icon name="arrow-up-right" size={12} color="var(--accent-700)"/>
            {t('serviceForm.download')}
          </button>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { TicketDetail, IntegrationRow, TicketReportBody });
