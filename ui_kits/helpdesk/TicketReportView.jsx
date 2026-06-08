// TicketReportView — présentation structurée des réponses formulaire (style Jira / Zendesk)

const INCIDENT_KEYS_BY_AREA = {
  Excel: 'excel_issue',
  'Power BI': 'pbi_issue',
  'Parcours CRM': 'crm_issue',
  BioMetrx: 'biometrx_issue',
  Kroll: 'kroll_issue',
  DSQ: 'dsq_error',
  Imprimante: 'printer_problem',
  RingCentral: 'ringcentral_issue',
  'Audio / Casque': 'audio_situation',
  Autre: 'other_area_desc',
};

const GENERAL_KEYS = new Set(['users_affected', 'problem_area', 'department', 'office_number']);
const ENDING_KEYS = new Set(['department', 'office_number', 'link', 'attachments', 'detailed_description']);

function parseBodyToAnswers(body) {
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
        if (id === 'attachments' && value) {
          answers[id] = value.split(/,\s*/).map(name => ({ name: name.trim() }));
        } else {
          answers[id] = value;
        }
        break;
      }
    }
  }
  return Object.keys(answers).length ? answers : null;
}

function resolveAnswers(ticket) {
  if (ticket.formAnswers && Object.keys(ticket.formAnswers).length > 0) {
    return ticket.formAnswers;
  }
  return parseBodyToAnswers(ticket.body);
}

function buildTicketDisplay(ticket, t) {
  const answers = resolveAnswers(ticket);
  if (answers) return buildDisplayFromFormAnswers(answers, ticket, t);
  return buildDisplayLegacy(ticket, t);
}

function buildDisplayFromFormAnswers(answers, ticket, t) {
  const rv = (k) => t(`reportView.${k}`);
  const area = answers.problem_area;
  const incidentKey = area && INCIDENT_KEYS_BY_AREA[area];
  const incidentValue = incidentKey ? answers[incidentKey] : null;

  const general = [
    { icon: 'users', label: rv('usersAffected'), value: answers.users_affected, badge: true },
    { icon: 'tag', label: rv('category'), value: area, badge: true },
    { icon: 'building', label: rv('department'), value: answers.department },
    { icon: 'map-pin', label: rv('office'), value: answers.office_number },
  ].filter(f => f.value != null && String(f.value).trim() !== '');

  const details = [];
  const pathFn = window.resolveFormPath;
  const path = typeof pathFn === 'function' ? pathFn(answers) : Object.keys(answers);
  const hasVal = window.hasValue;
  const fmt = window.formatAnswerLabel;
  const defs = window.FORM_STEP_DEFS || {};

  path.forEach(stepId => {
    if (GENERAL_KEYS.has(stepId) || ENDING_KEYS.has(stepId) || stepId === incidentKey) return;
    if (typeof hasVal === 'function' ? !hasVal(answers, stepId) : !answers[stepId]) return;
    const def = defs[stepId];
    if (!def) return;
    const raw = answers[stepId];
    details.push({
      icon: 'list',
      label: def.label,
      value: typeof fmt === 'function' ? fmt(stepId, raw) : String(raw),
    });
  });

  const attachments = Array.isArray(answers.attachments) ? answers.attachments : [];
  const description = answers.detailed_description || '';

  const technical = [
    answers.link ? { icon: 'link', label: rv('linkProvided'), value: answers.link, mono: true } : null,
    { icon: 'calendar', label: rv('created'), value: formatTicketDate(ticket.opened) },
    { icon: 'clock', label: t('ticket.updated'), value: formatTicketDate(ticket.updated) },
    ticket.id ? { icon: 'tag', label: rv('ticketId'), value: ticket.id, mono: true } : null,
  ].filter(Boolean);

  return {
    incident: incidentValue ? { label: rv('incident'), value: incidentValue } : null,
    general,
    details,
    description,
    attachments,
    technical,
    reporterNote: null,
    sections: rv,
  };
}

function buildDisplayLegacy(ticket, t) {
  const parsed = parseBodyToAnswers(ticket.body);
  if (parsed) return buildDisplayFromFormAnswers(parsed, ticket, t);
  const rv = (k) => t(`reportView.${k}`);
  const category = window.PMG_DATA?.CATEGORIES?.find(c => c.id === ticket.category);
  return {
    incident: ticket.priority === 'P1' || ticket.priority === 'P2'
      ? { label: t('ticket.priority'), value: ticket.priority }
      : null,
    general: [
      { icon: 'tag', label: rv('category'), value: category?.label || ticket.category, badge: true },
      { icon: 'clock', label: t('ticket.opened'), value: ticket.opened },
    ].filter(f => f.value),
    details: [],
    description: ticket.body || '',
    attachments: [],
    technical: [
      { icon: 'clock', label: t('ticket.updated'), value: formatTicketDate(ticket.updated) },
    ],
    reporterNote: rv('legacyNote'),
    sections: rv,
  };
}

function formatTicketDate(raw) {
  if (!raw) return '—';
  if (raw === 'just now') {
    return new Date().toLocaleString('fr-CA', { dateStyle: 'medium', timeStyle: 'short' });
  }
  return raw;
}

function isImageFile(name) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name || '');
}

