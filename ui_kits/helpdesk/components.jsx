// PMG Helpdesk — shared atoms

const STATUS_STYLE = {
  new:            { bg:'#DBEAFE', fg:'#1D4ED8', dot:'#2563EB', border:'#BFDBFE' },
  inprog:         { bg:'#FEF9C3', fg:'#854D0E', dot:'#CA8A04', border:'#FDE68A' },
  waiting_info:   { bg:'#FFEDD5', fg:'#9A3412', dot:'#EA580C', border:'#FED7AA' },
  waiting_vendor: { bg:'#F3E8FF', fg:'#6B21A8', dot:'#9333EA', border:'#E9D5FF' },
  resolved:       { bg:'#DCFCE7', fg:'#166534', dot:'#16A34A', border:'#BBF7D0' },
  closed:         { bg:'var(--ink-100)', fg:'var(--fg-secondary)', dot:'var(--ink-500)', border:'var(--border)' },
  triaged:        { bg:'#FEF9C3', fg:'#854D0E', dot:'#CA8A04', border:'#FDE68A' },
  waiting:        { bg:'#FFEDD5', fg:'#9A3412', dot:'#EA580C', border:'#FED7AA' },
};

const PRIORITY_STYLE = {
  P1: { bg:'var(--critical-100)', fg:'var(--critical-700)', bars: 4 },
  P2: { bg:'#FFEDD5', fg:'#9A3412', bars: 3 },
  P3: { bg:'#FEF9C3', fg:'#854D0E', bars: 2 },
  P4: { bg:'var(--ink-100)', fg:'var(--fg-secondary)', bars: 1 },
};

function Button({ variant='primary', size='md', children, onClick, type='button', disabled, style: styleProp, ...rest }) {
  const base = {
    fontFamily: 'inherit',
    fontWeight: 500,
    borderRadius: 6,
    border: '1px solid transparent',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    lineHeight: 1,
    minHeight: 36,
    transition: 'background 120ms cubic-bezier(0.2,0.7,0.2,1), border-color 120ms, transform 80ms',
    whiteSpace: 'nowrap',
    opacity: disabled ? 0.45 : 1,
  };
  const sizes = {
    sm: { padding: '5px 10px', fontSize: 12 },
    md: { padding: '8px 14px', fontSize: 13 },
    lg: { padding: '11px 18px', fontSize: 14 },
  };
  const variants = {
    primary:   { background:'var(--accent-600)', color:'white' },
    secondary: { background:'white', color:'var(--fg)', borderColor:'var(--border-strong)' },
    ghost:     { background:'transparent', color:'var(--fg)' },
    danger:    { background:'white', color:'var(--critical-700)', borderColor:'var(--border)' },
  };
  const hoverStyles = {
    primary: { background:'var(--accent-700)' },
    secondary: { background:'var(--ink-50)' },
    ghost: { background:'var(--ink-100)' },
    danger: { background:'var(--critical-50)', borderColor:'var(--critical-600)' },
  };
  const [hover, setHover] = React.useState(false);
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onMouseEnter={()=>!disabled && setHover(true)}
      onMouseLeave={()=>setHover(false)}
      onMouseDown={e => !disabled && variant === 'primary' && (e.currentTarget.style.transform = 'translateY(1px)')}
      onMouseUp={e => { e.currentTarget.style.transform = ''; }}
      style={{...base, ...sizes[size], ...variants[variant], ...(hover && !disabled ? hoverStyles[variant] : {}), ...styleProp}}
      {...rest}
    >{children}</button>
  );
}

function StatusBadge({ status, size='sm' }) {
  const { t } = useI18n();
  const norm = window.normalizeStatus ? window.normalizeStatus(status) : status;
  const style = STATUS_STYLE[norm] || STATUS_STYLE.new;
  const label = t(`status.${norm}`);
  const small = size === 'sm';
  const medium = size === 'md';
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding: small ? '2px 8px' : (medium ? '4px 12px' : '4px 10px'),
      borderRadius:999, fontSize: small ? 11 : (medium ? 13 : 12), fontWeight:600,
      background: style.bg, color: style.fg, lineHeight:1.3,
      border: style.border && style.border !== 'transparent' ? `1px solid ${style.border}` : 'none',
    }}>
      <span style={{width:6, height:6, borderRadius:'50%', background:style.dot}}></span>
      {label}
    </span>
  );
}

