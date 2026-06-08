// ITEquipmentRequestForm — Demande de matériel informatique (assistant 6 étapes)

function EquipmentItemCard({ item, selected, onToggle, label }) {
  const [hover, setHover] = React.useState(false);
  const on = selected;
  return (
    <button type="button" onClick={() => onToggle(!on)}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        fontFamily: 'inherit', textAlign: 'left', padding: '14px 12px',
        borderRadius: 8, cursor: 'pointer',
        border: '2px solid ' + (on ? 'var(--accent-600)' : (hover ? 'var(--border-strong)' : 'var(--border)')),
        background: on ? 'var(--accent-50)' : (hover ? 'var(--ink-50)' : 'white'),
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        transition: 'border-color 120ms, background 120ms',
        minHeight: 100,
      }}>
      <span style={{
        width: 44, height: 44, borderRadius: 8,
        background: on ? 'white' : 'var(--ink-50)',
        border: '1px solid ' + (on ? 'var(--accent-200)' : 'var(--ink-100)'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={item.icon} size={22} color={on ? 'var(--accent-700)' : 'var(--fg-secondary)'}/>
      </span>
      <span style={{ fontSize: 12, fontWeight: on ? 600 : 500, color: 'var(--fg)', lineHeight: 1.3 }}>{label}</span>
      {on && <Icon name="check-circle" size={14} color="var(--accent-700)"/>}
    </button>
  );
}

function ITEquipmentRequestForm({ onCancel, onSubmit }) {
  const { t } = useI18n();
  const [answers, setAnswers] = React.useState({ equipmentItems: [] });
  const [phase, setPhase] = React.useState('requester');
  const [submitted, setSubmitted] = React.useState(null);

  const phaseIndex = IT_EQUIPMENT_PHASES.indexOf(phase);
  const progress = phase === 'summary' ? 100 : Math.round(((phaseIndex + 1) / IT_EQUIPMENT_PHASES.length) * 100);
  const setField = (key, val) => setAnswers(prev => ({ ...prev, [key]: val }));

  const goNext = () => {
    if (!validateEquipmentPhase(phase, answers, t)) return;
    const i = IT_EQUIPMENT_PHASES.indexOf(phase);
    if (i < IT_EQUIPMENT_PHASES.length - 1) setPhase(IT_EQUIPMENT_PHASES[i + 1]);
  };

  const goBack = () => {
    if (phase === 'summary') { setPhase('attachments'); return; }
    const i = IT_EQUIPMENT_PHASES.indexOf(phase);
    if (i > 0) setPhase(IT_EQUIPMENT_PHASES[i - 1]);
    else onCancel && onCancel();
  };

  const submit = () => {
    const ticket = buildITEquipmentTicket(answers, t);
    setSubmitted(ticket);
    setPhase('done');
    onSubmit && onSubmit(ticket);
  };

  if (phase === 'done' && submitted) {
    return (
      <div className="hd-page-narrow" style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 640 }}>
        <StepConfirm ticket={submitted} onClose={onCancel}/>
      </div>
    );
  }

  const deptOptions = getEquipmentDepartmentOptions();

  return (
    <div className="hd-page-narrow" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720, paddingBottom: 40 }}>
      <nav style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>
        <a onClick={onCancel} style={{ color: 'var(--accent-700)', cursor: 'pointer', fontWeight: 500 }}>{t('equipmentForm.back')}</a>
        <span style={{ color: 'var(--fg-muted)' }}> / </span>
        <span>{t('services.itEquipment.label')}</span>
      </nav>

      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, background: 'var(--accent-50)',
          border: '1px solid var(--accent-100)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="package" size={22} color="var(--accent-700)"/>
        </div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{phase === 'summary' ? t('equipmentForm.summaryTitle') : t('equipmentForm.title')}</h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-secondary)' }}>{t(`equipmentForm.hints.${phase}`)}</p>
      </header>

      <FormProgressBar value={progress} step={phaseIndex + 1} total={IT_EQUIPMENT_PHASES.length}/>

      {phase !== 'summary' && (
        <div style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 8,
          padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{t(`equipmentForm.sections.${phase}`)}</h2>

          {phase === 'requester' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <EquipField label={t('equipmentForm.fields.requesterName')} required>
                <Input value={answers.requesterName || ''} onChange={v => setField('requesterName', v)}
                  placeholder={t('equipmentForm.placeholders.requesterName')}/>
              </EquipField>
              <EquipField label={t('equipmentForm.fields.department')} required>
                <select value={answers.department || ''} onChange={e => setField('department', e.target.value)}
                  style={equipSelectStyle}>
                  <option value="">{t('equipmentForm.chooseDepartment')}</option>
                  {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </EquipField>
            </div>
          )}

          {phase === 'requestType' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {IT_EQUIPMENT_REQUEST_TYPES.map(opt => {
                const on = answers.requestType === opt.id;
                return (
                  <button key={opt.id} type="button" onClick={() => setField('requestType', opt.id)}
                    style={{
                      textAlign: 'left', fontFamily: 'inherit', fontSize: 14, padding: '12px 14px',
                      borderRadius: 8, cursor: 'pointer',
                      border: '1px solid ' + (on ? 'var(--accent-600)' : 'var(--border)'),
                      background: on ? 'var(--accent-50)' : 'white', fontWeight: on ? 600 : 400,
                    }}>
                    {t(opt.labelKey)}
                  </button>
                );
              })}
            </div>
          )}

          {phase === 'equipment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 10,
              }}>
                {IT_EQUIPMENT_ITEMS.map(item => (
                  <EquipmentItemCard
                    key={item.id}
                    item={item}
                    label={t(item.labelKey)}
                    selected={(answers.equipmentItems || []).includes(item.id)}
                    onToggle={checked => setField('equipmentItems', toggleEquipmentList(answers.equipmentItems, item.id, checked))}
                  />
                ))}
              </div>
              {(answers.equipmentItems || []).includes('other') && (
                <EquipField label={t('equipmentForm.fields.otherEquipmentDesc')} required>
                  <Textarea value={answers.otherEquipmentDesc || ''} onChange={v => setField('otherEquipmentDesc', v)} rows={3}
                    placeholder={t('equipmentForm.placeholders.otherEquipmentDesc')}/>
                </EquipField>
              )}
            </div>
          )}

          {phase === 'justification' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <EquipField label={t('equipmentForm.fields.requestReason')} required>
                <Textarea value={answers.requestReason || ''} onChange={v => setField('requestReason', v)} rows={4}
                  placeholder={t('equipmentForm.placeholders.requestReason')}/>
              </EquipField>
              <EquipField label={t('equipmentForm.fields.workImpact')}>
                <Textarea value={answers.workImpact || ''} onChange={v => setField('workImpact', v)} rows={3}
                  placeholder={t('equipmentForm.placeholders.workImpact')}/>
              </EquipField>
              <EquipField label={t('equipmentForm.fields.additionalInfo')}>
                <Textarea value={answers.additionalInfo || ''} onChange={v => setField('additionalInfo', v)} rows={3}
                  placeholder={t('equipmentForm.placeholders.additionalInfo')}/>
              </EquipField>
            </div>
          )}

          {phase === 'attachments' && (
            <ServiceAttachmentInput
              def={{ accept: '.png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx', hint: t('equipmentForm.attachmentsHint') }}
              value={answers.attachments}
              onChange={v => setField('attachments', v)}
            />
          )}

          <EquipWizardNav
            onBack={goBack}
            onNext={goNext}
            nextDisabled={!validateEquipmentPhase(phase, answers, t)}
            nextLabel={phase === 'attachments' ? t('equipmentForm.seeSummary') : t('equipmentForm.next')}
            backLabel={phase === 'requester' ? t('equipmentForm.cancel') : t('equipmentForm.prev')}
          />
        </div>
      )}

      {phase === 'summary' && (
        <ITEquipmentSummary answers={answers} t={t} onBack={goBack} onSubmit={submit}/>
      )}
    </div>
  );
}