function TicketReportBody({ ticket }) {
  const { t } = useI18n();
  const display = React.useMemo(() => buildTicketDisplay(ticket, t), [ticket, t]);
  const { incident, general, details, description, attachments, technical, reporterNote, sections } = display;
  const rv = sections;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {reporterNote && (
        <div style={{
          fontSize: 12, color: 'var(--fg-secondary)', padding: '10px 12px',
          background: 'var(--ink-50)', borderRadius: 6, border: '1px solid var(--ink-100)',
        }}>{reporterNote}</div>
      )}

      {incident && (
        <IncidentHighlightCard label={incident.label} value={incident.value}/>
      )}

      {general.length > 0 && (
        <ReportSection title={rv('general')} icon="box">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}>
            {general.map((field, i) => (
              <InfoFieldCard key={i} {...field}/>
            ))}
          </div>
        </ReportSection>
      )}

      {details.length > 0 && (
        <ReportSection title={rv('details')} icon="list">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 10,
          }}>
            {details.map((field, i) => (
              <DetailFieldCard key={i} {...field}/>
            ))}
          </div>
        </ReportSection>
      )}

      {description && (
        <ReportSection title={rv('description')} icon="file-text">
          <div style={{
            background: 'var(--ink-50)', border: '1px solid var(--border)', borderRadius: 8,
            padding: '16px 18px', fontSize: 15, lineHeight: 1.65, color: 'var(--fg)',
            whiteSpace: 'pre-wrap',
          }}>
            {description}
          </div>
        </ReportSection>
      )}

      {attachments.length > 0 && (
        <ReportSection title={rv('attachments')} icon="paperclip">
          <AttachmentGallery files={attachments}/>
        </ReportSection>
      )}

      {technical.length > 0 && (
        <ReportSection title={rv('technical')} icon="settings">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {technical.map((row, i) => (
              <TechInfoRow key={i} {...row}/>
            ))}
          </div>
        </ReportSection>
      )}
    </div>
  );
}

function ReportSection({ title, icon, children }) {
  return (
    <section style={{
      background: 'white', border: '1px solid var(--border)', borderRadius: 8,
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', borderBottom: '1px solid var(--ink-100)',
        background: 'var(--ink-50)',
      }}>
        <span style={{
          width: 28, height: 28, borderRadius: 6, background: 'white',
          border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={15} color="var(--accent-700)"/>
        </span>
        <h3 style={{
          margin: 0, fontSize: 12, fontWeight: 600, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: 'var(--fg-secondary)',
        }}>{title}</h3>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </section>
  );
}

function IncidentHighlightCard({ label, value }) {
  return (
    <div style={{
      background: 'var(--warning-50)', border: '1px solid var(--warning-100)',
      borderRadius: 8, padding: '16px 18px',
      display: 'flex', gap: 14, alignItems: 'flex-start',
    }}>
      <span style={{
        width: 40, height: 40, borderRadius: 8, flexShrink: 0,
        background: 'white', border: '1px solid var(--warning-100)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="alert" size={22} color="var(--warning-700)"/>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'var(--warning-700)', marginBottom: 6,
        }}>{label}</div>
        <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.35, color: 'var(--fg)' }}>
          {value}
        </div>
      </div>
    </div>
  );
}

function InfoFieldCard({ icon, label, value, badge }) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 8, border: '1px solid var(--ink-100)',
      background: 'white', display: 'flex', flexDirection: 'column', gap: 8, minHeight: 72,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name={icon} size={16} color="var(--fg-muted)"/>
        <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg-muted)', lineHeight: 1.3 }}>{label}</span>
      </div>
      {badge ? (
        <span style={{
          display: 'inline-block', alignSelf: 'flex-start',
          padding: '4px 10px', borderRadius: 999, fontSize: 13, fontWeight: 600,
          background: 'var(--accent-50)', color: 'var(--accent-700)',
          border: '1px solid var(--accent-100)',
        }}>{value}</span>
      ) : (
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', lineHeight: 1.35 }}>{value}</span>
      )}
    </div>
  );
}

function DetailFieldCard({ label, value }) {
  return (
    <div style={{
      padding: '10px 12px', borderRadius: 6, border: '1px solid var(--ink-100)',
      background: 'var(--ink-50)',
    }}>
      <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--fg)', lineHeight: 1.4 }}>{value}</div>
    </div>
  );
}

function TechInfoRow({ icon, label, value, mono }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16,
      padding: '10px 12px', borderRadius: 6, background: 'var(--ink-50)',
      border: '1px solid var(--ink-100)', fontSize: 13,
    }}>
      <span style={{ color: 'var(--fg-secondary)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Icon name={icon} size={14} color="var(--fg-muted)"/>
        {label}
      </span>
      <span style={{
        color: 'var(--fg)', fontWeight: 500, textAlign: 'right', wordBreak: 'break-word',
        fontFamily: mono ? 'var(--font-mono)' : 'inherit', fontSize: mono ? 12 : 13,
      }}>{value}</span>
    </div>
  );
}

function AttachmentGallery({ files }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
      gap: 12,
    }}>
      {files.map((file, i) => (
        <AttachmentCard key={i} file={file}/>
      ))}
    </div>
  );
}

function AttachmentCard({ file }) {
  const name = file.name || file;
  const isImg = isImageFile(name);
  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden',
      background: 'white', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        height: 120, background: isImg
          ? 'linear-gradient(145deg, var(--accent-50), var(--ink-100))'
          : 'var(--ink-50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderBottom: '1px solid var(--ink-100)',
      }}>
        {isImg ? (
          <Icon name="image" size={32} color="var(--accent-300)"/>
        ) : (
          <Icon name="paperclip" size={28} color="var(--fg-muted)"/>
        )}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{
          fontSize: 12, fontWeight: 500, color: 'var(--fg)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }} title={name}>{name}</div>
        {file.size != null && (
          <div style={{ fontSize: 11, color: 'var(--fg-muted)', marginTop: 2 }}>
            {(file.size / 1024).toFixed(0)} Ko
          </div>
        )}
      </div>
    </div>
  );
}

const TicketReportView = TicketReportBody;
Object.assign(window, { TicketReportBody, TicketReportView, buildTicketDisplay });