function PriorityPill({ priority }) {
  const { t } = useI18n();
  const style = PRIORITY_STYLE[priority] || PRIORITY_STYLE.P4;
  const tip = t(`priority.${priority}`);
  return (
    <span title={tip} style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding:'2px 7px', borderRadius:4,
      fontSize:11, fontWeight:600, fontFamily:'var(--font-mono)',
      letterSpacing:'0.02em',
      background: style.bg, color: style.fg,
    }}>
      <span style={{display:'inline-flex', gap:2}}>
        {[0,1,2,3].map(i =>
          <i key={i} style={{width:3, height:9, background:'currentColor', borderRadius:1, opacity: i < style.bars ? 1 : 0.3, display:'inline-block'}}></i>
        )}
      </span>
      {priority}
    </span>
  );
}

function Avatar({ person, size=28 }) {
  if (!person) {
    return (
      <span style={{
        width:size, height:size, borderRadius:'50%',
        background:'var(--ink-100)', color:'var(--fg-muted)',
        border:'1px dashed var(--border-strong)',
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        fontSize: size*0.4,
      }}>?</span>
    );
  }
  return (
    <span style={{
      width:size, height:size, borderRadius:'50%',
      background: person.color, color:'white',
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      fontSize: Math.max(10, size*0.4), fontWeight:600, flexShrink:0,
    }}>{person.init}</span>
  );
}

function Field({ label, hint, error, children }) {
  return (
    <div style={{display:'flex', flexDirection:'column', gap:6}}>
      {label && <label style={{fontSize:12, fontWeight:500, color:'var(--fg)'}}>{label}</label>}
      {children}
      {(hint || error) && <span style={{fontSize:11, color: error ? 'var(--critical-600)' : 'var(--fg-muted)'}}>{error || hint}</span>}
    </div>
  );
}

function Input({ value, onChange, placeholder, error, ...rest }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <input
      value={value}
      onChange={e => onChange && onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={()=>setFocus(true)}
      onBlur={()=>setFocus(false)}
      style={{
        fontFamily:'inherit', fontSize:14, padding:'8px 12px',
        borderRadius:6, border:'1px solid ' + (error ? 'var(--critical-600)' : focus ? 'var(--accent-600)' : 'var(--border)'),
        boxShadow: focus ? '0 0 0 3px rgba(22,96,207,0.22)' : 'none',
        outline:'none', background:'white', color:'var(--fg)',
        transition: 'all 120ms',
      }}
      {...rest}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows=4 }) {
  const [focus, setFocus] = React.useState(false);
  return (
    <textarea
      value={value} onChange={e=>onChange&&onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
      style={{
        fontFamily:'inherit', fontSize:14, padding:'10px 12px',
        borderRadius:6, border:'1px solid ' + (focus ? 'var(--accent-600)' : 'var(--border)'),
        boxShadow: focus ? '0 0 0 3px rgba(22,96,207,0.22)' : 'none',
        outline:'none', background:'white', color:'var(--fg)',
        resize:'vertical', lineHeight:1.5,
      }}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select value={value} onChange={e=>onChange&&onChange(e.target.value)}
      style={{
        fontFamily:'inherit', fontSize:14, padding:'8px 32px 8px 12px',
        borderRadius:6, border:'1px solid var(--border)', background:'white',
        color:'var(--fg)', appearance:'none',
        backgroundImage:`linear-gradient(45deg, transparent 50%, var(--fg-secondary) 50%), linear-gradient(135deg, var(--fg-secondary) 50%, transparent 50%)`,
        backgroundPosition: 'calc(100% - 14px) 14px, calc(100% - 9px) 14px',
        backgroundSize:'5px 5px', backgroundRepeat:'no-repeat',
      }}>
      {options.map(o => <option key={o.value || o} value={o.value || o}>{o.label || o}</option>)}
    </select>
  );
}

// Lucide icon — pass `name` for the registered ones below, or `path` for inline
function Icon({ name, size=16, color='currentColor', strokeWidth=1.5 }) {
  const paths = ICONS[name] || ICONS.help;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      style={{flexShrink:0}}>
      {paths.map((d, i) =>
        d.startsWith('circle:')
          ? (() => { const [_, cx, cy, r] = d.split(':'); return <circle key={i} cx={cx} cy={cy} r={r}/>; })()
          : d.startsWith('rect:')
          ? (() => { const [_, x, y, w, h, rx] = d.split(':'); return <rect key={i} x={x} y={y} width={w} height={h} rx={rx||0}/>; })()
          : d.startsWith('line:')
          ? (() => { const [_, x1, y1, x2, y2] = d.split(':'); return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}/>; })()
          : <path key={i} d={d} />
      )}
    </svg>
  );
}

