// Inbox — full ticket list

function Inbox({ tickets, openTicket, scope='all', role='it', searchQuery='', onSearchChange, compact=false, onCompactChange }) {
  const { t, lang } = useI18n();
  const isEnd = role === 'enduser';
  const [filterStatus, setFilterStatus] = React.useState('all');

  React.useEffect(() => {
    try {
      const saved = sessionStorage.getItem('pmg-inbox-status');
      if (saved) {
        setFilterStatus(saved);
        sessionStorage.removeItem('pmg-inbox-status');
      }
    } catch (e) {}
  }, []);
  const [filterCat, setFilterCat] = React.useState('all');
  const [sortCol, setSortCol] = React.useState('updated');
  const [sortDir, setSortDir] = React.useState('desc');
  const q = (searchQuery || '').trim();

  let filtered = tickets;
  if (isEnd) filtered = filtered.filter(t => t.reporter === 'me');
  else if (scope === 'mine') filtered = filtered.filter(t => t.reporter === 'me' || t.assignee === 'me');
  else if (scope === 'wait') filtered = filtered.filter(t => {
    const s = normalizeStatus(t.status);
    return (s === 'waiting_info' || s === 'waiting') && t.reporter === 'me';
  });
  else if (scope.startsWith('cat:')) filtered = filtered.filter(t => t.category === scope.slice(4));

  if (filterStatus !== 'all') filtered = filtered.filter(t => t.status === filterStatus);
  if (filterCat !== 'all') filtered = filtered.filter(t => t.category === filterCat);
  if (q) filtered = filtered.filter(t => ticketMatchesSearch(t, q));

  const sorted = sortTickets(filtered, sortCol, sortDir);

  const title = isEnd && scope === 'wait' ? t('inbox.waitingOnYou')
    : scope === 'mine' ? t('inbox.myTickets')
    : scope === 'wait' ? t('inbox.waitingOnMe')
    : scope.startsWith('cat:') ? getLocalizedCategory(scope.slice(4), lang).label
    : t('inbox.allTickets');

  const statusOptions = [
    ['all', t('inbox.statusAll')],
    ['new', t('status.filterNew')],
    ['inprog', t('status.filterInprog')],
    ['waiting_info', t('status.filterWaitingInfo')],
    ['waiting_vendor', t('status.filterWaitingVendor')],
    ['waiting', t('status.filterWaiting')],
    ['resolved', t('status.filterResolved')],
    ['closed', t('status.filterClosed')],
  ];
  const catOptions = [
    ['all', t('inbox.catAll')],
    ...window.PMG_DATA.CATEGORIES.map(c => [c.id, getLocalizedCategory(c.id, lang).label]),
  ];

  const cols = isEnd ? '88px 80px 1fr 130px 110px' : '88px 80px 1fr 140px 130px 110px';
  const headerPad = compact ? '8px 12px' : '10px 16px';
  const rowPad = compact ? '8px 12px' : '12px 16px';

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else {
      setSortCol(col);
      setSortDir(col === 'id' || col === 'title' || col === 'assignee' ? 'asc' : 'desc');
    }
  };

  return (
    <div className="hd-page" style={{display:'flex', flexDirection:'column', gap:16}}>
      {q && (
        <SearchBanner query={q} count={sorted.length} onClear={() => onSearchChange && onSearchChange('')}/>
      )}

      <header style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
        <div style={{display:'flex', flexDirection:'column', gap:2}}>
          <h1 style={{margin:0, fontSize:24, fontWeight:700, letterSpacing:'-0.02em'}}>{title}</h1>
          <p style={{margin:0, fontSize:13, color:'var(--fg-secondary)'}}>
            {t('inbox.ticketCount', { n: sorted.length })}
            {(filterStatus !== 'all' || filterCat !== 'all' || q) ? t('inbox.filtered') : ''}
          </p>
        </div>
        <div style={{display:'flex', gap:8}}>
          {!isEnd && onCompactChange && (
            <Button variant={compact ? 'primary' : 'secondary'} size="md"
              onClick={() => onCompactChange(!compact)}
              title={t('inbox.compactTitle')}>
              <Icon name="list" size={13} color={compact ? 'white' : undefined}/>
              {compact ? t('inbox.compact') : t('inbox.comfort')}
            </Button>
          )}
          <Button variant="secondary" size="md"><Icon name="filter" size={13}/>{t('inbox.filter')}</Button>
          {!isEnd && <Button variant="secondary" size="md"><Icon name="arrow-up-right" size={13}/>{t('inbox.export')}</Button>}
        </div>
      </header>

      {/* Filter bar */}
      <div style={{
        display:'flex', alignItems:'center', gap:8, padding:'10px 14px', flexWrap:'wrap',
        background:'white', border:'1px solid var(--border)', borderRadius:8,
      }}>
        <FilterChip label={t('inbox.colStatus')} value={filterStatus} options={statusOptions} onChange={setFilterStatus}/>
        <FilterChip label={t('inbox.category')} value={filterCat} options={catOptions} onChange={setFilterCat}/>
        <span style={{marginLeft:'auto', fontSize:11, color:'var(--fg-muted)'}}>
          {t('inbox.sortHint')}
        </span>
      </div>

      {/* Table */}
      <div className="hd-surface" style={{overflow:'auto', maxHeight: compact ? 'calc(100vh - 220px)' : undefined}}>
        <div style={{
          display:'grid', gridTemplateColumns: cols, minWidth: 640,
          padding: headerPad, borderBottom:'1px solid var(--border-strong)',
          fontSize: compact ? 10 : 11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase',
          color:'var(--fg-muted)', background:'var(--ink-50)', position:'sticky', top:0, zIndex:2,
        }}>
          <SortHeader label={t('inbox.colId')} col="id" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort}/>
          <SortHeader label={t('inbox.colPriority')} col="priority" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort}/>
          <SortHeader label={t('inbox.colTitle')} col="title" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort}/>
          {!isEnd && <SortHeader label={t('inbox.colAssignee')} col="assignee" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort}/>}
          <SortHeader label={t('inbox.colStatus')} col="status" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort}/>
          <SortHeader label={t('inbox.colUpdated')} col="updated" sortCol={sortCol} sortDir={sortDir} onSort={toggleSort} align="right"/>
        </div>
        {sorted.length === 0 && (
          <div style={{padding:48, textAlign:'center', color:'var(--fg-muted)', fontSize:13}}>
            {q ? t('inbox.noSearchMatch') : t('inbox.noMatch')}
          </div>
        )}
        {sorted.map((tk, i) => (
          <Row key={tk.id} ticket={tk} first={i===0} onClick={()=>openTicket(tk.id)} hideAssignee={isEnd}
            compact={compact} cols={cols} rowPad={rowPad}/>
        ))}
      </div>
    </div>
  );
}

