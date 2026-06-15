// Home — dashboard + portail incidents / services

const PORTAL_GROUP_ACCENT = {
  virtual: '#1660CF',
  pharmacy: '#7C3AED',
  applications: '#0891B2',
  equipment: '#D97706',
  access: '#16A34A',
};

const FEATURED_PORTAL_IDS = ['imprimante', 'kroll', 'avd', 'access'];

function Home({ tickets, openTicket, setCurrentView, role='it', searchQuery='', onSearchChange, onFilterStatus }) {
  const { t, lang } = useI18n();
  const isEnd = role === 'enduser';
  const q = (searchQuery || '').trim();
  const matchSearch = tk => ticketMatchesSearch(tk, q);
  const portalRef = React.useRef(null);
  const heroSearchRef = React.useRef(null);
  const [portalTab, setPortalTab] = React.useState('incidents');
  const [openArticleId, setOpenArticleId] = React.useState(null);
  const [kbRev, setKbRev] = React.useState(0);

  React.useEffect(() => {
    const handler = () => setKbRev(v => v + 1);
    window.addEventListener('pmg-kb-updated', handler);
    return () => window.removeEventListener('pmg-kb-updated', handler);
  }, []);

  const dismissHeroSearch = () => heroSearchRef.current?.close();

  React.useEffect(() => {
    dismissHeroSearch();
  }, [portalTab]);

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
    accent: PORTAL_GROUP_ACCENT[group.id] || 'var(--accent-600)',
    items: group.itemIds.map(id => incidentById[id]).filter(Boolean),
  })).filter(g => g.items.length > 0);

  const serviceCatalog = (window.PMG_DATA.SERVICE_CATALOG || []).map(s => getLocalizedService(s.id, lang));
  const featuredItems = FEATURED_PORTAL_IDS.map(id => incidentById[id]).filter(Boolean);

  const hour = new Date().getHours();
  const greet = hour < 5 ? t('home.greetNight') : hour < 12 ? t('home.greetMorning') : hour < 17 ? t('home.greetAfternoon') : t('home.greetEvening');

  const myActive = mine.filter(tk => isTicketActive(tk.status));
  const resolvedWeek = tickets.filter(tk => normalizeStatus(tk.status) === 'resolved').length;
  const subhead = q
    ? t('home.subSearch', { n: mineVisible.length })
    : isEnd
    ? (myActive.length === 0 ? t('home.subEmptyEnd') : t('home.subOpenEnd', { n: myActive.length }))
    : t('home.subActiveIt', { n: active.length });

  const recentActivity = (q ? tickets.filter(matchSearch) : tickets).slice(0, 5);

  const openIncident = (portalId) => {
    dismissHeroSearch();
    onSearchChange && onSearchChange('');
    const item = window.PMG_DATA.PORTAL_INCIDENT_ITEMS?.find(i => i.id === portalId);
    if (isEnd) setCurrentView('new:' + portalId);
    else setCurrentView('cat:' + (item?.ticketCategory || portalId));
  };

  const openService = (serviceId) => {
    if (!serviceId || !setCurrentView) return;
    dismissHeroSearch();
    onSearchChange && onSearchChange('');
    setCurrentView('service:' + serviceId);
  };

  const scrollToPortal = (tab) => {
    setPortalTab(tab);
    requestAnimationFrame(() => {
      portalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const kpiItems = isEnd
    ? [
        { icon: 'inbox', label: t('home.statMyOpen'), value: myActive.length, tone: 'accent' },
        { icon: 'clock', label: t('home.statWaitingYou'), value: waiting.length, tone: 'warning' },
      ]
    : [
        { icon: 'inbox', label: t('home.statMyOpen'), value: myActive.length, tone: 'accent' },
        { icon: 'clock', label: t('home.statWaitingMe'), value: waiting.length, tone: 'warning' },
        { icon: 'users', label: t('home.statTeamOpen'), value: active.length },
        { icon: 'check-circle', label: t('home.statResolvedWeek'), value: resolvedWeek, tone: 'success' },
      ];

  const myTicketsPanel = (
    <HomePanel
      title={t('home.myTickets')}
      action={mineVisible.length > 4
        ? <a onClick={() => setCurrentView('mine')} style={{ fontSize: 12, color: 'var(--accent-700)', cursor: 'pointer', fontWeight: 500 }}>{t('home.seeAll')}</a>
        : null}
    >
      {mineVisible.slice(0, isEnd ? 4 : 5).map(tk => (
        <HomeTicketCompact key={tk.id} ticket={tk} onClick={() => openTicket(tk.id)}/>
      ))}
      {mineVisible.length === 0 && (
        <div style={{ padding: '20px 18px' }}>
          <EmptyState compact>{q ? t('home.emptySearch') : t('home.emptyPlate')}</EmptyState>
        </div>
      )}
    </HomePanel>
  );

  const portalItems = Object.values(incidentById);
  const kb = window.PMG_KB;
  void kbRev;
  const helpSource = kb?.articles?.length ? kb.articles : (window.PMG_DATA.HELP_ARTICLES || []);
  const helpArticles = helpSource.map(a => getLocalizedHelpArticle(a.id, lang));
  const announcements = kb?.announcements || [];
  const serviceStatus = kb?.serviceStatus || [];
  const ticketPool = isEnd ? mine : tickets;

  return (
    <div className="hd-page hd-home">
      <HomeHero
        greet={greet}
        subhead={subhead}
        isEnd={isEnd}
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        tickets={ticketPool}
        portalItems={portalItems}
        helpArticles={helpArticles}
        featuredItems={featuredItems}
        onOpenIncident={openIncident}
        onOpenTicket={openTicket}
        onOpenArticle={setOpenArticleId}
        onSeeInbox={() => setCurrentView('inbox')}
        onReport={() => scrollToPortal('incidents')}
        onService={() => scrollToPortal('services')}
        onInbox={() => setCurrentView('inbox')}
        onReports={() => setCurrentView('reports')}
        heroSearchRef={heroSearchRef}
      />

      {announcements.length > 0 && (
        <HomeAnnouncementsBanner items={announcements}/>
      )}

      {serviceStatus.length > 0 && (
        <HomeServiceStatusBar items={serviceStatus}/>
      )}

      {openArticleId && (
        <HelpArticleModal
          articleId={openArticleId}
          onClose={() => setOpenArticleId(null)}
          onReport={(portalId) => {
            setOpenArticleId(null);
            if (portalId) openIncident(portalId);
            else scrollToPortal('incidents');
          }}
        />
      )}

      <div className={'hd-home-kpi-grid ' + (isEnd ? 'hd-home-kpi-grid--2' : 'hd-home-kpi-grid--4')}>
        {kpiItems.map(item => (
          <HomeKpiCard key={item.label} {...item}/>
        ))}
      </div>

      {!isEnd && (
        <>
          <LifecycleDashboard tickets={tickets} onFilterStatus={onFilterStatus}/>
        </>
      )}

      <div className={isEnd ? '' : 'hd-home-body'}>
        <div className={isEnd ? '' : 'hd-home-main'} style={isEnd ? { display: 'flex', flexDirection: 'column', gap: 20 } : undefined}>
          {featuredItems.length > 0 && (
            <HomeQuickAccess
              items={featuredItems}
              onSelect={openIncident}
              showBadge={!isEnd}
            />
          )}

          <section ref={portalRef} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} aria-label={t('home.portalTitle')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--fg)', letterSpacing: '-0.01em' }}>{t('home.portalTitle')}</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--fg-muted)' }}>{t('home.portalBrowse')}</p>
              </div>
              <HomePortalTabs active={portalTab} onChange={setPortalTab}/>
            </div>

            {portalTab === 'incidents' ? (
              <PortalCatalogSection
                title={t('home.incidentsSupport')}
                hint={t('home.incidentsHint')}
                icon="alert"
                embedded
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
                        accent={group.accent}
                        onActivate={() => openIncident(c.id)}
                      />
                    ))}
                  </PortalCatalogGroup>
                ))}
              </PortalCatalogSection>
            ) : (
              <PortalCatalogSection
                title={t('home.servicesIt')}
                hint={t('home.servicesHint')}
                icon="clipboard"
                embedded
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 12,
                  alignItems: 'stretch',
                }}>
                  {serviceCatalog.map(s => (
                    <PortalCatalogCard
                      key={s.id}
                      data-service-id={s.id}
                      icon={s.icon}
                      title={s.label}
                      description={s.description || s.short}
                      actionLabel={t('home.requestService')}
                      accent="#1660CF"
                      onClick={() => openService(s.id)}
                    />
                  ))}
                </div>
              </PortalCatalogSection>
            )}
          </section>

          {isEnd && myTicketsPanel}
        </div>

        {!isEnd && (
          <aside className="hd-home-aside">
            <ReportsHomeBanner onOpen={() => setCurrentView('reports')} compact/>
            {myTicketsPanel}
            <HomePanel title={t('home.recentActivity')}>
              {recentActivity.map((tk, i) => (
                <ActivityRow key={tk.id} ticket={tk} onClick={() => openTicket(tk.id)} first={i === 0}/>
              ))}
              {recentActivity.length === 0 && q && (
                <div style={{ padding: '16px 18px', fontSize: 13, color: 'var(--fg-muted)', textAlign: 'center' }}>{t('home.noActivitySearch')}</div>
              )}
            </HomePanel>
          </aside>
        )}
      </div>
    </div>
  );
}

