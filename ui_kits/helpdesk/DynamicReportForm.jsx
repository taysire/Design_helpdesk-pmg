// Formulaire dynamique intelligent — une question à la fois (style Microsoft Forms amélioré)

function getFormPhase(stepId, phase, t) {
  if (phase === 'summary') return 'review';
  if (stepId === 'users_affected') return 'context';
  if (ENDING_STEP_IDS.includes(stepId)) return 'details';
  return 'problem';
}

function DynamicReportForm({ onCancel, onSubmit, onViewTicket, portalCategory = null, role = 'enduser' }) {
  const { t, lang } = useI18n();
  const isIt = role === 'it';
  const [answers, setAnswers] = React.useState(() => buildInitialReportAnswers(portalCategory));
  const [cursor, setCursor] = React.useState(0);
  const [phase, setPhase] = React.useState('questions');
  const [submitted, setSubmitted] = React.useState(null);

  const path = React.useMemo(() => resolveFormPath(answers, portalCategory), [answers, portalCategory]);
  const currentStepId = phase === 'questions' ? path[cursor] : null;
  const currentDef = currentStepId ? getStepDef(currentStepId, answers, portalCategory) : null;
  const portalMeta = portalCategory ? getLocalizedPortalIncident(portalCategory, lang) : null;
  const portalLabel = portalMeta?.label || null;
  const currentPhase = getFormPhase(currentStepId, phase, t);
  const progress = path.length ? Math.round(((phase === 'summary' ? path.length : cursor) / path.length) * 100) : 0;

  React.useEffect(() => {
    if (!portalCategory) return;
    setAnswers(prev => applyPortalMeta(prev, portalCategory));
  }, [portalCategory]);

  const setAnswer = (stepId, value) => {
    setAnswers(prev => applyAnswer(prev, stepId, value, portalCategory));
  };

  React.useEffect(() => {
    if (phase !== 'questions') return;
    if (cursor >= path.length && path.length > 0) {
      setCursor(Math.max(0, path.length - 1));
    }
    const stepAtCursor = path[cursor];
    if (stepAtCursor && !path.includes(stepAtCursor)) {
      setCursor(Math.max(0, path.length - 1));
    }
  }, [path.join('|'), cursor, phase]);

  const canContinue = () => {
    if (!currentDef) return false;
    if (!currentDef.required) return true;
    return hasValue(answers, currentStepId);
  };

  const goNext = () => {
    if (!canContinue()) return;
    if (cursor < path.length - 1) {
      setCursor(c => c + 1);
      return;
    }
    setPhase('summary');
  };

  const goBack = () => {
    if (phase === 'summary') {
      setPhase('questions');
      setCursor(Math.max(0, path.length - 1));
      return;
    }
    if (cursor > 0) setCursor(c => c - 1);
    else onCancel && onCancel();
  };

  const submit = () => {
    const ticket = buildTicketFromAnswers(answers, t, portalCategory);
    setSubmitted(ticket);
    setPhase('done');
    onSubmit && onSubmit(ticket);
  };

  if (phase === 'done' && submitted) {
    return (
      <div className="hd-page-narrow" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <StepConfirm
          ticket={submitted}
          onClose={onCancel}
          onViewTicket={onViewTicket ? () => onViewTicket(submitted.id) : undefined}
        />
      </div>
    );
  }

  return (
    <div className="hd-page-narrow" style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 640 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--fg-secondary)' }}>
        <a onClick={onCancel} style={{ color: 'var(--accent-700)', cursor: 'pointer' }}>{t('newTicket.back')}</a>
        <span style={{ color: 'var(--fg-muted)' }}>/</span>
        <span>{t('newTicket.report')}</span>
      </div>

      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>
          {phase === 'summary' ? t('dynamicForm.titleReview') : t('dynamicForm.title')}
        </h1>
        {portalLabel && phase !== 'summary' && (
          <div style={{
            display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: 8,
            padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
            background: 'var(--accent-50)', color: 'var(--accent-700)', border: '1px solid var(--accent-100)',
          }}>
            <Icon name={portalMeta?.icon || 'tag'} size={14} color="var(--accent-700)"/>
            {portalLabel}
          </div>
        )}
        <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-secondary)', lineHeight: 1.5 }}>
          {phase === 'summary'
            ? t('dynamicForm.hintReview')
            : portalCategory
              ? t('dynamicForm.hintPortal', { cat: portalLabel || '' })
              : t('dynamicForm.hintGeneral')}
        </p>
      </header>

      <FormProgressBar
        value={phase === 'summary' ? 100 : progress}
        step={phase === 'summary' ? path.length : cursor + 1}
        total={path.length}
        currentPhase={phase === 'summary' ? 'review' : currentPhase}
        t={t}
      />

      {phase === 'questions' && currentDef && (
        <div style={{
          background: 'white', border: '1px solid var(--border)', borderRadius: 8,
          padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600,
              color: 'var(--accent-700)', background: 'var(--accent-50)',
              padding: '2px 8px', borderRadius: 4,
            }}>
              {cursor + 1} / {path.length}
            </span>
            {currentDef.required && (
              <span style={{ fontSize: 11, color: 'var(--critical-600)' }}>{t('dynamicForm.required')}</span>
            )}
          </div>

          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, lineHeight: 1.35, color: 'var(--fg)' }}>
            {currentDef.label}
          </h2>

          <FormStepInput
            def={currentDef}
            value={answers[currentStepId]}
            onChange={v => setAnswer(currentStepId, v)}
            t={t}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--ink-100)' }}>
            <Button variant="ghost" size="md" onClick={goBack}>
              {cursor === 0 ? t('newTicket.back') : t('dynamicForm.previous')}
            </Button>
            <Button variant="primary" size="md" onClick={goNext} disabled={!canContinue()}>
              {cursor >= path.length - 1 ? t('dynamicForm.seeSummary') : t('dynamicForm.next')}
              <Icon name="chevron-right" size={14} color="white"/>
            </Button>
          </div>
        </div>
      )}

      {phase === 'summary' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{
            background: 'white', border: '1px solid var(--border)', borderRadius: 8,
            overflow: 'hidden',
          }}>
            {getAllAnswerRows(answers).map((row, i) => (
              <div key={row.id} style={{
                padding: '12px 16px',
                borderTop: i === 0 ? 'none' : '1px solid var(--ink-100)',
                display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 12, fontSize: 13,
              }}>
                <span style={{ color: 'var(--fg-secondary)', fontWeight: 500 }}>{row.label}</span>
                <span style={{ color: 'var(--fg)', wordBreak: 'break-word' }}>{row.value}</span>
              </div>
            ))}
          </div>

          <div style={{
            background: 'var(--ink-50)', border: '1px solid var(--ink-100)', borderRadius: 8,
            padding: '12px 14px', fontSize: 12, color: 'var(--fg-secondary)',
            display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          }}>
            <strong style={{ color: 'var(--fg)' }}>{t('dynamicForm.estimatedPriority')} :</strong>
            <PriorityPill priority={mapUsersAffectedToPriority(answers.users_affected)}/>
            <span>{t('dynamicForm.priorityHint')}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button variant="ghost" size="md" onClick={goBack}>{t('dynamicForm.edit')}</Button>
            <Button variant="primary" size="md" onClick={submit}>
              {t('newTicket.send')}
              <Icon name="send" size={13} color="white"/>
            </Button>
          </div>
        </div>
      )}

      {isIt && (
        <details style={{ fontSize: 11, color: 'var(--fg-muted)' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 500 }}>{t('dynamicForm.devSchema')}</summary>
          <pre style={{
            marginTop: 8, padding: 12, background: 'var(--ink-50)', borderRadius: 6,
            overflow: 'auto', maxHeight: 200, fontSize: 10, lineHeight: 1.4,
          }}>
            {JSON.stringify(FORM_DEPENDENCY_JSON, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

const FORM_PHASES = ['context', 'problem', 'details', 'review'];

function FormProgressBar({ value, step, total, currentPhase, t: tProp }) {
  const t = tProp || useI18n().t;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--fg-muted)' }}>
        <span>{t('dynamicForm.progress')}</span>
        <span>{step} / {total}</span>
      </div>
      {currentPhase && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {FORM_PHASES.map((phase, i) => {
            const active = phase === currentPhase;
            const done = FORM_PHASES.indexOf(currentPhase) > i;
            return (
              <React.Fragment key={phase}>
                {i > 0 && (
                  <span style={{
                    flex: 1, height: 1, minWidth: 12, maxWidth: 32,
                    background: done ? 'var(--accent-400)' : 'var(--ink-200)',
                  }}/>
                )}
                <span style={{
                  fontSize: 10, fontWeight: active ? 600 : 500, letterSpacing: '0.04em',
                  textTransform: 'uppercase', whiteSpace: 'nowrap',
                  color: active ? 'var(--accent-700)' : (done ? 'var(--fg-secondary)' : 'var(--fg-muted)'),
                }}>
                  {t(`dynamicForm.phase${phase.charAt(0).toUpperCase()}${phase.slice(1)}`)}
                </span>
              </React.Fragment>
            );
          })}
        </div>
      )}
      <div style={{ height: 6, background: 'var(--ink-100)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: value + '%', background: 'var(--accent-600)',
          borderRadius: 999, transition: 'width 200ms var(--ease-out)',
        }}/>
      </div>
    </div>
  );
}

function FormStepInput({ def, value, onChange, t: tProp }) {
  const t = tProp || useI18n().t;
  if (def.type === 'choice') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {def.options.map(opt => {
          const on = value === opt;
          return (
            <button key={opt} type="button" onClick={() => onChange(opt)}
              style={{
                textAlign: 'left', fontFamily: 'inherit', fontSize: 14, padding: '12px 14px',
                borderRadius: 6, cursor: 'pointer',
                border: '1px solid ' + (on ? 'var(--accent-600)' : 'var(--border)'),
                background: on ? 'var(--accent-50)' : 'white',
                color: 'var(--fg)', fontWeight: on ? 600 : 400,
                transition: 'border-color 120ms, background 120ms',
              }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <span style={{
                  width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                  border: '2px solid ' + (on ? 'var(--accent-600)' : 'var(--border-strong)'),
                  background: on ? 'var(--accent-600)' : 'white',
                  boxShadow: on ? 'inset 0 0 0 3px white' : 'none',
                }}/>
                {opt}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (def.type === 'textarea') {
    return (
      <Textarea value={value || ''} onChange={onChange} rows={def.rows || 4} placeholder={def.placeholder}/>
    );
  }

  if (def.type === 'file') {
    return <FileStepInput def={def} value={value} onChange={onChange} t={t}/>;
  }

  return (
    <Input value={value || ''} onChange={onChange} placeholder={def.placeholder}/>
  );
}

function FileStepInput({ def, value, onChange, t: tProp }) {
  const t = tProp || useI18n().t;
  const inputRef = React.useRef(null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <input ref={inputRef} type="file" multiple style={{ display: 'none' }}
        onChange={e => {
          const files = Array.from(e.target.files || []).map(f => ({ name: f.name, size: f.size }));
          onChange(files);
        }}
      />
      <button type="button" onClick={() => inputRef.current?.click()}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
          border: '1px dashed var(--border-strong)', borderRadius: 6, cursor: 'pointer',
          background: 'var(--ink-50)', fontSize: 13, color: 'var(--fg-secondary)',
          fontFamily: 'inherit', width: '100%', textAlign: 'left',
        }}>
        <Icon name="paperclip" size={18} color="var(--accent-700)"/>
        {value?.length ? t('dynamicForm.filesSelected', { n: value.length }) : t('dynamicForm.chooseFiles')}
      </button>
      {def.hint && <span style={{ fontSize: 11, color: 'var(--fg-muted)' }}>{def.hint}</span>}
    </div>
  );
}

Object.assign(window, { DynamicReportForm, FormProgressBar, FormStepInput, FileStepInput });
