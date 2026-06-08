// EmployeeDepartureForm — Demande de départ d'employé (assistant 7 étapes)

function OffboardingCheckboxGroup({ options, selected, onToggle }) {
  const { t } = useI18n();
  const ids = Array.isArray(selected) ? selected : [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {options.map(opt => {
        const on = ids.includes(opt.id);
        return (
          <label key={opt.id} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
            borderRadius: 8, border: '1px solid ' + (on ? 'var(--accent-300)' : 'var(--border)'),
            background: on ? 'var(--accent-50)' : 'white', cursor: 'pointer',
          }}>
            <input type="checkbox" checked={on} onChange={e => onToggle(opt.id, e.target.checked)}
              style={{ width: 16, height: 16, accentColor: 'var(--accent-600)' }}/>
            <span style={{ fontSize: 14, color: 'var(--fg)', fontWeight: on ? 600 : 400 }}>{t(opt.labelKey)}</span>
          </label>
        );
      })}
    </div>
  );
}

function EmployeeDepartureForm({ onCancel, onSubmit }) {
  const { t, lang } = useI18n();
  const [answers, setAnswers] = React.useState({
    accessToRemove: [],
    equipmentToRecover: [],
  });
  const [phase, setPhase] = React.useState('employee');
  const [submitted, setSubmitted] = React.useState(null);

  const phaseIndex = OFFBOARDING_PHASES.indexOf(phase);
  const progress = phase === 'summary' ? 100 : Math.round(((phaseIndex + 1) / OFFBOARDING_PHASES.length) * 100);

  const setField = (key, value) => setAnswers(prev => ({ ...prev, [key]: value }));
  const toggleAccess = (id, checked) => setField('accessToRemove', toggleOffboardingList(answers.accessToRemove, id, checked));
  const toggleEquipment = (id, checked) => setField('equipmentToRecover', toggleOffboardingList(answers.equipmentToRecover, id, checked));

  const goNext = () => {
    if (!validateOffboardingPhase(phase, answers, t)) return;
    const i = OFFBOARDING_PHASES.indexOf(phase);
    if (i < OFFBOARDING_PHASES.length - 1) setPhase(OFFBOARDING_PHASES[i + 1]);
  };

  const goBack = () => {
    if (phase === 'summary') { setPhase('attachments'); return; }
    const i = OFFBOARDING_PHASES.indexOf(phase);
    if (i > 0) setPhase(OFFBOARDING_PHASES[i - 1]);
    else onCancel && onCancel();
  };

  const submit = () => {
    const ticket = buildOffboardingTicket(answers, t, lang);
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

  const deptOptions = getOffboardingDepartmentOptions();

  return (
    <div className="hd-page-narrow" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720, paddingBottom: 40 }}>
      <nav style={{ fontSize: 12, color: 'var(--fg-secondary)' }}>
        <a onClick={onCancel} style={{ color: 'var(--accent-700)', cursor: 'pointer', fontWeight: 500 }}>{t('offboardingForm.back')}</a>
        <span style={{ color: 'var(--fg-muted)' }}> / </span>
        <span>{t('services.employeeDeparture.label')}</span>
      </nav>

      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, background: 'var(--warning-50)',
          border: '1px solid var(--warning-100)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="user-minus" size={22} color="var(--warning-700)"/>
        </div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
          {phase === 'summary' ? t('offboardingForm.summaryTitle') : t('offboardingForm.title')}
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-secondary)', lineHeight: 1.5 }}>
          {t(`offboardingForm.hints.${phase}`)}
        </p>
      </header>

      <FormProgressBar value={progress} step={phaseIndex + 1} total={OFFBOARDING_PHASES.length}/>

      {phase !== 'summary' && (
        <div style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 8,
          padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
              color: 'var(--warning-700)', background: 'var(--warning-50)', padding: '2px 8px', borderRadius: 4,
            }}>
              {phaseIndex + 1} / {OFFBOARDING_PHASES.length - 1}
            </span>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{t(`offboardingForm.sections.${phase}`)}</h2>
          </div>

          {phase === 'employee' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <OffboardField label={t('offboardingForm.fields.employeeName')} required>
                <Input value={answers.employeeName || ''} onChange={v => setField('employeeName', v)}
                  placeholder={t('offboardingForm.placeholders.employeeName')}/>
              </OffboardField>
              <OffboardField label={t('offboardingForm.fields.jobTitle')} required>
                <Input value={answers.jobTitle || ''} onChange={v => setField('jobTitle', v)}
                  placeholder={t('offboardingForm.placeholders.jobTitle')}/>
              </OffboardField>
              <OffboardField label={t('offboardingForm.fields.department')} required>
                <select value={answers.department || ''} onChange={e => setField('department', e.target.value)}
                  style={offboardSelectStyle}>
                  <option value="">{t('offboardingForm.chooseDepartment')}</option>
                  {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </OffboardField>
              <OffboardField label={t('offboardingForm.fields.manager')} required>
                <Input value={answers.manager || ''} onChange={v => setField('manager', v)}
                  placeholder={t('offboardingForm.placeholders.manager')}/>
              </OffboardField>
              <OffboardField label={t('offboardingForm.fields.departureDate')} required>
                <Input type="date" value={answers.departureDate || ''} onChange={v => setField('departureDate', v)}/>
              </OffboardField>
            </div>
          )}

          {phase === 'departureType' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {OFFBOARDING_DEPARTURE_TYPES.map(opt => {
                const on = answers.departureType === opt.id;
                return (
                  <button key={opt.id} type="button" onClick={() => setField('departureType', opt.id)}
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
              {answers.departureType === 'other' && (
                <OffboardField label={t('offboardingForm.fields.otherDepartureDesc')} required>
                  <Input value={answers.otherDepartureDesc || ''} onChange={v => setField('otherDepartureDesc', v)}
                    placeholder={t('offboardingForm.placeholders.otherDepartureDesc')}/>
                </OffboardField>
              )}
            </div>
          )}

          {phase === 'access' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <OffboardingCheckboxGroup options={OFFBOARDING_ACCESS_OPTIONS} selected={answers.accessToRemove} onToggle={toggleAccess}/>
              {(answers.accessToRemove || []).includes('other') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 4, borderLeft: '2px solid var(--accent-100)' }}>
                  <OffboardField label={t('offboardingForm.fields.otherAccessApp')} required>
                    <Input value={answers.otherAccessApp || ''} onChange={v => setField('otherAccessApp', v)}
                      placeholder={t('offboardingForm.placeholders.otherAccessApp')}/>
                  </OffboardField>
                  <OffboardField label={t('offboardingForm.fields.otherAccessComment')} required>
                    <Textarea value={answers.otherAccessComment || ''} onChange={v => setField('otherAccessComment', v)} rows={2}
                      placeholder={t('offboardingForm.placeholders.otherAccessComment')}/>
                  </OffboardField>
                </div>
              )}
            </div>
          )}

          {phase === 'equipment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <OffboardingCheckboxGroup options={OFFBOARDING_EQUIPMENT_OPTIONS} selected={answers.equipmentToRecover} onToggle={toggleEquipment}/>
              {(answers.equipmentToRecover || []).includes('other') && (
                <OffboardField label={t('offboardingForm.fields.otherEquipmentDesc')} required>
                  <Textarea value={answers.otherEquipmentDesc || ''} onChange={v => setField('otherEquipmentDesc', v)} rows={3}
                    placeholder={t('offboardingForm.placeholders.otherEquipmentDesc')}/>
                </OffboardField>
              )}
            </div>
          )}

          {phase === 'comments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <OffboardField label={t('offboardingForm.fields.comments')}>
                <Textarea value={answers.comments || ''} onChange={v => setField('comments', v)} rows={4}
                  placeholder={t('offboardingForm.placeholders.comments')}/>
              </OffboardField>
              <OffboardField label={t('offboardingForm.fields.specialInstructions')}>
                <Textarea value={answers.specialInstructions || ''} onChange={v => setField('specialInstructions', v)} rows={3}
                  placeholder={t('offboardingForm.placeholders.specialInstructions')}/>
              </OffboardField>
              <OffboardField label={t('offboardingForm.fields.importantInfo')}>
                <Textarea value={answers.importantInfo || ''} onChange={v => setField('importantInfo', v)} rows={3}
                  placeholder={t('offboardingForm.placeholders.importantInfo')}/>
              </OffboardField>
            </div>
          )}

          {phase === 'attachments' && (
            <ServiceAttachmentInput
              def={{ accept: '.png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx', hint: t('offboardingForm.attachmentsHint') }}
              value={answers.attachments}
              onChange={v => setField('attachments', v)}
            />
          )}

          <OffboardWizardNav
            onBack={goBack}
            onNext={goNext}
            nextDisabled={!validateOffboardingPhase(phase, answers, t)}
            nextLabel={phase === 'attachments' ? t('offboardingForm.seeSummary') : t('offboardingForm.next')}
            backLabel={phase === 'employee' ? t('offboardingForm.cancel') : t('offboardingForm.prev')}
          />
        </div>
      )}

      {phase === 'summary' && (
        <OffboardingSummaryPanel answers={answers} t={t} lang={lang} onBack={goBack} onSubmit={submit}/>
      )}
    </div>
  );
}

