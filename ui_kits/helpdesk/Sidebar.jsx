// Sidebar — left navigation with categories + counts

function Sidebar({ currentView, setCurrentView, ticketCounts, onNew, role='it', isAdmin=false }) {
  const { t, lang } = useI18n();
  const isEnd = role === 'enduser';
  const navItems = isEnd ? [
    { id:'home', icon:'home', labelKey:'nav.home' },
    { id:'mine', icon:'list', labelKey:'nav.myTickets', count: ticketCounts.mine },
    { id:'wait', icon:'clock', labelKey:'nav.waitingOnYou', count: ticketCounts.waiting },
  ] : [
    { id:'home', icon:'home', labelKey:'nav.home' },
    { id:'reports', icon:'clipboard', labelKey:'nav.reports' },
    ...(isAdmin ? [{ id:'admin:portal', icon:'settings', labelKey:'nav.adminPortal' }] : []),
    { id:'mine', icon:'list', labelKey:'nav.myTickets', count: ticketCounts.mine },
    { id:'inbox', icon:'inbox', labelKey:'nav.allTickets', count: ticketCounts.all },
    { id:'wait', icon:'clock', labelKey:'nav.waitingOnMe', count: ticketCounts.waiting },
  ];
  const incidentCategories = window.PMG_DATA.CATEGORIES;
  const itProcesses = !isEnd ? (window.PMG_DATA.IT_PROCESS_CATEGORIES || []) : [];

  return (
    <aside style={{
      width:240, flexShrink:0, height:'100vh',
      background:'var(--ink-0)', borderRight:'1px solid var(--border)',
      display:'flex', flexDirection:'column',
      position:'sticky', top:0,
    }}>
      <div style={{padding:'16px 16px 12px', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid var(--ink-100)'}}>
        <div style={{
          background:'var(--ink-900)', width:32, height:32, borderRadius:8,
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>
          <img src="../../assets/logo-pmg-dark.png" style={{height:14, display:'block'}} alt="PMG"/>
        </div>
        <div style={{display:'flex', flexDirection:'column', lineHeight:1.15, minWidth:0}}>
          <span style={{fontSize:13, fontWeight:600, color:'var(--fg)'}}>{t('nav.helpdesk')}</span>
          <span style={{fontSize:11, color:'var(--fg-muted)'}}>{isEnd ? t('nav.subtitleEnd') : t('nav.subtitleIt')}</span>
        </div>
      </div>

      <div style={{padding:'12px 12px 8px'}}>
        <div style={{width:'100%'}}>
          <Button variant="primary" size="md" onClick={onNew} style={{width:'100%', justifyContent:'center'}}>
            <Icon name="plus" size={14} color="white"/>
            {isEnd ? t('nav.reportSomething') : t('nav.newTicket')}
          </Button>
        </div>
      </div>

      <nav style={{padding:'4px 8px', display:'flex', flexDirection:'column', gap:1, overflow:'auto', flex:1}}>
        {navItems.map(n => (
          <NavItem key={n.id} icon={n.icon} label={t(n.labelKey)} count={n.count}
            active={currentView === n.id}
            onClick={()=>setCurrentView(n.id)} />
        ))}

        <div style={{padding:'14px 10px 4px', fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--fg-muted)'}}>
          {t('nav.incidentsSupport')}
        </div>
        {incidentCategories.map(c => {
          const loc = getLocalizedCategory(c.id, lang);
          return (
            <NavItem key={c.id} icon={c.icon} label={loc.label}
              active={currentView === 'cat:'+c.id}
              onClick={()=> isEnd ? onNew() : setCurrentView('cat:'+c.id)} />
          );
        })}
        {itProcesses.length > 0 && (
          <>
            <div style={{padding:'14px 10px 4px', fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--fg-muted)'}}>
              {t('nav.itProcesses')}
            </div>
            {itProcesses.map(c => {
              const loc = getLocalizedCategory(c.id, lang);
              return (
                <NavItem key={c.id} icon={c.icon} label={loc.label}
                  active={currentView === 'cat:'+c.id}
                  onClick={() => setCurrentView('cat:'+c.id)}/>
              );
            })}
          </>
        )}
      </nav>

      <UserFooter isEnd={isEnd}/>
    </aside>
  );
}

function UserFooter({ isEnd }) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const me = window.PMG_DATA.PEOPLE.find(p=>p.id==='me');
  React.useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    setTimeout(() => document.addEventListener('click', close, { once: true }), 0);
    return () => document.removeEventListener('click', close);
  }, [open]);

  return (
    <div style={{position:'relative', borderTop:'1px solid var(--ink-100)'}}>
      <div onClick={() => setOpen(o => !o)} style={{
        padding:12, display:'flex', alignItems:'center', gap:10, cursor:'pointer',
        background: open ? 'var(--ink-50)' : 'transparent',
      }}>
        <Avatar person={me} size={28}/>
        <div style={{flex:1, display:'flex', flexDirection:'column', lineHeight:1.2, minWidth:0}}>
          <span style={{fontSize:12, fontWeight:600, color:'var(--fg)'}}>{me?.name || 'You'}</span>
          <span style={{fontSize:11, color:'var(--fg-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>you@pmg.com</span>
        </div>
        <Icon name="chevron-down" size={14} color="var(--fg-muted)"/>
      </div>
      {open && (
        <div onClick={e=>e.stopPropagation()} style={{
          position:'absolute', bottom:'calc(100% + 6px)', left:8, right:8,
          background:'white', border:'1px solid var(--border)', borderRadius:8,
          boxShadow:'0 4px 12px rgba(11,13,16,0.08), 0 1px 0 rgba(11,13,16,0.02)',
          padding:6, zIndex:50,
        }}>
          <div style={{padding:'8px 10px 6px', borderBottom:'1px solid var(--ink-100)', marginBottom:4}}>
            <div style={{fontSize:12, color:'var(--fg)', fontWeight:600}}>{me?.name || 'You'}</div>
            <div style={{fontSize:11, color:'var(--fg-muted)'}}>you@pmg.com · {isEnd ? t('nav.roleEnd') : t('nav.roleIt')}</div>
          </div>
          <MenuItem icon="settings" label={t('nav.accountSettings')}/>
          <MenuItem icon="bell" label={t('nav.notifications')}/>
          <div style={{height:1, background:'var(--ink-100)', margin:'4px 0'}}/>
          <MenuItem icon="x" label={t('nav.signOut')} onClick={() => window.dispatchEvent(new CustomEvent('pmg-signout'))} danger/>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      style={{
        display:'flex', alignItems:'center', gap:10, padding:'7px 10px',
        borderRadius:6, cursor:'pointer', fontSize:13,
        background: hover ? 'var(--ink-50)' : 'transparent',
        color: danger ? 'var(--critical-700)' : 'var(--fg)',
      }}>
      <Icon name={icon} size={14} color={danger ? 'var(--critical-600)' : 'var(--fg-secondary)'}/>
      <span>{label}</span>
    </div>
  );
}

function NavItem({ icon, label, count, active, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      style={{
        display:'flex', alignItems:'center', gap:10,
        padding:'7px 10px 7px 8px', borderRadius:6, cursor:'pointer',
        fontSize:13,
        background: active ? 'var(--bg-selected)' : (hover ? 'var(--bg-hover)' : 'transparent'),
        color: active ? 'var(--fg)' : (hover ? 'var(--fg)' : 'var(--fg-secondary)'),
        fontWeight: active ? 600 : 400,
        borderLeft: active ? '2px solid var(--accent-600)' : '2px solid transparent',
        transition: 'background 120ms, border-color 120ms',
      }}>
      <Icon name={icon} size={16} color={active ? 'var(--accent-700)' : 'currentColor'}/>
      <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{label}</span>
      {count != null && (
        <span style={{
          fontSize:11, fontFamily:'var(--font-mono)',
          color: active ? 'var(--accent-700)' : 'var(--fg-muted)',
        }}>{count}</span>
      )}
    </div>
  );
}

Object.assign(window, { Sidebar, NavItem });
