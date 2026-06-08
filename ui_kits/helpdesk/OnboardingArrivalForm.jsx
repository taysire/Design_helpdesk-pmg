// OnboardingArrivalForm — Assistant arrivée employé (5 étapes)

function OnboardingCheckboxGroup({ options, selected, onToggle }) {
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

function OnboardingArrivalForm({ onCancel, onSubmit }) {
  const { t, lang } = useI18n();
  const [answers, setAnswers] = React.useState({
    accessRequested: [],
    equipmentRequired: [],
  });
  const [phase, setPhase] = React.useState('employee');
  const [submitted, setSubmitted] = React.useState(null);

  const phaseIndex = ONBOARDING_PHASES.indexOf(phase);
  const progress = phase === 'summary' ? 100 : Math.round(((phaseIndex + 1) / ONBOARDING_PHASES.length) * 100);

  const setField = (key, value) => setAnswers(prev => ({ ...prev, [key]: value }));
  const toggleAccess = (id, checked) => setField('accessRequested', toggleOnboardingList(answers.accessRequested, id, checked));
  const toggleEquipment = (id, checked) => setField('equipmentRequired', toggleOnboardingList(answers.equipmentRequired, id, checked));

  const goNext = () => {
    if (!validateOnboardingPhase(phase, answers, t)) return;
    const i = ONBOARDING_PHASES.indexOf(phase);
    if (i < ONBOARDING_PHASES.length - 1) setPhase(ONBOARDING_PHASES[i + 1]);
  };

  const goBack = () => {
    if (phase === 'summary') { setPhase('comments'); return; }
    const i = ONBOARDING_PHASES.indexOf(phase);
    if (i > 0) setPhase(ONBOARDING_PHASES[i - 1]);
    else onCancel && onCancel();
  };

  const submit = () => {
    const ticket = buildOnboardingTicket(answers, t, lang);
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

  const deptOptions = getOnboardingDepartmentOptions();

  return (
    <div className="hd-page-narrow" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, paddingBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-secondary)' }}>
        <a onClick={onCancel} style={{ color: 'var(--accent-700)', cursor: 'pointer', fontWeight: 500 }}>{t('onboardingForm.back')}</a>
        <span style={{ color: 'var(--fg-muted)' }}>/</span>
        <span>{t('services.employeeArrival.label')}</span>
      </div>

      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, background: 'var(--success-50)',
          border: '1px solid var(--success-100)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="user-plus" size={22} color="var(--success-700)"/>
        </div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
          {phase === 'summary' ? t('onboardingForm.summaryTitle') : t('onboardingForm.title')}
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-secondary)', lineHeight: 1.5 }}>
          {t(`onboardingForm.hints.${phase}`)}
        </p>
      </header>

      <FormProgressBar value={progress} step={phaseIndex + 1} total={ONBOARDING_PHASES.length}/>

      {phase !== 'summary' && (
        <div style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 8,
          padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
              color: 'var(--accent-700)', background: 'var(--accent-50)', padding: '2px 8px', borderRadius: 4,
            }}>
              {phaseIndex + 1} / {ONBOARDING_PHASES.length - 1}
            </span>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{t(`onboardingForm.sections.${phase}`)}</h2>
          </div>

          {phase === 'employee' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label={t('onboardingForm.fields.arrivalDate')} required>
                <Input type="date" value={answers.arrivalDate || ''} onChange={v => setField('arrivalDate', v)}/>
              </Field>
              <Field label={t('onboardingForm.fields.employeeName')} required>
                <Input value={answers.employeeName || ''} onChange={v => setField('employeeName', v)}
                  placeholder={t('onboardingForm.placeholders.employeeName')}/>
              </Field>
              <Field label={t('onboardingForm.fields.jobTitle')} required>
                <Input value={answers.jobTitle || ''} onChange={v => setField('jobTitle', v)}
                  placeholder={t('onboardingForm.placeholders.jobTitle')}/>
              </Field>
              <Field label={t('onboardingForm.fields.department')} required>
                <select value={answers.department || ''} onChange={e => setField('department', e.target.value)}
                  style={{
                    fontFamily: 'inherit', fontSize: 14, padding: '8px 12px', width: '100%',
                    borderRadius: 6, border: '1px solid var(--border)', background: 'white', color: 'var(--fg)',
                  }}>
                  <option value="">{t('onboardingForm.chooseDepartment')}</option>
                  {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </Field>
            </div>
          )}

          {phase === 'access' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <OnboardingCheckboxGroup options={ONBOARDING_ACCESS_OPTIONS} selected={answers.accessRequested} onToggle={toggleAccess}/>
              {(answers.accessRequested || []).includes('other') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 4, borderLeft: '2px solid var(--accent-100)' }}>
                  <Field label={t('onboardingForm.fields.otherAccessApp')} required>
                    <Input value={answers.otherAccessApp || ''} onChange={v => setField('otherAccessApp', v)}
                      placeholder={t('onboardingForm.placeholders.otherAccessApp')}/>
                  </Field>
                  <Field label={t('onboardingForm.fields.otherAccessType')} required>
                    <Input value={answers.otherAccessType || ''} onChange={v => setField('otherAccessType', v)}
                      placeholder={t('onboardingForm.placeholders.otherAccessType')}/>
                  </Field>
                </div>
              )}
            </div>
          )}

          {phase === 'equipment' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <OnboardingCheckboxGroup options={ONBOARDING_EQUIPMENT_OPTIONS} selected={answers.equipmentRequired} onToggle={toggleEquipment}/>
              {(answers.equipmentRequired || []).includes('other') && (
                <Field label={t('onboardingForm.fields.otherEquipmentDesc')} required>
                  <Textarea value={answers.otherEquipmentDesc || ''} onChange={v => setField('otherEquipmentDesc', v)} rows={3}
                    placeholder={t('onboardingForm.placeholders.otherEquipmentDesc')}/>
                </Field>
              )}
            </div>
          )}

          {phase === 'comments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Field label={t('onboardingForm.fields.comments')}>
                <Textarea value={answers.comments || ''} onChange={v => setField('comments', v)} rows={4}
                  placeholder={t('onboardingForm.placeholders.comments')}/>
              </Field>
              <Field label={t('onboardingForm.fields.specialInstructions')}>
                <Textarea value={answers.specialInstructions || ''} onChange={v => setField('specialInstructions', v)} rows={3}
                  placeholder={t('onboardingForm.placeholders.specialInstructions')}/>
              </Field>
            </div>
          )}

          <OnboardingWizardNav
            onBack={goBack}
            onNext={goNext}
            nextDisabled={!validateOnboardingPhase(phase, answers, t)}
            nextLabel={phase === 'comments' ? t('onboardingForm.seeSummary') : t('onboardingForm.next')}
            backLabel={phase === 'employee' ? t('onboardingForm.cancel') : t('onboardingForm.prev')}
          />
        </div>
      )}

      {phase === 'summary' && (
        <OnboardingSummaryPanel answers={answers} t={t} lang={lang} onBack={goBack} onSubmit={submit}/>
      )}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>
        {label}{required && <span style={{ color: 'var(--critical-600)' }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function OnboardingSummaryPanel({ answers, t, lang, onBack, onSubmit }) {
  const accessItems = formatOnboardingAccessList(answers, t);
  const equipItems = formatOnboardingEquipmentList(answers, t);
  const comments = [answers.comments, answers.specialInstructions].filter(Boolean).join('\n\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <OnboardingSummaryCard icon="users" title={t('onboardingForm.summary.employee')}>
        <SummaryLine label={t('onboardingForm.summary.name')} value={answers.employeeName}/>
        <SummaryLine label={t('onboardingForm.summary.title')} value={answers.jobTitle}/>
        <SummaryLine label={t('onboardingForm.fields.department')} value={answers.department}/>
      </OnboardingSummaryCard>

      <OnboardingSummaryCard icon="calendar" title={t('onboardingForm.summary.arrival')}>
        <SummaryLine label={t('onboardingForm.fields.arrivalDate')} value={formatOnboardingDate(answers.arrivalDate, lang)}/>
      </OnboardingSummaryCard>

      <OnboardingSummaryCard icon="key" title={t('onboardingForm.summary.access')}>
        <ChecklistItems items={accessItems}/>
      </OnboardingSummaryCard>

      <OnboardingSummaryCard icon="monitor" title={t('onboardingForm.summary.equipment')}>
        <ChecklistItems items={equipItems}/>
      </OnboardingSummaryCard>

      {comments && (
        <OnboardingSummaryCard icon="file-text" title={t('onboardingForm.summary.comments')}>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: 'var(--fg)', whiteSpace: 'pre-wrap' }}>{comments}</p>
        </OnboardingSummaryCard>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button variant="ghost" size="md" onClick={onBack}>← {t('onboardingForm.prev')}</Button>
        <Button variant="primary" size="md" onClick={onSubmit}>
          {t('onboardingForm.submit')}
          <Icon name="send" size={13} color="white"/>
        </Button>
      </div>
    </div>
  );
}

function OnboardingSummaryCard({ icon, title, children }) {
  return (
    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
        borderBottom: '1px solid var(--ink-100)', background: 'var(--ink-50)',
      }}>
        <Icon name={icon} size={18} color="var(--accent-700)"/>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>{title}</h3>
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  );
}

function SummaryLine({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8, fontSize: 13 }}>
      <span style={{ color: 'var(--fg-muted)' }}>{label}</span>
      <span style={{ color: 'var(--fg)', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ChecklistItems({ items }) {
  if (!items.length) return <span style={{ fontSize: 13, color: 'var(--fg-muted)' }}>—</span>;
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--fg)' }}>
          <Icon name="check" size={14} color="var(--success-700)"/>
          {item}
        </li>
      ))}
    </ul>
  );
}

function OnboardingWizardNav({ onBack, onNext, nextDisabled, nextLabel, backLabel }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--ink-100)',
    }}>
      <Button variant="ghost" size="md" onClick={onBack}>{backLabel}</Button>
      <Button variant="primary" size="md" onClick={onNext} disabled={nextDisabled}>
        {nextLabel}
        <Icon name="chevron-right" size={14} color="white"/>
      </Button>
    </div>
  );
}

Object.assign(window, { OnboardingArrivalForm, OnboardingSummaryCard, ChecklistItems, SummaryLine });