const offboardSelectStyle = {
  fontFamily: 'inherit', fontSize: 14, padding: '8px 12px', width: '100%',
  borderRadius: 6, border: '1px solid var(--border)', background: 'white', color: 'var(--fg)',
};

function OffboardField({ label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>
        {label}{required && <span style={{ color: 'var(--critical-600)' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function OffboardWizardNav({ onBack, onNext, nextDisabled, nextLabel, backLabel }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--ink-100)',
    }}>
      <Button variant="ghost" size="md" onClick={onBack}>{backLabel}</Button>
      <Button variant="primary" size="md" onClick={onNext} disabled={nextDisabled}>
        {nextLabel}<Icon name="chevron-right" size={14} color="white"/>
      </Button>
    </div>
  );
}

function OffboardingSummaryPanel({ answers, t, lang, onBack, onSubmit }) {
  const accessItems = formatOffboardingAccessList(answers, t);
  const equipItems = formatOffboardingEquipmentList(answers, t);
  const attachments = answers.attachments || [];
  const commentBlocks = [
    answers.comments,
    answers.specialInstructions,
    answers.importantInfo,
  ].filter(Boolean);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <OnboardingSummaryCard icon="users" title={t('offboardingForm.summary.employee')}>
        <SummaryLine label={t('offboardingForm.summary.name')} value={answers.employeeName}/>
        <SummaryLine label={t('offboardingForm.summary.title')} value={answers.jobTitle}/>
        <SummaryLine label={t('offboardingForm.fields.department')} value={answers.department}/>
        <SummaryLine label={t('offboardingForm.fields.manager')} value={answers.manager}/>
      </OnboardingSummaryCard>

      <OnboardingSummaryCard icon="calendar" title={t('offboardingForm.summary.departure')}>
        <SummaryLine label={t('offboardingForm.fields.departureDate')} value={formatOffboardingDate(answers.departureDate, lang)}/>
        <SummaryLine label={t('offboardingForm.fields.departureType')} value={getDepartureTypeLabel(answers.departureType, t)}/>
      </OnboardingSummaryCard>

      <OnboardingSummaryCard icon="key" title={t('offboardingForm.summary.access')}>
        <ChecklistItems items={accessItems}/>
      </OnboardingSummaryCard>

      <OnboardingSummaryCard icon="monitor" title={t('offboardingForm.summary.equipment')}>
        <ChecklistItems items={equipItems}/>
      </OnboardingSummaryCard>

      {commentBlocks.length > 0 && (
        <OnboardingSummaryCard icon="file-text" title={t('offboardingForm.summary.comments')}>
          {commentBlocks.map((text, i) => (
            <p key={i} style={{ margin: i ? '12px 0 0' : 0, fontSize: 14, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{text}</p>
          ))}
        </OnboardingSummaryCard>
      )}

      {attachments.length > 0 && (
        <OnboardingSummaryCard icon="paperclip" title={t('offboardingForm.summary.attachments')}>
          <ChecklistItems items={attachments.map(f => f.name || f)}/>
        </OnboardingSummaryCard>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="ghost" size="md" onClick={onBack}>← {t('offboardingForm.prev')}</Button>
        <Button variant="primary" size="md" onClick={onSubmit}>
          {t('offboardingForm.submit')}<Icon name="send" size={13} color="white"/>
        </Button>
      </div>
    </div>
  );
}

Object.assign(window, { EmployeeDepartureForm, OffboardingCheckboxGroup });