function SortHeader({ label, col, sortCol, sortDir, onSort, align }) {
  const active = sortCol === col;
  const [hover, setHover] = React.useState(false);
  return (
    <button type="button" onClick={() => onSort(col)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display:'inline-flex', alignItems:'center', gap:4,
        background:'transparent', border:0, padding:0, margin:0,
        font: 'inherit', textTransform:'inherit', letterSpacing:'inherit',
        color: active ? 'var(--accent-700)' : (hover ? 'var(--fg)' : 'inherit'),
        cursor:'pointer', justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
        width: '100%',
      }}>
      {label}
      {active && (
        <span style={{display:'inline-flex', transform: sortDir === 'asc' ? 'rotate(180deg)' : 'none'}}>
          <Icon name="chevron-down" size={12}/>
        </span>
      )}
    </button>
  );
}

function FilterChip({ label, value, options, onChange }) {
  return (
    <div style={{position:'relative', display:'inline-flex'}}>
      <select
        value={value} onChange={e=>onChange(e.target.value)}
        style={{
          appearance:'none', fontFamily:'inherit', fontSize:12, fontWeight:500,
          padding:'5px 24px 5px 10px',
          borderRadius:6, border:'1px solid var(--border)',
          background:'white', color:'var(--fg)', cursor:'pointer',
          backgroundImage:`linear-gradient(45deg, transparent 50%, var(--fg-secondary) 50%), linear-gradient(135deg, var(--fg-secondary) 50%, transparent 50%)`,
          backgroundPosition: 'calc(100% - 11px) 11px, calc(100% - 7px) 11px',
          backgroundSize:'4px 4px', backgroundRepeat:'no-repeat',
        }}>
        {options.map(([v, lbl]) => <option key={v} value={v}>{label ? `${label}: ${lbl}` : lbl}</option>)}
      </select>
    </div>
  );
}

function Row({ ticket, first, onClick, hideAssignee=false, compact=false, cols, rowPad }) {
  const { t } = useI18n();
  const [hover, setHover] = React.useState(false);
  const assignee = window.PMG_DATA.PEOPLE.find(p => p.id === ticket.assignee);
  const isP1 = ticket.priority === 'P1';
  const fontSize = compact ? 12 : 13;
  return (
    <div onClick={onClick} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        display:'grid', gridTemplateColumns: cols, minWidth: 640,
        padding: rowPad,
        borderTop: first ? 'none' : '1px solid var(--ink-100)',
        background: hover ? 'var(--ink-50)' : (isP1 ? 'var(--critical-50)' : 'white'),
        cursor:'pointer', alignItems:'center', fontSize, color:'var(--fg)',
        transition: 'background 120ms',
      }}>
      <div style={{fontFamily:'var(--font-mono)', fontSize: compact ? 11 : 12, color:'var(--fg-secondary)'}}>{ticket.id}</div>
      <div><PriorityPill priority={ticket.priority}/></div>
      <div style={{fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', paddingRight:12}}>{ticket.title}</div>
      {!hideAssignee && (
        <div style={{display:'flex', alignItems:'center', gap: compact ? 6 : 8}}>
          {assignee ? (
            <>
              <Avatar person={assignee} size={compact ? 18 : 20}/>
              <span style={{fontSize: compact ? 11 : 12, color:'var(--fg-secondary)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{assignee.name.split(' ')[0]}</span>
            </>
          ) : (
            <span style={{fontSize: compact ? 11 : 12, color:'var(--fg-muted)', fontStyle:'italic'}}>{t('inbox.unassigned')}</span>
          )}
        </div>
      )}
      <div><StatusBadge status={ticket.status}/></div>
      <div style={{fontSize: compact ? 11 : 12, color:'var(--fg-muted)', textAlign:'right'}}>{ticket.updated}</div>
    </div>
  );
}

Object.assign(window, { Inbox, SortHeader });
