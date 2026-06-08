// Home — dashboard + portail incidents / services

function Home({ tickets, openTicket, setCurrentView, role='it', searchQuery='', onSearchChange, onFilterStatus }) {
  const { t, lang } = useI18n();
  const isEnd = role === 'enduser';
  const q = (searchQuery || '').trim();
  const matchSearch = tk => ticketMatchesSearch(tk, q);

  const mine = tickets.filter(t => t.reporter === 'me' || t.assignee === 'me');
  const mineVisible = q ? mine.filter(matchSearch) : mine;
  const waiting = tickets.filter(t => {
    const s = normalizeStatus(t.status);
    return (s === 'waiting_info' || s === 'waiting') && t.reporter === 'me';
  });
  const active = tickets.filter(t => isTicketActive(t.status));

  const countPortalTickets = (item) => tickets.filter(tk => {
    if (!isTicketActive(tk.status)) return false;
    if (item.portalFlow === 'avd') return tk.category === 'avd';
    if (item.portalFlow === 'access') return tk.category === 'access';
    if (item.portalFlow === 'materials') return tk.category === 'materials';
    if (item.prefillProblemArea) {
      if (tk.formAnswers?.problem_area === item.prefillProblemArea) return true;
      if (item.id === 'kroll' && tk.category === 'kroll') return true;
      return false;
    }
    return tk.category === item.ticketCategory;
  }).length;

  const incidentById = Object.fromEntries(
    (window.PMG_DATA.PORTAL_INCIDENT_ITEMS || []).map(item => {
      const loc = getLocalizedPortalIncident(item.id, lang);
      return [item.id, { ...item, label: loc.label, hint: loc.hint, count: countPortalTickets(item) }];
    })
  );

  const groupLabelKeys = {
    virtual: 'home.portalGroupVirtual',
    pharmacy: 'home.portalGroupPharmacy',
    applications: 'home.portalGroupApplications',
    equipment: 'home.portalGroupEquipment',
    access: 'home.portalGroupAccess',
  };
  const incidentGroups = (window.PMG_DATA.PORTAL_INCIDENT_GROUPS || []).map(group => ({
    id: group.id,
    title: t(groupLabelKeys[group.id] || group.id),
    items: group.itemIds.map(id => incidentById[id]).filter(Boolean),
  })).filter(g => g.items.length > 0);

  const serviceCatalog = (window.PMG_DATA.SERVICE_CATALOG || []).map(s => getLocalizedService(s.id, lang));

  const hour = new Date().getHours();
  const greet = hour < 5 ? t('home.greetNight') : hour < 12 ? t('home.greetMorning') : hour < 17 ? t('home.greetAfternoon') : t('home.greetEvening');

  const myActive = mine.filter(tk => isTicketActive(tk.status));
  const subhead = q
    ? t('home.subSearch', { n: mineVisible.length })
    : isEnd
    ? (myActive.length === 0 ? t('home.subEmptyEnd') : t('home.subOpenEnd', { n: myActive.length }))
    : t('home.subActiveIt', { n: active.length });

  const recentActivity = (q ? tickets.filter(matchSearch) : tickets).slice(0, 5);

  const openIncident = (portalId) => {
    const item = window.PMG_DATA.PORTAL_INCIDENT_ITEMS?.find(i => i.id === portalId);
    if (isEnd) setCurrentView('new:' + portalId);
    else setCurrentView('cat:' + (item?.ticketCategory || portalId));
  };

  const openService = (serviceId) => {
    setCurrentView('service:' + serviceId);
  };

  return (
    <div className="hd-page" style={{display:'flex', flexDirection:'column', gap:28}}>
      {q && (
        <SearchBanner query={q} count={mineVisible.length} onClear={() => onSearchChange && onSearchChange('')}
          hint={!isEnd ? <a onClick={() => setCurrentView('inbox')} style={{fontSize:12, color:'var(--accent-700)', cursor:'pointer', fontWeight:500}}>{t('home.seeAllInbox')}</a> : null}/>
      )}
      <header style={{display:'flex', flexDirection:'column', gap:4}}>
        <h1 style={{margin:0, fontSize:24, fontWeight:700, letterSpacing:'-0.02em', color:'var(--fg)'}}>{greet}, {t('home.greetYou')}</h1>
        <p style={{margin:0, fontSize:14, color:'var(--fg-secondary)'}}>{subhead}</p>
      </header>

      {isEnd ? (
        <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:12}}>
          <Stat label={t('home.statMyOpen')} value={myActive.length} accent/>
          <Stat label={t('home.statWaitingYou')} value={waiting.length} tone="warning"/>
        </div>
      ) : (
        <>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12}}>
            <Stat label={t('home.statMyOpen')} value={myActive.length} accent/>
            <Stat label={t('home.statWaitingMe')} value={waiting.length} tone="warning"/>
            <Stat label={t('home.statTeamOpen')} value={active.length}/>
            <Stat label={t('home.statResolvedWeek')} value={tickets.filter(tk => normalizeStatus(tk.status)==='resolved').length} tone="success"/>
          </div>
          <LifecycleDashboard tickets={tickets} onFilterStatus={onFilterStatus}/>
          <ReportsHomeBanner onOpen={() => setCurrentView('reports')}/>
        </>
      )}

      {/* Portail — deux catalogues distincts (même cartes, même grille) */}
      <section style={{display:'flex', flexDirection:'column', gap:24}} aria-label={t('home.portalTitle')}>
        <PortalCatalogSection
          title={t('home.incidentsSupport')}
          hint={t('home.incidentsHint')}
          icon="alert"
        >
          {incidentGroups.map((group, gi) => (
            <PortalCatalogGroup key={group.id} title={group.title} first={gi === 0}>
              {group.items.map(c => (
                <PortalCatalogCard
                  key={c.id}
                  icon={c.icon}
                  title={c.label}
                  description={c.hint}
                  actionLabel={t('home.reportIncident')}
                  badge={!isEnd && c.count > 0 ? String(c.count) : null}
                  onClick={() => openIncident(c.id)}
                />
              ))}
            </PortalCatalogGroup>
          ))}
        </PortalCatalogSection>

        <PortalCatalogSection
          title={t('home.servicesIt')}
          hint={t('home.servicesHint')}
          icon="clipboard"
          separated
        >
          {serviceCatalog.map(s => (
            <PortalCatalogCard
              key={s.id}
              icon={s.icon}
              title={s.label}
              description={s.description || s.short}
              actionLabel={t('home.requestService')}
              onClick={() => openService(s.id)}
            />
          ))}
        </PortalCatalogSection>
      </section>

      <section style={{display:'flex', flexDirection:'column', gap:10}}>
        <SectionHeader title={t('home.myTickets')} action={
          mineVisible.length > 4 ? <a onClick={()=>setCurrentView('mine')} style={{fontSize:12, color:'var(--accent-700)', cursor:'pointer', fontWeight:500}}>{t('home.seeAll')}</a> : null
        }/>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          {mineVisible.slice(0,4).map(tk => (
            <TicketRow key={tk.id} ticket={tk} onClick={()=>openTicket(tk.id)}/>
          ))}
          {mineVisible.length === 0 && (
            <EmptyState>{q ? t('home.emptySearch') : t('home.emptyPlate')}</EmptyState>
          )}
        </div>
      </section>

      {!isEnd && (
        <section style={{display:'flex', flexDirection:'column', gap:10}}>
          <SectionHeader title={t('home.recentActivity')}/>
          <div style={{display:'flex', flexDirection:'column', gap:0, background:'white', border:'1px solid var(--border)', borderRadius:8}}>
            {recentActivity.map((tk, i) => (
              <ActivityRow key={tk.id} ticket={tk} onClick={()=>openTicket(tk.id)} first={i===0}/>
            ))}
            {recentActivity.length === 0 && q && (
              <div style={{padding:24, textAlign:'center', fontSize:13, color:'var(--fg-muted)'}}>{t('home.noActivitySearch')}</div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

const PORTAL_CARD_MIN_HEIGHT = 148;

function ReportsHomeBanner({ onOpen }) {
  const { t } = useI18n();
  const [hover, setHover] = React.useState(false);
  return (
    <button type="button" onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: 'inherit', textAlign: 'left', width: '100%',
        padding: '16px 18px', borderRadius: 10, cursor: 'pointer',
        border: '1px solid ' + (hover ? 'var(--accent-300)' : 'var(--accent-100)'),
        background: hover ? 'var(--accent-50)' : 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        transition: 'border-color 140ms, background 140ms',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: 'var(--accent-50)', border: '1px solid var(--accent-100)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="clipboard" size={22} color="var(--accent-700)"/>
        </span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)' }}>{t('home.reportsBannerTitle')}</div>
          <div style={{ fontSize: 12, color: 'var(--fg-secondary)', marginTop: 2 }}>{t('home.reportsBannerHint')}</div>
        </div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-700)', display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        {t('home.reportsBannerAction')}
        <Icon name="chevron-right" size={14} color="var(--accent-700)"/>
      </span>
    </button>
  );
}

function PortalCatalogSection({ title, hint, icon, separated, children }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 14,
      paddingTop: separated ? 24 : 0,
      borderTop: separated ? '1px solid var(--ink-200)' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <span style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: 'white', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={18} color="var(--accent-700)"/>
        </span>
        <div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--fg)' }}>{title}</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.45 }}>{hint}</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {children}
      </div>
    </div>
  );
}

