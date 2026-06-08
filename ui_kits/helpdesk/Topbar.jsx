// Topbar — search, integration health, notifications, user

function RoleSwitch({ role, onRoleChange }) {
  const { t } = useI18n();
  if (!onRoleChange) return null;
  const options = [
    { id: 'enduser', label: t('tweaks.endUser') },
    { id: 'it', label: t('tweaks.itTeam') },
  ];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: 3, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--ink-50)',
    }} title={t('tweaks.audience')}>
      {options.map(opt => {
        const on = role === opt.id;
        return (
          <button key={opt.id} type="button" onClick={() => onRoleChange(opt.id)}
            style={{
              fontFamily: 'inherit', fontSize: 11, fontWeight: on ? 600 : 500,
              padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: on ? 'white' : 'transparent',
              color: on ? 'var(--accent-700)' : 'var(--fg-secondary)',
              boxShadow: on ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            }}>
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Topbar({ title, breadcrumb, role='it', searchQuery='', onSearchChange, onRoleChange }) {
  const { t } = useI18n();
  const isEnd = role === 'enduser';
  const [searchFocus, setSearchFocus] = React.useState(false);
  const inputRef = React.useRef(null);
  const q = searchQuery || '';

  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        onSearchChange && onSearchChange('');
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSearchChange]);

  return (
    <header className="hd-topbar" style={{
      height:56, flexShrink:0,
      background:'var(--ink-0)', borderBottom:'1px solid var(--border)',
      display:'flex', alignItems:'center', gap:16, padding:'0 24px',
      position:'sticky', top:0, zIndex:10,
    }}>
      <div style={{display:'flex', flexDirection:'column', minWidth:0, flex:'1 1 auto', maxWidth:280}}>
        {breadcrumb && <div style={{fontSize:11, color:'var(--fg-muted)', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{breadcrumb}</div>}
        <div style={{fontSize:15, fontWeight:600, color:'var(--fg)', lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{title}</div>
      </div>

      {/* Search — center */}
      <div style={{flex:'1 1 200px', maxWidth:420, marginLeft:8}}>
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          background: searchFocus ? 'var(--ink-0)' : 'var(--ink-50)',
          border:'1px solid ' + (searchFocus ? 'var(--accent-600)' : (q ? 'var(--accent-300)' : 'var(--border)')),
          borderRadius:6, padding:'6px 10px',
          boxShadow: searchFocus ? 'var(--shadow-focus)' : 'none',
          transition: 'border-color 120ms, box-shadow 120ms, background 120ms',
        }}>
          <Icon name="search" size={14} color={searchFocus || q ? 'var(--accent-700)' : 'var(--fg-muted)'}/>
          <input
            ref={inputRef}
            type="search"
            value={q}
            onChange={e => onSearchChange && onSearchChange(e.target.value)}
            placeholder={t('topbar.searchPlaceholder')}
            onFocus={() => setSearchFocus(true)}
            onBlur={() => setSearchFocus(false)}
            aria-label={t('topbar.searchAria')}
            style={{
              flex:1, border:0, background:'transparent', outline:'none',
              fontSize:13, fontFamily:'inherit', color:'var(--fg)',
            }}
          />
          {q ? (
            <button type="button" onClick={() => onSearchChange && onSearchChange('')}
              aria-label={t('topbar.clearSearch')}
              style={{
                background:'transparent', border:0, padding:2, cursor:'pointer',
                color:'var(--fg-muted)', display:'flex', alignItems:'center',
              }}>
              <Icon name="x" size={14}/>
            </button>
          ) : (
            <kbd style={{
              fontSize:10, fontFamily:'var(--font-mono)', color:'var(--fg-muted)',
              border:'1px solid var(--border)', padding:'1px 5px', borderRadius:4, background:'white',
            }}>⌘K</kbd>
          )}
        </div>
      </div>

      {/* Right side */}
      <div style={{display:'flex', alignItems:'center', gap:8, marginLeft:'auto'}}>
        <RoleSwitch role={role} onRoleChange={onRoleChange}/>
        <LangSwitch/>
        {!isEnd && (
          <>
            <IntegrationPill name="Jira" color="#2684FF" status="ok"/>
            <IntegrationPill name="Slack" color="#36C5F0" status="ok"/>
            <div style={{width:1, height:20, background:'var(--border)', margin:'0 4px'}}></div>
          </>
        )}
        <button type="button" style={{
          background:'transparent', border:0, padding:6, cursor:'pointer',
          color:'var(--fg-secondary)', position:'relative',
        }}>
          <Icon name="bell" size={18}/>
          <span style={{
            position:'absolute', top:4, right:4, width:8, height:8, borderRadius:'50%',
            background: isEnd ? 'var(--accent-600)' : 'var(--critical-600)',
            border:'1.5px solid white',
          }}/>
        </button>
      </div>
    </header>
  );
}

function IntegrationPill({ name, color, status }) {
  const colors = {
    ok:   { dot:'#16A34A', text:'var(--fg-secondary)' },
    warn: { dot:'#D97706', text:'var(--warning-700)' },
    down: { dot:'#DC2626', text:'var(--critical-700)' },
  }[status];
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap:6,
      padding:'4px 9px', border:'1px solid var(--border)', borderRadius:999,
      fontSize:11, color:colors.text, background:'white',
    }}>
      <span style={{width:6, height:6, borderRadius:'50%', background:colors.dot}}></span>
      <span style={{width:6, height:6, borderRadius:'50%', background:color}}></span>
      {name}
    </div>
  );
}

Object.assign(window, { Topbar, IntegrationPill });
