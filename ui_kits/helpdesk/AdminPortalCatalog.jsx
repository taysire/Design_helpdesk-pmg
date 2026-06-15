// AdminPortalCatalog — gestion du catalogue portail (Phase 7 admin UI)

function AdminPortalCatalog({ apiOnline, onCatalogChanged, showToast }) {
  const { t } = useI18n();
  const [tab, setTab] = React.useState('incidents');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [incidents, setIncidents] = React.useState([]);
  const [groups, setGroups] = React.useState([]);
  const [services, setServices] = React.useState([]);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState(null);

  const loadAll = React.useCallback(async () => {
    if (!apiOnline) return;
    setLoading(true);
    setError(null);
    try {
      const [inc, grp, svc] = await Promise.all([
        fetchAdminIncidents(),
        fetchAdminGroups(),
        fetchAdminServices(),
      ]);
      setIncidents(inc);
      setGroups(grp);
      setServices(svc);
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [apiOnline]);

  React.useEffect(() => { loadAll(); }, [loadAll]);

  const notifySaved = async () => {
    showToast && showToast('success', t('admin.savedTitle'), t('admin.savedBody'));
    await loadAll();
    if (onCatalogChanged) await onCatalogChanged();
  };

  const handleError = (e) => {
    const msg = e.message || String(e);
    setError(msg);
    showToast && showToast('info', t('admin.errorTitle'), msg);
  };

  const tabs = [
    { id: 'incidents', label: t('admin.tabIncidents'), icon: 'alert' },
    { id: 'groups', label: t('admin.tabGroups'), icon: 'list' },
    { id: 'services', label: t('admin.tabServices'), icon: 'clipboard' },
  ];

  return (
    <div className="hd-page" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>{t('admin.title')}</h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-secondary)', maxWidth: 640, lineHeight: 1.5 }}>
            {t('admin.subtitle')}
          </p>
        </div>
        <Button variant="secondary" size="md" onClick={loadAll} disabled={loading || !apiOnline}>
          <Icon name="refresh" size={14} color="var(--accent-700)"/>
          {t('admin.refresh')}
        </Button>
      </header>

      {!apiOnline && (
        <div className="hd-surface" style={{ padding: '14px 18px', color: 'var(--fg-secondary)', fontSize: 13 }}>
          {t('admin.offline')}
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px 16px', borderRadius: 8, fontSize: 13,
          background: 'var(--critical-50)', border: '1px solid var(--critical-100)', color: 'var(--critical-700)',
        }}>{error}</div>
      )}

      <div className="hd-home-tabs" role="tablist">
        {tabs.map(item => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={'hd-home-tab' + (tab === item.id ? ' is-active' : '')}
            onClick={() => { setTab(item.id); setEditing(null); setForm(null); }}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'incidents' && (
        <AdminIncidentsPanel
          items={incidents}
          loading={loading}
          editing={editing}
          form={form}
          onStartCreate={() => {
            setEditing('new');
            setForm({
              id: '', icon: 'help', ticketCategory: 'apps', portalFlow: '',
              prefillProblemArea: '', formType: 'dynamic_incident', sortOrder: 0, isActive: true,
            });
          }}
          onStartEdit={(row) => { setEditing(row.id); setForm({ ...row }); }}
          onCancel={() => { setEditing(null); setForm(null); }}
          onChange={setForm}
          onSave={async () => {
            try {
              if (editing === 'new') await createAdminIncident(form);
              else await updateAdminIncident(editing, form);
              setEditing(null); setForm(null);
              await notifySaved();
            } catch (e) { handleError(e); }
          }}
          onDelete={async (id) => {
            if (!window.confirm(t('admin.confirmDelete'))) return;
            try {
              await deleteAdminIncident(id);
              if (editing === id) { setEditing(null); setForm(null); }
              await notifySaved();
            } catch (e) { handleError(e); }
          }}
        />
      )}

      {tab === 'groups' && (
        <AdminGroupsPanel
          items={groups}
          incidentIds={incidents.map(i => i.id)}
          loading={loading}
          editing={editing}
          form={form}
          onStartCreate={() => {
            setEditing('new');
            setForm({ id: '', itemIds: [], sortOrder: 0 });
          }}
          onStartEdit={(row) => { setEditing(row.id); setForm({ ...row }); }}
          onCancel={() => { setEditing(null); setForm(null); }}
          onChange={setForm}
          onSave={async () => {
            try {
              if (editing === 'new') await createAdminGroup(form);
              else await updateAdminGroup(editing, form);
              setEditing(null); setForm(null);
              await notifySaved();
            } catch (e) { handleError(e); }
          }}
          onDelete={async (id) => {
            if (!window.confirm(t('admin.confirmDelete'))) return;
            try {
              await deleteAdminGroup(id);
              if (editing === id) { setEditing(null); setForm(null); }
              await notifySaved();
            } catch (e) { handleError(e); }
          }}
        />
      )}

      {tab === 'services' && (
        <AdminServicesPanel
          items={services}
          loading={loading}
          editing={editing}
          form={form}
          onStartCreate={() => {
            setEditing('new');
            setForm({
              id: '', icon: 'package', requestType: 'service', ticketCategory: 'service',
              formType: 'service_wizard', idPrefix: 'REQ', sortOrder: 0, isActive: true,
            });
          }}
          onStartEdit={(row) => { setEditing(row.id); setForm({ ...row }); }}
          onCancel={() => { setEditing(null); setForm(null); }}
          onChange={setForm}
          onSave={async () => {
            try {
              if (editing === 'new') await createAdminService(form);
              else await updateAdminService(editing, form);
              setEditing(null); setForm(null);
              await notifySaved();
            } catch (e) { handleError(e); }
          }}
          onDelete={async (id) => {
            if (!window.confirm(t('admin.confirmDelete'))) return;
            try {
              await deleteAdminService(id);
              if (editing === id) { setEditing(null); setForm(null); }
              await notifySaved();
            } catch (e) { handleError(e); }
          }}
        />
      )}
    </div>
  );
}