function PortalCatalogGroup({ title, first, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h3 style={{
        margin: 0, fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
        textTransform: 'uppercase', color: 'var(--fg-muted)',
        paddingTop: first ? 0 : 4,
      }}>{title}</h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 12,
        alignItems: 'stretch',
      }}>
        {children}
      </div>
    </div>
  );
}

function PortalCatalogCard({ icon, title, description, actionLabel, badge, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'white',
        border: '1px solid ' + (hover ? 'var(--border-strong)' : 'var(--border)'),
        borderRadius: 10,
        padding: '16px 18px',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: PORTAL_CARD_MIN_HEIGHT,
        height: '100%',
        transition: 'border-color 140ms, box-shadow 140ms, transform 140ms',
        boxShadow: hover ? '0 6px 20px rgba(11,13,16,0.07)' : '0 1px 2px rgba(11,13,16,0.03)',
        transform: hover ? 'translateY(-2px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <span style={{
          width: 40, height: 40, borderRadius: 8, flexShrink: 0,
          background: 'var(--ink-50)', border: '1px solid var(--ink-100)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={20} color="var(--fg-secondary)"/>
        </span>
        {badge && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
            padding: '2px 8px', borderRadius: 999, background: 'var(--ink-100)', color: 'var(--fg)',
          }}>{badge}</span>
        )}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', lineHeight: 1.3, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--fg-muted)', lineHeight: 1.45, flex: 1 }}>{description}</div>
      </div>
      <span style={{
        fontSize: 12, fontWeight: 600, color: 'var(--accent-700)',
        display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 'auto',
      }}>
        {actionLabel}
        <Icon name="chevron-right" size={14} color="var(--accent-700)"/>
      </span>
    </div>
  );
}

