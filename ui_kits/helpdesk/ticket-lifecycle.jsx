// ticket-lifecycle — statuts, historique, notifications (mock)

const TICKET_STATUS_IDS = ['new', 'inprog', 'waiting_info', 'waiting_vendor', 'resolved', 'closed'];

const TICKET_STATUS_LEGACY_MAP = {
  triaged: 'inprog',
  waiting: 'waiting_info',
};

function normalizeStatus(status) {
  return TICKET_STATUS_LEGACY_MAP[status] || status || 'new';
}

function formatActivityTime(date = new Date()) {
  return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatTicketUpdated() {
  return 'just now';
}

function personName(personId) {
  const p = window.PMG_DATA?.PEOPLE?.find(x => x.id === personId);
  return p?.name || personId || '—';
}

function buildOpenedActivity(who = 'me', text) {
  return { who, kind: 'opened', at: formatActivityTime(), text: text || '' };
}

function buildStatusChangeActivity(who, fromStatus, toStatus) {
  return {
    who,
    kind: 'status_change',
    fromStatus: normalizeStatus(fromStatus),
    toStatus: normalizeStatus(toStatus),
    at: formatActivityTime(),
  };
}

function buildCommentActivity(who, text, authorRole) {
  return { who, kind: 'comment', text, at: formatActivityTime(), authorRole };
}

function buildReopenActivity(who, text) {
  return { who, kind: 'reopened', at: formatActivityTime(), text: text || '' };
}

function getStatusNotification(t, ticket, fromStatus, toStatus) {
  const id = ticket.id;
  const from = normalizeStatus(fromStatus);
  const to = normalizeStatus(toStatus);
  const key = `${from}->${to}`;
  const templates = {
    'new->inprog': { titleKey: 'lifecycle.notify.inProgress.title', bodyKey: 'lifecycle.notify.inProgress.body' },
    'inprog->waiting_info': { titleKey: 'lifecycle.notify.needInfo.title', bodyKey: 'lifecycle.notify.needInfo.body' },
    'new->waiting_info': { titleKey: 'lifecycle.notify.needInfo.title', bodyKey: 'lifecycle.notify.needInfo.body' },
    'inprog->resolved': { titleKey: 'lifecycle.notify.resolved.title', bodyKey: 'lifecycle.notify.resolved.body' },
    'waiting_info->resolved': { titleKey: 'lifecycle.notify.resolved.title', bodyKey: 'lifecycle.notify.resolved.body' },
    'waiting_vendor->resolved': { titleKey: 'lifecycle.notify.resolved.title', bodyKey: 'lifecycle.notify.resolved.body' },
    'resolved->closed': { titleKey: 'lifecycle.notify.closed.title', bodyKey: 'lifecycle.notify.closed.body' },
  };
  const tpl = templates[key];
  if (!tpl) return null;
  return {
    title: t(tpl.titleKey),
    body: t(tpl.bodyKey, { id }),
    templateKey: key,
  };
}

function getReopenNotification(t, ticket) {
  return {
    title: t('lifecycle.notify.reopened.title'),
    body: t('lifecycle.notify.reopened.body', { id: ticket.id }),
  };
}

function canChangeStatus(role) {
  return role === 'it' || role === 'admin';
}

function canAssignTicket(role) {
  return role === 'it' || role === 'admin';
}

function canReopenTicket(role, ticket) {
  if (!ticket) return false;
  const s = normalizeStatus(ticket.status);
  if (!['resolved', 'closed'].includes(s)) return false;
  return role === 'enduser' && ticket.reporter === 'me';
}

function isTicketActive(status) {
  return !['resolved', 'closed'].includes(normalizeStatus(status));
}

function ticketMatchesStatusFilter(ticket, filterId) {
  if (filterId === 'all') return true;
  if (filterId === 'waiting') {
    const s = normalizeStatus(ticket.status);
    return s === 'waiting_info' || s === 'waiting_vendor';
  }
  return normalizeStatus(ticket.status) === filterId;
}

function isSameCalendarDay(iso) {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

function isResolvedToday(ticket) {
  if (normalizeStatus(ticket.status) !== 'resolved') return false;
  if (ticket.resolvedAt) return isSameCalendarDay(ticket.resolvedAt);
  const u = (ticket.updated || '').toLowerCase();
  return u.includes('just now') || u.includes('hour') || u.includes("aujourd") || u.includes('today');
}

function isClosedToday(ticket) {
  if (normalizeStatus(ticket.status) !== 'closed') return false;
  if (ticket.closedAt) return isSameCalendarDay(ticket.closedAt);
  const u = (ticket.updated || '').toLowerCase();
  return u.includes('just now') || u.includes('hour') || u.includes("aujourd") || u.includes('today');
}

function computeLifecycleMetrics(tickets) {
  const list = tickets || [];
  return {
    new: list.filter(t => normalizeStatus(t.status) === 'new').length,
    inprog: list.filter(t => normalizeStatus(t.status) === 'inprog').length,
    waiting: list.filter(t => {
      const s = normalizeStatus(t.status);
      return s === 'waiting_info' || s === 'waiting_vendor';
    }).length,
    waitingInfo: list.filter(t => normalizeStatus(t.status) === 'waiting_info').length,
    waitingVendor: list.filter(t => normalizeStatus(t.status) === 'waiting_vendor').length,
    resolvedToday: list.filter(isResolvedToday).length,
    closedToday: list.filter(isClosedToday).length,
  };
}

function applyStatusChange(ticket, newStatus, who = 'me') {
  const oldStatus = normalizeStatus(ticket.status);
  const next = normalizeStatus(newStatus);
  const activity = [...(ticket.activity || [])];
  if (oldStatus !== next) {
    activity.push(buildStatusChangeActivity(who, oldStatus, next));
  }
  const patch = {
    ...ticket,
    status: next,
    updated: formatTicketUpdated(),
    activity,
  };
  if (next === 'resolved' && oldStatus !== 'resolved') patch.resolvedAt = new Date().toISOString();
  if (next === 'closed' && oldStatus !== 'closed') patch.closedAt = new Date().toISOString();
  if (next === 'inprog' && ['resolved', 'closed'].includes(oldStatus)) {
    patch.resolvedAt = null;
    patch.closedAt = null;
  }
  return patch;
}

function applyComment(ticket, text, who = 'me', authorRole = 'it') {
  return {
    ...ticket,
    updated: formatTicketUpdated(),
    activity: [...(ticket.activity || []), buildCommentActivity(who, text, authorRole)],
  };
}

function applyReopen(ticket, who = 'me', note, t) {
  const text = note || (t ? t('lifecycle.reopenedNote') : '');
  let next = applyStatusChange(ticket, 'inprog', who);
  next.activity = [...next.activity, buildReopenActivity(who, text)];
  return next;
}

function getActivityDisplay(entry, t) {
  const who = personName(entry.who);
  if (entry.kind === 'opened') {
    return {
      headline: t('lifecycle.history.opened', { who }),
      body: entry.text || '',
      tone: 'muted',
      showBubble: false,
    };
  }
  if (entry.kind === 'status_change') {
    const from = t(`status.${entry.fromStatus}`);
    const to = t(`status.${entry.toStatus}`);
    return {
      headline: t('lifecycle.history.statusChange', { who, from, to }),
      body: '',
      tone: 'info',
      showBubble: false,
    };
  }
  if (entry.kind === 'comment') {
    return {
      headline: t('lifecycle.history.comment', { who }),
      body: entry.text,
      tone: 'default',
      showBubble: true,
    };
  }
  if (entry.kind === 'reopened') {
    return {
      headline: t('lifecycle.history.reopened', { who }),
      body: entry.text || '',
      tone: 'warning',
      showBubble: !!entry.text,
    };
  }
  if (entry.kind === 'resolved') {
    return {
      headline: t('lifecycle.history.statusChange', {
        who,
        from: t('status.inprog'),
        to: t('status.resolved'),
      }),
      body: entry.text || '',
      tone: 'success',
      showBubble: false,
    };
  }
  if (entry.kind === 'triaged') {
    return {
      headline: t('lifecycle.history.triaged', { who }),
      body: entry.text || '',
      tone: 'info',
      showBubble: false,
    };
  }
  if (entry.kind === 'linked') {
    return {
      headline: t('lifecycle.history.linked', { who }),
      body: entry.text || '',
      tone: 'accent',
      showBubble: false,
    };
  }
  return { headline: who, body: entry.text || '', tone: 'muted', showBubble: !!entry.text };
}

function StatusSelector({ value, onChange, disabled }) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  const current = normalizeStatus(value);

  React.useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button type="button" disabled={disabled} onClick={() => !disabled && setOpen(o => !o)}
        style={{
          fontFamily: 'inherit', cursor: disabled ? 'default' : 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 10px', borderRadius: 8,
          border: '1px solid var(--border)', background: 'white',
          opacity: disabled ? 0.7 : 1,
        }}>
        <StatusBadge status={current} size="md"/>
        {!disabled && <Icon name="chevron-down" size={14} color="var(--fg-muted)"/>}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, marginTop: 6, zIndex: 50,
          background: 'white', border: '1px solid var(--border)', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)', padding: 6, minWidth: 220,
        }}>
          {TICKET_STATUS_IDS.map(id => (
            <button key={id} type="button"
              onClick={() => { onChange(id); setOpen(false); }}
              style={{
                width: '100%', textAlign: 'left', fontFamily: 'inherit',
                padding: '8px 10px', borderRadius: 6, border: 'none',
                background: id === current ? 'var(--accent-50)' : 'transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              }}>
              <StatusBadge status={id} size="md"/>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LifecycleMetricCard({ status, count, label, onFilter }) {
  const style = STATUS_STYLE[normalizeStatus(status)] || STATUS_STYLE.new;
  return (
    <button type="button" onClick={() => onFilter && onFilter(status)}
      style={{
        fontFamily: 'inherit', textAlign: 'left', padding: '14px 16px',
        borderRadius: 8, border: '1px solid var(--border)', background: 'white',
        cursor: onFilter ? 'pointer' : 'default',
        display: 'flex', flexDirection: 'column', gap: 8,
        transition: 'border-color 120ms, box-shadow 120ms',
      }}
      onMouseEnter={e => { if (onFilter) e.currentTarget.style.borderColor = 'var(--accent-300)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: style.dot || style.fg,
        }}/>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--fg-secondary)' }}>{label}</span>
      </div>
      <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--fg)' }}>{count}</span>
    </button>
  );
}

function LifecycleDashboard({ tickets, onFilterStatus }) {
  const { t } = useI18n();
  const m = computeLifecycleMetrics(tickets);
  const items = [
    { status: 'new', count: m.new, label: t('lifecycle.metrics.new') },
    { status: 'inprog', count: m.inprog, label: t('lifecycle.metrics.inprog') },
    { status: 'waiting', count: m.waiting, label: t('lifecycle.metrics.waiting') },
    { status: 'waiting_vendor', count: m.waitingVendor, label: t('lifecycle.metrics.waitingVendor') },
    { status: 'resolved', count: m.resolvedToday, label: t('lifecycle.metrics.resolvedToday') },
    { status: 'closed', count: m.closedToday, label: t('lifecycle.metrics.closedToday') },
  ];
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{t('lifecycle.dashboardTitle')}</h2>
        {onFilterStatus && (
          <a onClick={() => onFilterStatus('all')} style={{ fontSize: 12, color: 'var(--accent-700)', cursor: 'pointer', fontWeight: 500 }}>
            {t('lifecycle.viewAllTickets')}
          </a>
        )}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 10,
      }}>
        {items.map(item => (
          <LifecycleMetricCard key={item.status} {...item} onFilter={onFilterStatus}/>
        ))}
      </div>
    </section>
  );
}

Object.assign(window, {
  TICKET_STATUS_IDS,
  normalizeStatus,
  formatActivityTime,
  formatTicketUpdated,
  personName,
  buildOpenedActivity,
  buildStatusChangeActivity,
  buildCommentActivity,
  buildReopenActivity,
  getStatusNotification,
  getReopenNotification,
  canChangeStatus,
  canAssignTicket,
  canReopenTicket,
  isTicketActive,
  ticketMatchesStatusFilter,
  computeLifecycleMetrics,
  applyStatusChange,
  applyComment,
  applyReopen,
  getActivityDisplay,
  StatusSelector,
  LifecycleDashboard,
  LifecycleMetricCard,
});