function AdminPanelShell({ title, hint, onAdd, children }) {
  const { t } = useI18n();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{title}</h2>
          {hint && <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--fg-muted)' }}>{hint}</p>}
        </div>
        <Button variant="primary" size="sm" onClick={onAdd}>
          <Icon name="plus" size={14} color="white"/>
          {t('admin.add')}
        </Button>
      </div>
      {children}
    </div>
  );
}

function AdminActiveBadge({ active }) {
  const { t } = useI18n();
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
      background: active ? 'var(--success-50)' : 'var(--ink-100)',
      color: active ? 'var(--success-700)' : 'var(--fg-muted)',
    }}>
      {active ? t('admin.active') : t('admin.inactive')}
    </span>
  );
}

function AdminTable({ columns, rows, onEdit, onDelete, loading }) {
  const { t } = useI18n();
  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>{t('admin.loading')}</div>;
  }
  if (!rows.length) {
    return <div style={{ padding: 24, textAlign: 'center', color: 'var(--fg-muted)', fontSize: 13 }}>{t('admin.empty')}</div>;
  }
  return (
    <div className="hd-surface" style={{ overflow: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--ink-50)', borderBottom: '1px solid var(--border)' }}>
            {columns.map(col => (
              <th key={col.key} style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600, color: 'var(--fg-secondary)', whiteSpace: 'nowrap' }}>
                {col.label}
              </th>
            ))}
            <th style={{ width: 120 }}/>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} style={{ borderBottom: '1px solid var(--ink-100)' }}>
              {columns.map(col => (
                <td key={col.key} style={{ padding: '10px 14px', color: 'var(--fg)', verticalAlign: 'middle' }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
              <td style={{ padding: '8px 14px', whiteSpace: 'nowrap' }}>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(row)}>{t('admin.edit')}</Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(row.id)}>{t('admin.delete')}</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminFormCard({ title, children, onSave, onCancel, saveDisabled }) {
  const { t } = useI18n();
  return (
    <div className="hd-surface" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {children}
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--ink-100)' }}>
        <Button variant="ghost" size="md" onClick={onCancel}>{t('admin.cancel')}</Button>
        <Button variant="primary" size="md" onClick={onSave} disabled={saveDisabled}>{t('admin.save')}</Button>
      </div>
    </div>
  );
}

function AdminField({ label, hint, children }) {
  return (
    <Field label={label} hint={hint}>
      {children}
    </Field>
  );
}

function AdminCheckbox({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', paddingTop: 22 }}>
      <input type="checkbox" checked={!!checked} onChange={e => onChange(e.target.checked)}/>
      <span>{label}</span>
    </label>
  );
}

function AdminIncidentsPanel({ items, loading, editing, form, onStartCreate, onStartEdit, onCancel, onChange, onSave, onDelete }) {
  const { t } = useI18n();
  const set = (key, val) => onChange({ ...form, [key]: val });

  return (
    <AdminPanelShell title={t('admin.incidentsTitle')} hint={t('admin.incidentsHint')} onAdd={onStartCreate}>
      <AdminTable
        loading={loading}
        rows={items}
        onEdit={onStartEdit}
        onDelete={onDelete}
        columns={[
          { key: 'id', label: t('admin.colId') },
          { key: 'icon', label: t('admin.colIcon'), render: r => <Icon name={r.icon} size={16}/> },
          { key: 'ticketCategory', label: t('admin.colCategory') },
          { key: 'formType', label: t('admin.colFormType') },
          { key: 'sortOrder', label: t('admin.colOrder') },
          { key: 'isActive', label: t('admin.colStatus'), render: r => <AdminActiveBadge active={r.isActive}/> },
        ]}
      />
      {form && (
        <AdminFormCard
          title={editing === 'new' ? t('admin.newIncident') : t('admin.editIncident')}
          onSave={onSave}
          onCancel={onCancel}
          saveDisabled={!form.id || !form.icon || !form.ticketCategory}
        >
          <AdminField label={t('admin.colId')}>
            <Input value={form.id} onChange={v => set('id', v)} disabled={editing !== 'new'} placeholder="ex: imprimante"/>
          </AdminField>
          <AdminField label={t('admin.colIcon')}>
            <Input value={form.icon} onChange={v => set('icon', v)} placeholder="printer"/>
          </AdminField>
          <AdminField label={t('admin.colCategory')}>
            <Input value={form.ticketCategory} onChange={v => set('ticketCategory', v)} placeholder="hardware"/>
          </AdminField>
          <AdminField label={t('admin.colFormType')}>
            <Input value={form.formType} onChange={v => set('formType', v)} placeholder="dynamic_incident"/>
          </AdminField>
          <AdminField label={t('admin.colPortalFlow')}>
            <Input value={form.portalFlow} onChange={v => set('portalFlow', v)} placeholder="avd"/>
          </AdminField>
          <AdminField label={t('admin.colPrefill')}>
            <Input value={form.prefillProblemArea} onChange={v => set('prefillProblemArea', v)} placeholder="Imprimante"/>
          </AdminField>
          <AdminField label={t('admin.colOrder')}>
            <Input value={String(form.sortOrder)} onChange={v => set('sortOrder', parseInt(v, 10) || 0)}/>
          </AdminField>
          <AdminCheckbox label={t('admin.active')} checked={form.isActive} onChange={v => set('isActive', v)}/>
        </AdminFormCard>
      )}
    </AdminPanelShell>
  );
}

function AdminGroupsPanel({ items, incidentIds, loading, editing, form, onStartCreate, onStartEdit, onCancel, onChange, onSave, onDelete }) {
  const { t } = useI18n();
  const set = (key, val) => onChange({ ...form, [key]: val });
  const itemIdsText = (form?.itemIds || []).join(', ');

  return (
    <AdminPanelShell title={t('admin.groupsTitle')} hint={t('admin.groupsHint')} onAdd={onStartCreate}>
      <AdminTable
        loading={loading}
        rows={items}
        onEdit={onStartEdit}
        onDelete={onDelete}
        columns={[
          { key: 'id', label: t('admin.colId') },
          { key: 'itemIds', label: t('admin.colItems'), render: r => (r.itemIds || []).join(', ') },
          { key: 'sortOrder', label: t('admin.colOrder') },
        ]}
      />
      {form && (
        <AdminFormCard
          title={editing === 'new' ? t('admin.newGroup') : t('admin.editGroup')}
          onSave={onSave}
          onCancel={onCancel}
          saveDisabled={!form.id}
        >
          <AdminField label={t('admin.colId')}>
            <Input value={form.id} onChange={v => set('id', v)} disabled={editing !== 'new'} placeholder="ex: equipment"/>
          </AdminField>
          <AdminField label={t('admin.colItems')} hint={t('admin.itemsHint')}>
            <Input
              value={itemIdsText}
              onChange={v => set('itemIds', v.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="imprimante, ringcentral, audio"
            />
          </AdminField>
          <AdminField label={t('admin.colOrder')}>
            <Input value={String(form.sortOrder)} onChange={v => set('sortOrder', parseInt(v, 10) || 0)}/>
          </AdminField>
          {incidentIds.length > 0 && (
            <div style={{ gridColumn: '1 / -1', fontSize: 12, color: 'var(--fg-muted)' }}>
              {t('admin.availableIds')}: {incidentIds.join(', ')}
            </div>
          )}
        </AdminFormCard>
      )}
    </AdminPanelShell>
  );
}

function AdminServicesPanel({ items, loading, editing, form, onStartCreate, onStartEdit, onCancel, onChange, onSave, onDelete }) {
  const { t } = useI18n();
  const set = (key, val) => onChange({ ...form, [key]: val });

  return (
    <AdminPanelShell title={t('admin.servicesTitle')} hint={t('admin.servicesHint')} onAdd={onStartCreate}>
      <AdminTable
        loading={loading}
        rows={items}
        onEdit={onStartEdit}
        onDelete={onDelete}
        columns={[
          { key: 'id', label: t('admin.colId') },
          { key: 'icon', label: t('admin.colIcon'), render: r => <Icon name={r.icon} size={16}/> },
          { key: 'requestType', label: t('admin.colRequestType') },
          { key: 'formType', label: t('admin.colFormType') },
          { key: 'idPrefix', label: t('admin.colPrefix') },
          { key: 'sortOrder', label: t('admin.colOrder') },
          { key: 'isActive', label: t('admin.colStatus'), render: r => <AdminActiveBadge active={r.isActive}/> },
        ]}
      />
      {form && (
        <AdminFormCard
          title={editing === 'new' ? t('admin.newService') : t('admin.editService')}
          onSave={onSave}
          onCancel={onCancel}
          saveDisabled={!form.id || !form.icon || !form.requestType || !form.ticketCategory}
        >
          <AdminField label={t('admin.colId')}>
            <Input value={form.id} onChange={v => set('id', v)} disabled={editing !== 'new'} placeholder="special-it"/>
          </AdminField>
          <AdminField label={t('admin.colIcon')}>
            <Input value={form.icon} onChange={v => set('icon', v)} placeholder="clipboard"/>
          </AdminField>
          <AdminField label={t('admin.colRequestType')}>
            <Input value={form.requestType} onChange={v => set('requestType', v)} placeholder="service"/>
          </AdminField>
          <AdminField label={t('admin.colCategory')}>
            <Input value={form.ticketCategory} onChange={v => set('ticketCategory', v)} placeholder="service"/>
          </AdminField>
          <AdminField label={t('admin.colFormType')}>
            <Input value={form.formType} onChange={v => set('formType', v)} placeholder="service_wizard"/>
          </AdminField>
          <AdminField label={t('admin.colPrefix')}>
            <Input value={form.idPrefix} onChange={v => set('idPrefix', v)} placeholder="REQ"/>
          </AdminField>
          <AdminField label={t('admin.colOrder')}>
            <Input value={String(form.sortOrder)} onChange={v => set('sortOrder', parseInt(v, 10) || 0)}/>
          </AdminField>
          <AdminCheckbox label={t('admin.active')} checked={form.isActive} onChange={v => set('isActive', v)}/>
        </AdminFormCard>
      )}
    </AdminPanelShell>
  );
}

Object.assign(window, { AdminPortalCatalog });