/** @deprecated use PortalCatalogCard */
const ServiceCatalogCard = PortalCatalogCard;

function Stat({ label, value, accent=false, tone }) {
  const toneColor = tone==='warning' ? 'var(--warning-700)' :
                    tone==='success' ? 'var(--success-700)' :
                    accent ? 'var(--accent-700)' :
                    'var(--fg)';
  return (
    <div style={{
      background:'white', border:'1px solid var(--border)', borderRadius:8,
      padding:'16px 18px', display:'flex', flexDirection:'column', gap:6,
    }}>
      <span style={{fontSize:11, color:'var(--fg-muted)', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase'}}>{label}</span>
      <span style={{fontSize:24, fontWeight:700, letterSpacing:'-0.02em', color:toneColor, lineHeight:1.1, fontVariantNumeric:'tabular-nums'}}>{value}</span>
    </div>
  );
}

function SectionHeader({ title, action }) {
  return (
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
      <h2 style={{margin:0, fontSize:14, fontWeight:600, color:'var(--fg)'}}>{title}</h2>
      {action}
    </div>
  );
}

function CategoryListRow({ children, onClick, first }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        display:'flex', alignItems:'center', gap:10, padding:'11px 14px',
        borderTop: first ? 'none' : '1px solid var(--ink-100)',
        cursor:'pointer', background: hover ? 'var(--ink-50)' : 'transparent',
        transition: 'background 120ms',
      }}>
      {children}
    </div>
  );
}

