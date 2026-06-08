// NewTicket — end-user report flow (multi-step)

function NewTicket({ onCancel, onSubmit }) {
  const { t } = useI18n();
  const [step, setStep] = React.useState(1);
  const [draft, setDraft] = React.useState({
    category: null,
    title: '',
    urgency: 'P3',
    description: '',
  });
  const [submitted, setSubmitted] = React.useState(null);

  const update = (key, value) => setDraft(d => ({ ...d, [key]: value }));

  const submit = () => {
    const id = (draft.category === 'onboard' ? 'ONB-' :
                draft.category === 'offboard' ? 'OFF-' :
                ['hardware','avd','kroll','apps'].includes(draft.category) ? 'INC-' : 'REQ-')
                + String(Math.floor(2050 + Math.random()*100)).padStart(4,'0');
    const ticket = {
      id, title: draft.title || t('newTicket.untitled'), category: draft.category,
      priority: draft.urgency, status: 'new',
      reporter: 'me', assignee: null,
      opened: 'just now', updated: 'just now',
      body: draft.description, jira: null, slack: null,
      activity: [{ who:'me', kind:'opened', text:'Opened the ticket', at:'just now' }],
    };
    setSubmitted(ticket);
    setStep(3);
    onSubmit && onSubmit(ticket);
  };

  return (
    <div className="hd-page-narrow" style={{display:'flex', flexDirection:'column', gap:18}}>
      <div style={{display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--fg-secondary)'}}>
        <a onClick={onCancel} style={{color:'var(--accent-700)', cursor:'pointer'}}>{t('newTicket.back')}</a>
        <span style={{color:'var(--fg-muted)'}}>/</span>
        <span>{t('newTicket.report')}</span>
      </div>

      <Stepper step={step}/>

      {step === 1 && <StepCategory draft={draft} update={update} next={()=>setStep(2)}/>}
      {step === 2 && <StepDetails draft={draft} update={update} back={()=>setStep(1)} submit={submit}/>}
      {step === 3 && submitted && <StepConfirm ticket={submitted} onClose={onCancel}/>}
    </div>
  );
}

function Stepper({ step }) {
  const { t } = useI18n();
  const steps = [t('newTicket.stepKind'), t('newTicket.stepDetails'), t('newTicket.stepDone')];
  return (
    <div style={{display:'flex', alignItems:'center', gap:8}}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          {i > 0 && <div style={{width:24, height:1, background:'var(--border)'}}/>}
          <div style={{display:'flex', alignItems:'center', gap:8, opacity: step >= i+1 ? 1 : 0.5}}>
            <div style={{
              width:22, height:22, borderRadius:'50%',
              border:'1px solid ' + (step >= i+1 ? 'var(--accent-600)' : 'var(--border-strong)'),
              background: step > i+1 ? 'var(--accent-600)' : (step === i+1 ? 'white' : 'transparent'),
              color: step > i+1 ? 'white' : (step === i+1 ? 'var(--accent-700)' : 'var(--fg-muted)'),
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:11, fontWeight:600, fontFamily:'var(--font-mono)',
            }}>
              {step > i+1 ? <Icon name="check" size={12} color="white" strokeWidth={2.5}/> : (i+1)}
            </div>
            <span style={{fontSize:12, fontWeight: step === i+1 ? 600 : 400, color: step >= i+1 ? 'var(--fg)' : 'var(--fg-muted)'}}>{s}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

function StepCategory({ draft, update, next }) {
  const { t, lang } = useI18n();
  return (
    <div style={{display:'flex', flexDirection:'column', gap:14}}>
      <header style={{display:'flex', flexDirection:'column', gap:4}}>
        <h2 style={{margin:0, fontSize:20, fontWeight:700, letterSpacing:'-0.02em'}}>{t('newTicket.kindTitle')}</h2>
        <p style={{margin:0, fontSize:13, color:'var(--fg-secondary)'}}>{t('newTicket.kindHint')}</p>
      </header>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10}}>
        {window.PMG_DATA.CATEGORIES.map(c => (
          <CategoryCard key={c.id} category={getLocalizedCategory(c.id, lang)} selected={draft.category === c.id}
            onClick={()=>update('category', c.id)}/>
        ))}
      </div>
      <div style={{display:'flex', justifyContent:'flex-end', marginTop:8}}>
        <Button variant="primary" size="md" onClick={next} disabled={!draft.category}>
          {t('newTicket.continue')}
          <Icon name="chevron-right" size={14} color="white"/>
        </Button>
      </div>
    </div>
  );
}

function CategoryCard({ category, selected, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        padding:'14px 14px', borderRadius:8, cursor:'pointer',
        background: selected ? 'var(--accent-50)' : 'white',
        border:'1px solid ' + (selected ? 'var(--accent-600)' : (hover ? 'var(--border-strong)' : 'var(--border)')),
        display:'flex', flexDirection:'column', gap:8,
        transition: 'all 120ms',
      }}>
      <div style={{
        width:32, height:32, borderRadius:8,
        background: selected ? 'var(--accent-600)' : 'var(--ink-100)',
        color: selected ? 'white' : 'var(--fg)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <Icon name={category.icon} size={16}/>
      </div>
      <div style={{display:'flex', flexDirection:'column', gap:2}}>
        <span style={{fontSize:13, fontWeight:600, color:'var(--fg)'}}>{category.label}</span>
        <span style={{fontSize:11, color:'var(--fg-muted)', lineHeight:1.3}}>{category.hint}</span>
      </div>
    </div>
  );
}

function StepDetails({ draft, update, back, submit }) {
  const { t, lang } = useI18n();
  const category = getLocalizedCategory(draft.category, lang);
  return (
    <div style={{display:'flex', flexDirection:'column', gap:14}}>
      <header style={{display:'flex', flexDirection:'column', gap:4}}>
        <h2 style={{margin:0, fontSize:20, fontWeight:700, letterSpacing:'-0.02em'}}>{t('newTicket.detailsTitle')}</h2>
        <p style={{margin:0, fontSize:13, color:'var(--fg-secondary)'}}>
          {t('newTicket.detailsHint', { cat: category?.label || '' })}
        </p>
      </header>

      <Field label={t('newTicket.fieldTitle')}>
        <Input value={draft.title} onChange={v=>update('title', v)} placeholder={t('newTicket.fieldTitlePh')} />
      </Field>

      <Field label={t('newTicket.fieldUrgent')}>
        <UrgencyPicker value={draft.urgency} onChange={v=>update('urgency', v)}/>
      </Field>

      <Field label={t('newTicket.fieldMore')} hint={t('newTicket.fieldMoreHint')}>
        <Textarea value={draft.description} onChange={v=>update('description', v)} rows={4}
          placeholder={t('newTicket.fieldMorePh')}/>
      </Field>

      <div style={{
        background:'var(--ink-50)', border:'1px solid var(--ink-100)', borderRadius:8,
        padding:'10px 14px', display:'flex', alignItems:'center', gap:10,
        fontSize:12, color:'var(--fg-secondary)',
      }}>
        <Icon name="check-circle" size={14} color="var(--success-600)"/>
        {t('newTicket.profileHint')} <strong style={{color:'var(--fg)'}}>HQ — 3rd floor</strong> · <strong style={{color:'var(--fg)'}}>you</strong>
      </div>

      <div style={{display:'flex', justifyContent:'space-between', marginTop:6}}>
        <Button variant="ghost" size="md" onClick={back}>{t('newTicket.back')}</Button>
        <Button variant="primary" size="md" onClick={submit}>
          {t('newTicket.send')}
          <Icon name="send" size={13} color="white"/>
        </Button>
      </div>
    </div>
  );
}

function UrgencyPicker({ value, onChange }) {
  const { t } = useI18n();
  const options = [
    { v:'P1', desc: t('priority.p1Short') },
    { v:'P2', desc: t('priority.p2Short') },
    { v:'P3', desc: t('priority.p3Short') },
    { v:'P4', desc: t('priority.p4Short') },
  ];
  return (
    <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8}}>
      {options.map(o => {
        const on = value === o.v;
        return (
          <button key={o.v} type="button" onClick={()=>onChange(o.v)}
            style={{
              padding:'10px 12px', borderRadius:6,
              border:'1px solid ' + (on ? 'var(--accent-600)' : 'var(--border)'),
              background: on ? 'var(--accent-50)' : 'white',
              cursor:'pointer', fontFamily:'inherit',
              display:'flex', flexDirection:'column', gap:6, alignItems:'flex-start', textAlign:'left',
              transition: 'border-color 120ms, background 120ms',
            }}>
            <PriorityPill priority={o.v}/>
            <span style={{fontSize:11, color:'var(--fg-muted)', lineHeight:1.35}}>{o.desc}</span>
          </button>
        );
      })}
    </div>
  );
}