function HomeAnnouncementsBanner({ items }) {
  const { t } = useI18n();
  const [dismissed, setDismissed] = React.useState(() => new Set());
  const visible = items.filter(a => !dismissed.has(a.id));
  if (!visible.length) return null;

  return (
    <section className="hd-home-announcements" aria-label={t('home.announcements')}>
      {visible.map(item => (
        <div key={item.id} className={'hd-home-announcement hd-home-announcement--' + (item.severity || 'info')}>
          <div className="hd-home-announcement-icon">
            <Icon name={item.severity === 'warning' ? 'alert-triangle' : 'info'} size={16}/>
          </div>
          <div className="hd-home-announcement-body">
            <strong>{item.title}</strong>
            <span>{item.body}</span>
          </div>
          <button
            type="button"
            className="hd-home-announcement-dismiss"
            aria-label={t('home.articleModalClose')}
            onClick={() => setDismissed(prev => new Set([...prev, item.id]))}
          >
            <Icon name="x" size={14}/>
          </button>
        </div>
      ))}
    </section>
  );
}

const SERVICE_STATUS_TONE = {
  operational: 'ok',
  degraded: 'warn',
  outage: 'error',
  maintenance: 'info',
};

function HomeServiceStatusBar({ items }) {
  const { t } = useI18n();
  const allOk = items.every(s => s.status === 'operational');

  return (
    <section className="hd-home-service-status" aria-label={t('home.serviceStatus')}>
      <div className="hd-home-service-status-head">
        <Icon name="activity" size={15} color="var(--fg-muted)"/>
        <span>{t('home.serviceStatus')}</span>
        {allOk && <span className="hd-home-service-status-ok">{t('home.serviceStatusAllOk')}</span>}
      </div>
      <div className="hd-home-service-status-grid">
        {items.map(item => (
          <div
            key={item.id}
            className={'hd-home-service-status-item hd-home-service-status-item--' + (SERVICE_STATUS_TONE[item.status] || 'info')}
            title={item.message}
          >
            <Icon name={item.icon || 'circle'} size={14}/>
            <span className="hd-home-service-status-label">{item.label}</span>
            <span className="hd-home-service-status-dot" aria-hidden="true"/>
            <span className="hd-home-service-status-msg">{item.message}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function portalItemMatchesQuery(item, query, lang) {
  const q = (query || '').trim().toLowerCase();
  if (!q || !item) return false;
  const haystack = [item.id, item.label, item.hint].filter(Boolean).join(' ').toLowerCase();
  return haystack.includes(q);
}

function HomeHero({
  greet, subhead, isEnd, searchQuery, onSearchChange, tickets, portalItems, helpArticles,
  featuredItems, onOpenIncident, onOpenTicket, onOpenArticle, onSeeInbox,
  onReport, onService, onInbox, onReports, heroSearchRef,
}) {
  const { t } = useI18n();
  return (
    <section className="hd-home-hero">
      <div className="hd-home-hero-inner">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 560 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.72)',
            }}>{t('home.heroEyebrow')}</span>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.15 }}>
              {greet}, {t('home.greetYou')}
            </h1>
            <p style={{ margin: 0, fontSize: 15, color: 'rgba(255,255,255,0.88)', lineHeight: 1.5 }}>
              {(searchQuery || '').trim() ? subhead : t('home.heroSearchPrompt')}
            </p>
          </div>
          <span style={{
            fontSize: 12, fontWeight: 500, padding: '6px 12px', borderRadius: 999,
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
            color: 'rgba(255,255,255,0.92)', whiteSpace: 'nowrap', flexShrink: 0,
          }}>
            <Icon name="clock" size={13} color="rgba(255,255,255,0.92)"/>
            {' '}{t('home.supportHours')}
          </span>
        </div>

        <HomeHeroSearch
          ref={heroSearchRef}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          tickets={tickets}
          portalItems={portalItems}
          helpArticles={helpArticles}
          featuredItems={featuredItems}
          isEnd={isEnd}
          onOpenIncident={onOpenIncident}
          onOpenTicket={onOpenTicket}
          onOpenArticle={onOpenArticle}
          onSeeInbox={onSeeInbox}
        />

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button type="button" onClick={onReport} style={{
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600, padding: '10px 18px', borderRadius: 8,
            border: 'none', cursor: 'pointer', background: 'white', color: 'var(--accent-700)',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
          }}>
            <Icon name="alert" size={16} color="var(--accent-700)"/>
            {t('home.heroCtaIncident')}
          </button>
          <button type="button" onClick={onService} style={{
            fontFamily: 'inherit', fontSize: 13, fontWeight: 600, padding: '10px 18px', borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.35)', cursor: 'pointer',
            background: 'rgba(255,255,255,0.1)', color: 'white',
            display: 'inline-flex', alignItems: 'center', gap: 8,
          }}>
            <Icon name="clipboard" size={16} color="white"/>
            {t('home.heroCtaService')}
          </button>
          {!isEnd && (
            <>
              <button type="button" onClick={onInbox} style={{
                fontFamily: 'inherit', fontSize: 13, fontWeight: 600, padding: '10px 18px', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.35)', cursor: 'pointer',
                background: 'transparent', color: 'rgba(255,255,255,0.92)',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                <Icon name="inbox" size={16} color="rgba(255,255,255,0.92)"/>
                {t('home.heroCtaInbox')}
              </button>
              <button type="button" onClick={onReports} style={{
                fontFamily: 'inherit', fontSize: 13, fontWeight: 600, padding: '10px 18px', borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.35)', cursor: 'pointer',
                background: 'transparent', color: 'rgba(255,255,255,0.92)',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                <Icon name="clipboard" size={16} color="rgba(255,255,255,0.92)"/>
                {t('home.heroCtaReports')}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

const HomeHeroSearch = React.forwardRef(function HomeHeroSearch({
  searchQuery, onSearchChange, tickets, portalItems, helpArticles, featuredItems, isEnd,
  onOpenIncident, onOpenTicket, onOpenArticle, onSeeInbox,
}, ref) {
  const { t, lang } = useI18n();
  const [focused, setFocused] = React.useState(false);
  const wrapRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const q = (searchQuery || '').trim();
  const showDropdown = focused;

  const close = React.useCallback(() => {
    setFocused(false);
  }, []);

  React.useImperativeHandle(ref, () => ({ close }), [close]);

  React.useEffect(() => {
    if (!focused) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    const onScroll = (e) => {
      const el = e.target;
      if (wrapRef.current && (wrapRef.current === el || wrapRef.current.contains(el))) return;
      close();
    };
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [close, focused]);

  const portalMatches = q
    ? portalItems.filter(item => portalItemMatchesQuery(item, q, lang)).slice(0, 4)
    : [];
  const articleMatches = q
    ? helpArticles.filter(a => helpArticleMatchesSearch(a.id, q, lang)).slice(0, 4)
    : helpArticles.filter(a => a.popular).slice(0, 3);
  const ticketMatches = q
    ? tickets.filter(tk => ticketMatchesSearch(tk, q)).slice(0, 5)
    : [];

  const hasQuery = q.length > 0;
  const hasResults = portalMatches.length + articleMatches.length + ticketMatches.length > 0;

  const pickPortal = (id) => {
    close();
    onSearchChange && onSearchChange('');
    onOpenIncident(id);
  };

  const pickArticle = (id) => {
    close();
    onSearchChange && onSearchChange('');
    onOpenArticle(id);
  };

  const pickTicket = (id) => {
    close();
    onSearchChange && onSearchChange('');
    onOpenTicket(id);
  };

  return (
    <div className="hd-hero-search" ref={wrapRef}>
      <div className={'hd-hero-search-row' + (focused ? ' is-focused' : '')}>
        <Icon name="search" size={18} color="var(--fg-muted)"/>
        <input
          ref={inputRef}
          type="search"
          className="hd-hero-search-input"
          value={searchQuery || ''}
          placeholder={t('home.searchPlaceholder')}
          aria-label={t('home.searchPlaceholder')}
          aria-expanded={showDropdown}
          aria-haspopup="listbox"
          onChange={e => onSearchChange && onSearchChange(e.target.value)}
          onFocus={() => setFocused(true)}
        />
        {(searchQuery || '').length > 0 && (
          <button type="button" onClick={() => onSearchChange && onSearchChange('')}
            aria-label={t('topbar.clearSearch')}
            style={{ background: 'transparent', border: 0, padding: 4, cursor: 'pointer', display: 'flex' }}>
            <Icon name="x" size={16} color="var(--fg-muted)"/>
          </button>
        )}
        <button type="button" className="hd-hero-search-btn" onClick={() => inputRef.current?.focus()}>
          <Icon name="search" size={14} color="white"/>
          {t('home.searchButton')}
        </button>
      </div>

      {!showDropdown && !hasQuery && featuredItems.length > 0 && (
        <div className="hd-hero-search-chips">
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)', fontWeight: 500 }}>{t('home.searchSuggestions')}</span>
          {featuredItems.map(item => (
            <button key={item.id} type="button" className="hd-hero-search-chip"
              onClick={() => pickPortal(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
      )}

      {showDropdown && (
        <div className="hd-hero-search-dropdown" role="listbox">
          {hasQuery && !hasResults && (
            <div className="hd-hero-search-empty">{t('home.searchNoResults')}</div>
          )}

          {hasQuery && portalMatches.length > 0 && (
            <>
              <div className="hd-hero-search-section-label">{t('home.searchSectionActions')}</div>
              {portalMatches.map(item => (
                <div key={item.id} className="hd-hero-search-item" role="option"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => pickPortal(item.id)}>
                  <span style={{
                    width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                    background: 'var(--accent-50)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={item.icon} size={16} color="var(--accent-700)"/>
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--fg-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.hint}</div>
                  </div>
                  <Icon name="chevron-right" size={14} color="var(--fg-muted)"/>
                </div>
              ))}
            </>
          )}

          {articleMatches.length > 0 && (
            <>
              <div className="hd-hero-search-section-label">
                {hasQuery ? t('home.searchSectionArticles') : t('home.searchFeaturedArticles')}
              </div>
              {articleMatches.map(art => (
                <div key={art.id} className="hd-hero-search-item" role="option"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => pickArticle(art.id)}>
                  <span style={{
                    width: 32, height: 32, borderRadius: 7, flexShrink: 0,
                    background: 'var(--ink-50)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon name={art.icon} size={16} color="var(--fg-secondary)"/>
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{art.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--fg-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{art.excerpt}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent-700)', flexShrink: 0 }}>{t('home.viewArticle')}</span>
                </div>
              ))}
            </>
          )}

          {hasQuery && ticketMatches.length > 0 && (
            <>
              <div className="hd-hero-search-section-label">{t('home.searchSectionTickets')}</div>
              {ticketMatches.map(tk => (
                <div key={tk.id} className="hd-hero-search-item" role="option"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => pickTicket(tk.id)}>
                  <StatusBadge status={tk.status} size="sm"/>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)', flexShrink: 0 }}>{tk.id}</span>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tk.title}</span>
                  <PriorityPill priority={tk.priority}/>
                </div>
              ))}
              {!isEnd && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid var(--ink-100)', textAlign: 'center' }}>
                  <button type="button" onMouseDown={e => e.preventDefault()} onClick={() => { setFocused(false); onSeeInbox(); }}
                    style={{ background: 'transparent', border: 0, color: 'var(--accent-700)', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {t('home.seeAllInbox')}
                  </button>
                </div>
              )}
            </>
          )}

          {!hasQuery && portalMatches.length === 0 && ticketMatches.length === 0 && articleMatches.length === 0 && (
            <div className="hd-hero-search-empty">{t('home.searchNoResults')}</div>
          )}
        </div>
      )}
    </div>
  );
});

function HelpArticleModal({ articleId, onClose, onReport }) {
  const { t, lang } = useI18n();
  const art = getLocalizedHelpArticle(articleId, lang);
  const paragraphs = (art.body || '').split('\n').filter(Boolean);

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(11,13,16,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white', borderRadius: 14, maxWidth: 520, width: '100%',
          boxShadow: '0 24px 64px rgba(11,13,16,0.2)', overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <span style={{
            width: 44, height: 44, borderRadius: 10, flexShrink: 0,
            background: 'var(--accent-50)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={art.icon} size={22} color="var(--accent-700)"/>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-muted)', marginBottom: 4 }}>
              {t('home.searchSectionArticles')}
            </div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--fg)', lineHeight: 1.3 }}>{art.title}</h2>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--fg-secondary)', lineHeight: 1.45 }}>{art.excerpt}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('home.articleModalClose')}
            style={{ background: 'transparent', border: 0, cursor: 'pointer', padding: 4 }}>
            <Icon name="x" size={18} color="var(--fg-muted)"/>
          </button>
        </div>
        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
          {paragraphs.map((p, i) => (
            <p key={i} style={{ margin: 0, fontSize: 14, color: 'var(--fg)', lineHeight: 1.55 }}>{p}</p>
          ))}
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', background: 'var(--ink-50)' }}>
          <Button variant="secondary" size="md" onClick={onClose}>{t('home.articleModalClose')}</Button>
          <Button variant="primary" size="md" onClick={() => onReport(art.portalId)}>
            <Icon name="alert" size={14} color="white"/>
            {t('home.articleModalReport')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function HomeKpiCard({ icon, label, value, tone }) {
  const toneStyles = {
    accent: { iconBg: 'var(--accent-50)', iconFg: 'var(--accent-700)', value: 'var(--accent-700)' },
    warning: { iconBg: 'var(--warning-50)', iconFg: 'var(--warning-700)', value: 'var(--warning-700)' },
    success: { iconBg: 'var(--success-50)', iconFg: 'var(--success-700)', value: 'var(--success-700)' },
    default: { iconBg: 'var(--ink-50)', iconFg: 'var(--fg-secondary)', value: 'var(--fg)' },
  };
  const s = toneStyles[tone] || toneStyles.default;
  return (
    <div style={{
      background: 'white', border: '1px solid var(--border)', borderRadius: 10,
      padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
      boxShadow: '0 1px 2px rgba(11,13,16,0.03)',
    }}>
      <span style={{
        width: 40, height: 40, borderRadius: 9, flexShrink: 0,
        background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={18} color={s.iconFg}/>
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 11, color: 'var(--fg-muted)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: s.value, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
      </div>
    </div>
  );
}

function HomeQuickAccess({ items, onSelect, showBadge }) {
  const { t } = useI18n();
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <h2 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--fg-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {t('home.quickAccess')}
      </h2>
      <div className="hd-home-quick-grid">
        {items.map(item => (
          <HomeQuickTile
            key={item.id}
            icon={item.icon}
            label={item.label}
            badge={showBadge && item.count > 0 ? item.count : null}
            onClick={() => onSelect(item.id)}
          />
        ))}
      </div>
    </section>
  );
}

function HomeQuickTile({ icon, label, badge, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: 'inherit', textAlign: 'left', cursor: 'pointer',
        background: hover ? 'var(--accent-50)' : 'white',
        border: '1px solid ' + (hover ? 'var(--accent-300)' : 'var(--border)'),
        borderRadius: 10, padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        transition: 'background 120ms, border-color 120ms, box-shadow 120ms',
        boxShadow: hover ? '0 4px 14px rgba(22,96,207,0.08)' : '0 1px 2px rgba(11,13,16,0.03)',
      }}>
      <span style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: 'var(--accent-50)', border: '1px solid var(--accent-100)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={18} color="var(--accent-700)"/>
      </span>
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--fg)', lineHeight: 1.25 }}>{label}</span>
      {badge != null && (
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
          padding: '2px 7px', borderRadius: 999, background: 'var(--ink-100)', color: 'var(--fg)',
        }}>{badge}</span>
      )}
    </button>
  );
}

function HomePortalTabs({ active, onChange }) {
  const { t } = useI18n();
  const tabs = [
    { id: 'incidents', label: t('home.tabIncidents'), icon: 'alert' },
    { id: 'services', label: t('home.tabServices'), icon: 'clipboard' },
  ];
  return (
    <div className="hd-home-tabs" role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={'hd-home-tab' + (active === tab.id ? ' is-active' : '')}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function HomePanel({ title, action, children }) {
  return (
    <div className="hd-home-panel">
      <div className="hd-home-panel-header">
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{title}</h3>
        {action}
      </div>
      <div className="hd-home-panel-body">{children}</div>
    </div>
  );
}

function HomeTicketCompact({ ticket, onClick }) {
  const [hover, setHover] = React.useState(false);
  const isP1 = ticket.priority === 'P1';
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 18px',
        cursor: 'pointer', background: hover ? 'var(--ink-50)' : (isP1 ? 'var(--critical-50)' : 'transparent'),
        borderBottom: '1px solid var(--ink-100)',
        transition: 'background 120ms',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-muted)' }}>{ticket.id}</span>
        <PriorityPill priority={ticket.priority}/>
        <StatusBadge status={ticket.status} size="sm"/>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--fg-muted)' }}>{ticket.updated}</span>
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {ticket.title}
      </div>
    </div>
  );
}

function ReportsHomeBanner({ onOpen, compact }) {
  const { t } = useI18n();
  const [hover, setHover] = React.useState(false);
  return (
    <button type="button" onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: 'inherit', textAlign: 'left', width: '100%',
        padding: compact ? '14px 16px' : '16px 18px', borderRadius: 10, cursor: 'pointer',
        border: '1px solid ' + (hover ? 'var(--accent-300)' : 'var(--accent-100)'),
        background: hover ? 'var(--accent-50)' : 'linear-gradient(135deg, white 0%, var(--accent-50) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        transition: 'border-color 140ms, background 140ms',
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <span style={{
          width: compact ? 36 : 44, height: compact ? 36 : 44, borderRadius: 9, flexShrink: 0,
          background: 'var(--accent-600)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="clipboard" size={compact ? 18 : 22} color="white"/>
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: compact ? 13 : 14, fontWeight: 600, color: 'var(--fg)' }}>{t('home.reportsBannerTitle')}</div>
          <div style={{ fontSize: 11, color: 'var(--fg-secondary)', marginTop: 2, lineHeight: 1.4 }}>{t('home.reportsBannerHint')}</div>
        </div>
      </div>
      <Icon name="chevron-right" size={16} color="var(--accent-700)"/>
    </button>
  );
}

function PortalCatalogSection({ title, hint, icon, separated, embedded, children }) {
  if (embedded) {
    return (
      <div style={{
        background: 'white', border: '1px solid var(--border)', borderRadius: 12,
        padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 18,
        boxShadow: '0 1px 2px rgba(11,13,16,0.03)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <span style={{
            width: 36, height: 36, borderRadius: 8, flexShrink: 0,
            background: 'var(--accent-50)', border: '1px solid var(--accent-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={icon} size={18} color="var(--accent-700)"/>
          </span>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--fg)' }}>{title}</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--fg-muted)', lineHeight: 1.45 }}>{hint}</p>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>{children}</div>
      </div>
    );
  }
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>{children}</div>
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

const PORTAL_CARD_MIN_HEIGHT = 148;

function PortalCatalogCard({ icon, title, description, actionLabel, badge, accent, onClick, onActivate, 'data-service-id': dataServiceId }) {
  const [hover, setHover] = React.useState(false);
  const accentColor = accent || 'var(--accent-600)';
  const activate = onActivate || onClick;

  return (
    <div
      role="button"
      tabIndex={activate ? 0 : -1}
      data-service-id={dataServiceId || undefined}
      onClick={activate || undefined}
      onKeyDown={activate ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activate(e);
        }
      } : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textAlign: 'left',
        width: '100%',
        background: 'white',
        border: '1px solid ' + (hover ? 'var(--border-strong)' : 'var(--border)'),
        borderLeft: '3px solid ' + accentColor,
        borderRadius: 10,
        padding: '16px 18px',
        cursor: activate ? 'pointer' : 'default',
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
          background: accentColor + '14',
          border: '1px solid ' + accentColor + '28',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={icon} size={20} color={accentColor}/>
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
        fontSize: 12, fontWeight: 600, color: accentColor,
        display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 'auto',
      }}>
        {actionLabel}
        <Icon name="chevron-right" size={14} color={accentColor}/>
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
        display:'flex', alignItems:'center', gap:12, padding:'10px 18px',
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

function EmptyState({ children, icon='check-circle', compact }) {
  return (
    <div style={{
      background: compact ? 'transparent' : 'white',
      border: compact ? 'none' : '1px dashed var(--border-strong)',
      borderRadius: 8,
      padding: compact ? '8px 0' : '32px 16px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
    }}>
      <Icon name={icon} size={compact ? 20 : 24} color="var(--ink-300)"/>
      <span style={{ fontSize: 13, color: 'var(--fg-secondary)', textAlign: 'center' }}>{children}</span>
    </div>
  );
}

Object.assign(window, {
  Home, Stat, TicketRow, ActivityRow, EmptyState, SectionHeader, CategoryListRow,
  PortalCatalogCard, PortalCatalogSection, PortalCatalogGroup, ReportsHomeBanner, ServiceCatalogCard,
  HomeHero, HomeHeroSearch, HelpArticleModal, HomeKpiCard, HomeQuickAccess, HomePanel,
  HomeAnnouncementsBanner, HomeServiceStatusBar,
});