function TicketRow({ ticket, onClick, compact=false }) {
  const { lang } = useI18n();
  const [hover, setHover] = React.useState(false);
  const reporter = window.PMG_DATA.PEOPLE.find(p => p.id === ticket.reporter);
  const catLabel = ticket.serviceId
    ? getLocalizedService(ticket.serviceId, lang).label
    : ticket.category === 'onboard'
    ? getLocalizedCategory('onboard', lang).label
    : getLocalizedCategory(ticket.category, lang).label;
  const isP1 = ticket.priority === 'P1';
  return (
    <div
      onClick={onClick}
      onMouseEnter={()=>setHover(true)}
      onMouseLeave={()=>setHover(false)}
      style={{
        background: hover ? 'var(--ink-50)' : (isP1 ? 'var(--critical-50)' : 'white'),
        border:'1px solid ' + (hover ? 'var(--border-strong)' : (isP1 ? 'var(--critical-100)' : 'var(--border)')),
        borderRadius:8, padding: compact ? '10px 14px' : '12px 14px',
        cursor:'pointer', display:'flex', flexDirection:'column', gap:6,
        transition: 'background 120ms, border-color 120ms',
      }}>
      <div style={{display:'flex', alignItems:'center', gap:10}}>
        <span style={{fontFamily:'var(--font-mono)', fontSize:11, color:'var(--fg-muted)', flexShrink:0}}>{ticket.id}</span>
        <PriorityPill priority={ticket.priority}/>
        <StatusBadge status={ticket.status}/>
        <span style={{marginLeft:'auto', fontSize:11, color:'var(--fg-muted)'}}>{ticket.updated}</span>
      </div>
      <div style={{fontSize:14, fontWeight:600, color:'var(--fg)', lineHeight:1.3}}>{ticket.title}</div>
      <div style={{display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--fg-muted)'}}>
        <Avatar person={reporter} size={18}/>
        <span>{reporter?.name || 'Unknown'} • {catLabel}</span>
        {ticket.jira && (
          <span style={{marginLeft:'auto', display:'inline-flex', alignItems:'center', gap:4, fontFamily:'var(--font-mono)', fontSize:11}}>
            <Icon name="link" size={11}/>{ticket.jira}
          </span>
        )}
      </div>
    </div>
  );
}

function ActivityRow({ ticket, onClick, first }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
        borderTop: first ? 'none' : '1px solid var(--ink-100)',
        background: hover ? 'var(--ink-50)' : 'transparent',
        cursor:'pointer',
      }}>
      <StatusBadge status={ticket.status} size="sm"/>
      <span style={{fontFamily:'var(--font-mono)', fontSize:11, color:'var(--fg-muted)', flexShrink:0}}>{ticket.id}</span>
      <span style={{flex:1, fontSize:13, color:'var(--fg)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{ticket.title}</span>
      <span style={{fontSize:11, color:'var(--fg-muted)'}}>{ticket.updated}</span>
    </div>
  );
}

function EmptyState({ children, icon='check-circle' }) {
  return (
    <div style={{
      background:'white', border:'1px dashed var(--border-strong)', borderRadius:8,
      padding:'32px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:8,
    }}>
      <Icon name={icon} size={24} color="var(--ink-300)"/>
      <span style={{fontSize:13, color:'var(--fg-secondary)'}}>{children}</span>
    </div>
  );
}

Object.assign(window, { Home, Stat, TicketRow, ActivityRow, EmptyState, SectionHeader, CategoryListRow, PortalCatalogCard, PortalCatalogSection, PortalCatalogGroup, ReportsHomeBanner, ServiceCatalogCard });