const ICONS = {
  'home':       ['M3 12l9-9 9 9','M5 10v10h14V10'],
  'inbox':      ['M22 12h-6l-2 3h-4l-2-3H2','M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z'],
  'list':       ['rect:3:4:18:16:2','line:3:10:21:10','line:9:4:9:20'],
  'clock':      ['circle:12:12:10','M12 6v6l4 2'],
  'plus':       ['line:12:5:12:19','line:5:12:19:12'],
  'search':     ['circle:11:11:8','M21 21l-4.35-4.35'],
  'bell':       ['M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9','M13.73 21a2 2 0 0 1-3.46 0'],
  'printer':    ['M6 9V4h12v5','M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2','rect:6:14:12:8:0'],
  'monitor':    ['rect:2:4:20:12:2','line:8:20:16:20','line:12:16:12:20'],
  'pill':       ['M10.5 20.5a7.07 7.07 0 0 1-10-10l10-10a7.07 7.07 0 0 1 10 10z','line:8.5:8.5:15.5:15.5'],
  'box':        ['M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z','M3.27 6.96L12 12.01l8.73-5.05','line:12:22.08:12:12'],
  'key':        ['circle:7.5:15.5:5.5','M21 2l-9.6 9.6','line:15.5:7.5:18.5:10.5'],
  'package':    ['line:16.5:9.4:7.5:4.21','M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z','M3.27 6.96L12 12.01l8.73-5.05','line:12:22.08:12:12'],
  'user-plus': ['M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','circle:8.5:7:4','line:20:8:20:14','line:23:11:17:11'],
  'user-minus':['M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','circle:8.5:7:4','line:23:11:17:11'],
  'tag':        ['M20.59 13.41L13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z','line:7:7:7.01:7'],
  'check':      ['M20 6L9 17l-5-5'],
  'check-circle':['M22 11.08V12a10 10 0 1 1-5.93-9.14','M22 4L12 14.01l-3-3'],
  'x':          ['line:18:6:6:18','line:6:6:18:18'],
  'chevron-down':['M6 9l6 6 6-6'],
  'chevron-right':['M9 18l6-6-6-6'],
  'arrow-up-right':['M7 17L17 7','M7 7h10v10'],
  'link':       ['M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71','M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71'],
  'send':       ['line:22:2:11:13','M22 2l-7 20-4-9-9-4 20-7z'],
  'paperclip':  ['M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48'],
  'more':       ['circle:12:12:1','circle:19:12:1','circle:5:12:1'],
  'filter':     ['M22 3H2l8 9.46V19l4 2v-8.54L22 3z'],
  'help':       ['circle:12:12:10','M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3','line:12:17:12.01:17'],
  'alert':      ['M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z','line:12:9:12:13','line:12:17:12.01:17'],
  'settings':   ['circle:12:12:3','M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'],
  'users':      ['M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2','circle:9:7:4','M23 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
  'building':   ['rect:4:8:16:14:2','line:4:8:4:8','line:12:8:12:8','line:16:14:20:14:2'],
  'map-pin':    ['circle:12:12:10','M12 2a8 8 0 0 1 8 8c0 5.25-8 10-8 10s8 4.75 8 10'],
  'file-text':  ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','line:16:13:8:13','line:12:13:12:13'],
  'image':      ['rect:3:4:18:16:2','circle:8.5:8.5:1.5','circle:15.5:8.5:1.5','M21 16l-5-5L5 21'],
  'calendar':   ['rect:3:6:18:18:2','line:16:2:16:6','line:8:2:8:6','line:3:10:21:10'],
  'clipboard':  ['rect:8:4:16:4:1','rect:8:2:16:4:1','M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'],
  'keyboard':   ['rect:2:6:20:12:2','line:6:10:6:14','line:10:10:14:10','line:14:10:18:10','line:6:14:6:18','line:10:14:14:18'],
  'mouse':      ['rect:5:2:14:8:2','line:12:2:12:22','line:8:6:8:6'],
  'headphones': ['M3 14v3a4 4 0 0 0 4 4h1','M21 14v3a4 4 0 0 1-4 4h-1','M7 10a5 5 0 0 1 10 0v4a5 5 0 0 1-10 0z'],
  'refresh':    ['M23 4v6h-6','M1 20v-6h6','M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15'],
  'phone':      ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'],
};

function Card({ children, padding=16, hoverable=false, onClick, style={} }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      style={{
        background:'white', border:'1px solid var(--border)', borderRadius:8,
        padding, cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 120ms, box-shadow 120ms',
        ...(hoverable && hover ? { borderColor:'var(--border-strong)', boxShadow:'0 1px 2px rgba(11,13,16,0.06)' } : {}),
        ...style,
      }}
    >{children}</div>
  );
}

