// SpecialServiceForm — Assistant intelligent Demande spéciale TI

function ServiceAttachmentInput({ def, value, onChange }) {
  const { t } = useI18n();
  const inputRef = React.useRef(null);
  const files = Array.isArray(value) ? value : [];

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []).map(f => {
      const entry = { name: f.name, size: f.size, type: f.type };
      if (f.type && f.type.startsWith('image/')) {
        try { entry.previewUrl = URL.createObjectURL(f); } catch (e) { /* prototype */ }
      }
      return entry;
    });
    onChange([...files, ...incoming]);
  };

  const removeAt = (i) => {
    const next = files.filter((_, idx) => idx !== i);
    const removed = files[i];
    if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
    onChange(next);
  };

  const extIcon = (name) => {
    if (/\.(pdf)$/i.test(name)) return 'file-text';
    if (/\.(xlsx?|csv)$/i.test(name)) return 'box';
    if (/\.(docx?)$/i.test(name)) return 'file-text';
    return 'paperclip';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <input ref={inputRef} type="file" multiple accept={def.accept || '*'} style={{ display: 'none' }}
        onChange={e => { addFiles(e.target.files); e.target.value = ''; }}
      />
      <button type="button" onClick={() => inputRef.current?.click()}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
          border: '1px dashed var(--border-strong)', borderRadius: 8, cursor: 'pointer',
          background: 'var(--ink-50)', fontSize: 13, color: 'var(--fg-secondary)',
          fontFamily: 'inherit', width: '100%', textAlign: 'left',
        }}>
        <Icon name="paperclip" size={18} color="var(--accent-700)"/>
        {files.length ? `${files.length} fichier(s)` : t('serviceForm.attachmentsHint')}
      </button>
      {files.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 10,
        }}>
          {files.map((f, i) => (
            <div key={i} style={{
              border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', background: 'white',
            }}>
              <div style={{
                height: 96, background: 'var(--ink-50)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderBottom: '1px solid var(--ink-100)', position: 'relative',
              }}>
                {f.previewUrl ? (
                  <img src={f.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                ) : (
                  <Icon name={extIcon(f.name)} size={28} color="var(--fg-muted)"/>
                )}
                <button type="button" onClick={() => removeAt(i)} aria-label="Remove"
                  style={{
                    position: 'absolute', top: 6, right: 6, width: 22, height: 22, borderRadius: 4,
                    border: '1px solid var(--border)', background: 'white', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
                  }}>
                  <Icon name="x" size={12} color="var(--fg-secondary)"/>
                </button>
              </div>
              <div style={{ padding: '8px 10px' }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.name}>{f.name}</div>
                {f.size != null && <div style={{ fontSize: 10, color: 'var(--fg-muted)' }}>{(f.size / 1024).toFixed(0)} Ko</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceFormStepInput({ def, value, onChange }) {
  if (def.id === 'attachments') {
    return <ServiceAttachmentInput def={def} value={value} onChange={onChange}/>;
  }
  return <FormStepInput def={def} value={value} onChange={onChange}/>;
}

function SpecialServiceForm({ onCancel, onSubmit }) {
  const { t } = useI18n();
  const [answers, setAnswers] = React.useState({});
  const [phase, setPhase] = React.useState('category'); // category | fields | summary | done
  const [cursor, setCursor] = React.useState(0);
  const [submitted, setSubmitted] = React.useState(null);

  const category = answers.serviceCategory;
  const fieldPath = React.useMemo(() => resolveServiceFieldPath(category), [category]);
  const currentFieldId = phase === 'fields' ? fieldPath[cursor] : null;
  const currentDef = currentFieldId ? getServiceFieldDef(currentFieldId, t) : null;

  const totalSteps = 1 + (fieldPath.length || 0);
  const currentStepNum = phase === 'category' ? 1
    : phase === 'fields' ? 2 + cursor
    : phase === 'summary' ? totalSteps
    : totalSteps;
  const progress = Math.round((currentStepNum / Math.max(totalSteps, 1)) * 100);

  const setAnswer = (fieldId, value) => {
    setAnswers(prev => ({ ...prev, [fieldId]: value }));
  };

  const canContinueCategory = () => !!category;
  const canContinueField = () => {
    if (!currentDef) return false;
    if (!currentDef.required) return true;
    return serviceHasValue(answers, currentFieldId);
  };

  const goNext = () => {
    if (phase === 'category') {
      if (!canContinueCategory()) return;
      setPhase('fields');
      setCursor(0);
      return;
    }
    if (phase === 'fields') {
      if (!canContinueField()) return;
      if (cursor < fieldPath.length - 1) {
        setCursor(c => c + 1);
        return;
      }
      setPhase('summary');
    }
  };

  const goBack = () => {
    if (phase === 'summary') {
      setPhase('fields');
      setCursor(Math.max(0, fieldPath.length - 1));
      return;
    }
    if (phase === 'fields') {
      if (cursor > 0) setCursor(c => c - 1);
      else setPhase('category');
      return;
    }
    onCancel && onCancel();
  };

  const submit = () => {
    const ticket = buildSpecialItTicket(answers, t);
    setSubmitted(ticket);
    setPhase('done');
    onSubmit && onSubmit(ticket);
  };

  const summaryRows = () => {
    const cat = getServiceCategoryLabel(category, t);
    const rows = [
      { label: t('serviceForm.categoryLabel'), value: cat },
      { label: t('serviceForm.subcategory'), value: cat },
      { label: t('serviceReport.department'), value: answers.department },
      { label: t('serviceReport.dueDate'), value: answers.desired_date },
      { label: t('serviceReport.urgency'), value: answers.urgency },
      {
        label: t('serviceReport.description'),
        value: answers.detailed_description || answers.justification || answers.expected_outcome || answers.objective,
      },
      {
        label: t('serviceReport.attachments'),
        value: formatServiceValue('attachments', answers.attachments, t),
      },
    ];
    return rows.filter(r => r.value && r.value !== '—');
  };

  if (phase === 'done' && submitted) {
    return (
      <div className="hd-page-narrow" style={{ display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 640 }}>
        <StepConfirm ticket={submitted} onClose={onCancel}/>
      </div>
    );
  }

  return (
    <div className="hd-page-narrow" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640, paddingBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-secondary)' }}>
        <a onClick={onCancel} style={{ color: 'var(--accent-700)', cursor: 'pointer', fontWeight: 500 }}>{t('serviceForm.back')}</a>
        <span style={{ color: 'var(--fg-muted)' }}>/</span>
        <span>{t('services.specialIt.label')}</span>
      </div>

      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, background: 'var(--accent-50)',
          border: '1px solid var(--accent-100)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="clipboard" size={22} color="var(--accent-700)"/>
        </div>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
          {phase === 'summary' ? t('serviceForm.summaryTitle') : t('serviceForm.specialItTitle')}
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-secondary)', lineHeight: 1.5 }}>
          {phase === 'summary' ? t('serviceForm.summaryHint')
            : phase === 'category' ? t('serviceForm.stepCategoryHint')
            : t('serviceForm.stepFieldsHint')}
        </p>
      </header>

      <FormProgressBar value={progress} step={currentStepNum} total={totalSteps}/>

      {phase === 'category' && (
        <div style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 8,
          padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{t('serviceForm.stepCategory')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SERVICE_CATEGORIES.map(cat => {
              const on = category === cat.id;
              return (
                <button key={cat.id} type="button" onClick={() => setAnswer('serviceCategory', cat.id)}
                  style={{
                    textAlign: 'left', fontFamily: 'inherit', fontSize: 14, padding: '12px 14px',
                    borderRadius: 8, cursor: 'pointer',
                    border: '1px solid ' + (on ? 'var(--accent-600)' : 'var(--border)'),
                    background: on ? 'var(--accent-50)' : 'white',
                    color: 'var(--fg)', fontWeight: on ? 600 : 400,
                  }}>
                  {t(cat.labelKey)}
                </button>
              );
            })}
          </div>
          <WizardNav onBack={goBack} onNext={goNext} nextDisabled={!canContinueCategory()} nextLabel={t('serviceForm.next')} backLabel={t('serviceForm.cancel')}/>
        </div>
      )}

      {phase === 'fields' && currentDef && (
        <div style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 8,
          padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
              color: 'var(--accent-700)', background: 'var(--accent-50)', padding: '2px 8px', borderRadius: 4,
            }}>
              {cursor + 1} / {fieldPath.length}
            </span>
            <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{t('serviceForm.stepFields')}</span>
            {currentDef.required && <span style={{ fontSize: 11, color: 'var(--critical-600)' }}>{t('serviceForm.required')}</span>}
          </div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, lineHeight: 1.35 }}>{currentDef.label}</h2>
          <ServiceFormStepInput def={currentDef} value={answers[currentFieldId]} onChange={v => setAnswer(currentFieldId, v)}/>
          <WizardNav
            onBack={goBack}
            onNext={goNext}
            nextDisabled={!canContinueField()}
            nextLabel={cursor >= fieldPath.length - 1 ? t('serviceForm.seeSummary') : t('serviceForm.next')}
          />
        </div>
      )}

      {phase === 'summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {summaryRows().map((row, i) => (
              <div key={i} style={{
                padding: '12px 16px', borderTop: i === 0 ? 'none' : '1px solid var(--ink-100)',
                display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 12, fontSize: 13,
              }}>
                <span style={{ color: 'var(--fg-secondary)', fontWeight: 500 }}>{row.label}</span>
                <span style={{ color: 'var(--fg)', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{row.value}</span>
              </div>
            ))}
            {getServiceAnswerRows(answers, t)
              .filter(r => !['department', 'desired_date', 'urgency', 'attachments', 'detailed_description'].includes(r.id)
                && !['justification', 'expected_outcome', 'objective'].includes(r.id))
              .map((row, i) => (
                <div key={'d-' + row.id} style={{
                  padding: '12px 16px', borderTop: '1px solid var(--ink-100)',
                  display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 12, fontSize: 13,
                }}>
                  <span style={{ color: 'var(--fg-secondary)', fontWeight: 500 }}>{row.label}</span>
                  <span style={{ color: 'var(--fg)', wordBreak: 'break-word' }}>{row.value}</span>
                </div>
              ))}
          </div>
          {answers.urgency && (
            <div style={{
              background: 'var(--ink-50)', border: '1px solid var(--ink-100)', borderRadius: 8,
              padding: '12px 14px', fontSize: 12, color: 'var(--fg-secondary)',
            }}>
              <strong style={{ color: 'var(--fg)' }}>{t('ticket.priority')} :</strong>{' '}
              {mapServiceUrgencyToPriority(answers.urgency)}
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="ghost" size="md" onClick={goBack}>← {t('serviceForm.prev')}</Button>
            <Button variant="primary" size="md" onClick={submit}>
              {t('serviceForm.send')}
              <Icon name="send" size={13} color="white"/>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function WizardNav({ onBack, onNext, nextDisabled, nextLabel, backLabel }) {
  const { t } = useI18n();
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--ink-100)',
    }}>
      <Button variant="ghost" size="md" onClick={onBack}>{backLabel || t('serviceForm.prev')}</Button>
      <Button variant="primary" size="md" onClick={onNext} disabled={nextDisabled}>
        {nextLabel}
        <Icon name="chevron-right" size={14} color="white"/>
      </Button>
    </div>
  );
}

Object.assign(window, { SpecialServiceForm, ServiceAttachmentInput, ServiceFormStepInput });