const equipSelectStyle = {
  fontFamily: 'inherit', fontSize: 14, padding: '8px 12px', width: '100%',
  borderRadius: 6, border: '1px solid var(--border)', background: 'white', color: 'var(--fg)',
};

function EquipField({ label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600 }}>{label}{required && <span style={{ color: 'var(--critical-600)' }}> *</span>}</label>
      {children}
    </div>
  );
}

function EquipWizardNav({ onBack, onNext, nextDisabled, nextLabel, backLabel }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--ink-100)' }}>
      <Button variant="ghost" size="md" onClick={onBack}>{backLabel}</Button>
      <Button variant="primary" size="md" onClick={onNext} disabled={nextDisabled}>
        {nextLabel}<Icon name="chevron-right" size={14} color="white"/>
      </Button>
    </div>
  );
}

function ITEquipmentSummary({ answers, t, onBack, onSubmit }) {
  const items = formatEquipmentItemsList(answers, t);
  const attachments = answers.attachments || [];
  const justification = [
    answers.requestReason,
    answers.workImpact,
    answers.additionalInfo,
  ].filter(Boolean).join('\n\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <OnboardingSummaryCard icon="package" title={t('equipmentForm.summary.requestType')}>
        <SummaryLine label={t('equipmentForm.fields.requestType')} value={getRequestTypeLabel(answers.requestType, t)}/>
        <SummaryLine label={t('equipmentForm.fields.department')} value={answers.department}/>
      </OnboardingSummaryCard>
      <OnboardingSummaryCard icon="users" title={t('equipmentForm.summary.requester')}>
        <SummaryLine label={t('equipmentForm.fields.requesterName')} value={answers.requesterName}/>
      </OnboardingSummaryCard>
      <OnboardingSummaryCard icon="monitor" title={t('equipmentForm.summary.equipment')}>
        <ChecklistItems items={items}/>
      </OnboardingSummaryCard>
      {justification && (
        <OnboardingSummaryCard icon="file-text" title={t('equipmentForm.summary.justification')}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{justification}</p>
        </OnboardingSummaryCard>
      )}
      {attachments.length > 0 && (
        <OnboardingSummaryCard icon="paperclip" title={t('equipmentForm.summary.attachments')}>
          <ChecklistItems items={attachments.map(f => f.name || f)}/>
        </OnboardingSummaryCard>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="ghost" size="md" onClick={onBack}>← {t('equipmentForm.prev')}</Button>
        <Button variant="primary" size="md" onClick={onSubmit}>
          {t('equipmentForm.submit')}<Icon name="send" size={13} color="white"/>
        </Button>
      </div>
    </div>
  );
}

Object.assign(window, { ITEquipmentRequestForm, EquipmentItemCard });