function Eyebrow({ children }) {
  return <div style={{fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--fg-muted)'}}>{children}</div>;
}

function ticketMatchesSearch(ticket, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return true;
  const reporter = window.PMG_DATA?.PEOPLE?.find(p => p.id === ticket.reporter);
  const assignee = window.PMG_DATA?.PEOPLE?.find(p => p.id === ticket.assignee);
  const category = window.PMG_DATA?.CATEGORIES?.find(c => c.id === ticket.category);
  const lang = document.documentElement.lang || 'en';
  const statusLabel = getNested(STRINGS[lang], `status.${ticket.status}`) || '';
  const catLoc = STRINGS[lang]?.categories?.[ticket.category];
  const haystack = [
    ticket.id, ticket.title, ticket.body, ticket.jira, ticket.slack,
    ticket.priority, ticket.status, statusLabel,
    reporter?.name, reporter?.email, assignee?.name,
    catLoc?.label || category?.label, catLoc?.hint || category?.hint,
  ].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(q);
}

const STATUS_SORT_ORDER = { new: 0, triaged: 1, inprog: 2, waiting: 3, resolved: 4, closed: 5 };
const PRIORITY_SORT_ORDER = { P1: 0, P2: 1, P3: 2, P4: 3 };

function compareTickets(a, b, sortCol, sortDir) {
  const mul = sortDir === 'asc' ? 1 : -1;
  let cmp = 0;
  switch (sortCol) {
    case 'id':
      cmp = (a.id || '').localeCompare(b.id || '', undefined, { numeric: true });
      break;
    case 'priority':
      cmp = (PRIORITY_SORT_ORDER[a.priority] ?? 9) - (PRIORITY_SORT_ORDER[b.priority] ?? 9);
      break;
    case 'title':
      cmp = (a.title || '').localeCompare(b.title || '');
      break;
    case 'assignee': {
      const na = window.PMG_DATA?.PEOPLE?.find(p => p.id === a.assignee)?.name || '';
      const nb = window.PMG_DATA?.PEOPLE?.find(p => p.id === b.assignee)?.name || '';
      if (!na && nb) cmp = 1;
      else if (na && !nb) cmp = -1;
      else cmp = na.localeCompare(nb);
      break;
    }
    case 'status':
      cmp = (STATUS_SORT_ORDER[a.status] ?? 9) - (STATUS_SORT_ORDER[b.status] ?? 9);
      break;
    case 'updated':
    default:
      cmp = (b.updated || '').localeCompare(a.updated || '');
      if (sortDir === 'asc') cmp = -cmp;
      return cmp;
  }
  return cmp * mul;
}

function sortTickets(tickets, sortCol, sortDir) {
  return [...tickets].sort((a, b) => compareTickets(a, b, sortCol, sortDir));
}

function SearchBanner({ query, count, onClear, hint }) {
  const { t } = useI18n();
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:10, padding:'10px 14px', flexWrap:'wrap',
      background:'var(--accent-50)', border:'1px solid var(--accent-100)', borderRadius:8,
      fontSize:13, color:'var(--fg-secondary)',
    }}>
      <Icon name="search" size={14} color="var(--accent-700)"/>
      <span style={{flex:'1 1 200px'}}>
        {t('inbox.searchResults', { n: count })}{' '}
        <strong style={{color:'var(--fg)', fontFamily:'var(--font-mono)'}}>{query}</strong>
      </span>
      {hint}
      <button type="button" onClick={onClear}
        style={{background:'transparent', border:0, color:'var(--accent-700)', cursor:'pointer', fontSize:12, fontWeight:600}}>
        {t('inbox.clear')}
      </button>
    </div>
  );
}

Object.assign(window, {
  Button, StatusBadge, PriorityPill, Avatar, Field, Input, Textarea, Select, Icon, Card, Eyebrow,
  STATUS_STYLE, PRIORITY_STYLE, ticketMatchesSearch, sortTickets, SearchBanner,
});