function StepConfirm({ ticket, onClose, onViewTicket }) {
  const { t } = useI18n();
  const slaKey = ticket.priority === 'P1' ? 'confirmSlaP1'
    : ticket.priority === 'P2' ? 'confirmSlaP2'
    : 'confirmSlaDefault';
  return (
    <div style={{
      background: 'white', border: '1px solid var(--border)', borderRadius: 12,
      padding: '36px 32px 32px', display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', textAlign: 'center',
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'var(--success-50)', border: '1px solid var(--success-100)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name="check-circle" size={28} color="var(--success-700)" strokeWidth={2}/>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', width: '100%' }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em' }}>{t('newTicket.confirmTitle')}</h2>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--fg-secondary)', maxWidth: 400, lineHeight: 1.55 }}>
          {t('newTicket.confirmBody')}
        </p>

        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 10,
          marginTop: 4, padding: '14px 18px', borderRadius: 8,
          background: 'var(--ink-50)', border: '1px solid var(--ink-100)', width: '100%', maxWidth: 420,
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700,
            color: 'var(--accent-700)', letterSpacing: '0.02em',
          }}>{ticket.id}</span>
          {ticket.priority && <PriorityPill priority={ticket.priority}/>}
        </div>

        <p style={{
          margin: 0, fontSize: 12, color: 'var(--fg-muted)', maxWidth: 380, lineHeight: 1.5,
          padding: '10px 14px', borderRadius: 6, background: 'var(--accent-50)', border: '1px solid var(--accent-100)',
        }}>
          {t(`newTicket.${slaKey}`)}
        </p>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4, justifyContent: 'center' }}>
        <Button variant="secondary" size="md" onClick={onClose}>{t('newTicket.backHome')}</Button>
        {onViewTicket ? (
          <Button variant="primary" size="md" onClick={onViewTicket}>
            {t('newTicket.viewTicket')}
            <Icon name="chevron-right" size={14} color="white"/>
          </Button>
        ) : (
          <Button variant="primary" size="md" onClick={onClose}>{t('newTicket.seeMine')}</Button>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { NewTicket, StepConfirm });
