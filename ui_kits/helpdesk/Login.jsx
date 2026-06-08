// Login — Microsoft tenant sign-in gate (PMG)

function Login({ onSignIn }) {
  const { t, lang } = useI18n();
  const [step, setStep] = React.useState('idle'); // idle | picker | signing
  const [hoverMS, setHoverMS] = React.useState(false);
  const tags = STRINGS[lang]?.login?.tags || STRINGS.en.login.tags;

  const start = () => setStep('picker');
  const pick = () => {
    setStep('signing');
    setTimeout(() => onSignIn({ id:'me', name:'You', email:'you@pmg.com' }), 900);
  };

  return (
    <div style={{
      minHeight:'100vh', width:'100%',
      background:'var(--ink-0)', display:'flex', alignItems:'stretch',
      fontFamily:'var(--font-sans)',
    }}>
      {/* Left — brand panel */}
      <div style={{
        flex:'0 0 44%', background:'var(--ink-900)', color:'white',
        padding:'48px 56px', display:'flex', flexDirection:'column', justifyContent:'space-between',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <img src="../../assets/logo-pmg-mark-white.png" style={{height:24, display:'block'}}/>
          <span style={{fontSize:12, color:'rgba(255,255,255,0.5)', letterSpacing:'0.06em', textTransform:'uppercase'}}>{t('login.helpdesk')}</span>
        </div>

        <div style={{display:'flex', flexDirection:'column', gap:18, maxWidth:380, position:'relative', zIndex:1}}>
          <h1 style={{margin:0, fontSize:38, lineHeight:1.15, letterSpacing:'-0.02em', fontWeight:700, display:'flex', flexDirection:'column'}}>
            <span>{t('login.headline1')}</span>
            <span style={{color:'var(--accent-300)'}}>{t('login.headline2')}</span>
          </h1>
          <p style={{margin:0, fontSize:15, lineHeight:1.55, color:'rgba(255,255,255,0.7)'}}>
            {t('login.intro')}
          </p>
        </div>

        <div style={{display:'flex', flexDirection:'column', gap:6, position:'relative', zIndex:1}}>
          <span style={{fontSize:11, color:'rgba(255,255,255,0.45)', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600}}>{t('login.whatLivesHere')}</span>
          <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
            {tags.map(tag => (
              <span key={tag} style={{
                fontSize:12, padding:'4px 10px', border:'1px solid rgba(255,255,255,0.15)',
                borderRadius:999, color:'rgba(255,255,255,0.85)',
              }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Decorative gridded plus */}
        <svg style={{position:'absolute', right:-40, bottom:-40, opacity:0.06, pointerEvents:'none'}} width="320" height="320" viewBox="0 0 100 100">
          <path d="M40 0h20v40h40v20H60v40H40V60H0V40h40z" fill="white"/>
        </svg>
      </div>

      {/* Right — sign-in panel */}
      <div style={{
        flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:48,
        background:'var(--ink-50)',
      }}>
        <div style={{width:'100%', maxWidth:380, display:'flex', flexDirection:'column', gap:24}}>
          <div style={{display:'flex', flexDirection:'column', gap:6}}>
            <h2 style={{margin:0, fontSize:24, fontWeight:700, letterSpacing:'-0.02em', color:'var(--fg)'}}>{t('login.signIn')}</h2>
            <p style={{margin:0, fontSize:14, color:'var(--fg-secondary)', lineHeight:1.5}}>{t('login.signInHint')}</p>
          </div>

          {/* Microsoft button */}
          <button
            onClick={start}
            onMouseEnter={()=>setHoverMS(true)}
            onMouseLeave={()=>setHoverMS(false)}
            style={{
              fontFamily:'inherit', fontSize:14, fontWeight:600,
              padding:'14px 16px', borderRadius:6,
              border:'1px solid ' + (hoverMS ? 'var(--ink-900)' : 'var(--border-strong)'),
              background:'white', color:'var(--ink-900)',
              cursor:'pointer', display:'flex', alignItems:'center', gap:12,
              transition:'all 120ms var(--ease-out)',
              boxShadow: hoverMS ? '0 1px 2px rgba(11,13,16,0.06)' : 'none',
            }}>
            <MicrosoftLogo size={18}/>
            <span style={{flex:1, textAlign:'left'}}>{t('login.signInMicrosoft')}</span>
            <Icon name="chevron-right" size={14} color="var(--fg-muted)"/>
          </button>

          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div style={{flex:1, height:1, background:'var(--border)'}}/>
            <span style={{fontSize:11, color:'var(--fg-muted)', letterSpacing:'0.06em', textTransform:'uppercase', fontWeight:600}}>{t('login.tenantOnly')}</span>
            <div style={{flex:1, height:1, background:'var(--border)'}}/>
          </div>

          <div style={{
            background:'white', border:'1px solid var(--border)', borderRadius:8,
            padding:'12px 14px', display:'flex', alignItems:'center', gap:10,
            fontSize:12, color:'var(--fg-secondary)', lineHeight:1.5,
          }}>
            <Icon name="key" size={14} color="var(--accent-700)"/>
            <span>{t('login.tenantRestricted')}</span>
          </div>

          <div style={{display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--fg-muted)'}}>
            <a style={{color:'var(--accent-700)', cursor:'pointer'}}>{t('login.trouble')}</a>
            <span>v2.1.0</span>
          </div>
        </div>
      </div>

      {/* Account picker modal */}
      {step !== 'idle' && (
        <div style={{
          position:'fixed', inset:0, background:'rgba(11,13,16,0.40)',
          display:'flex', alignItems:'center', justifyContent:'center', zIndex:100,
          animation:'fadeIn 160ms var(--ease-out)',
        }} onClick={() => step === 'picker' && setStep('idle')}>
          <div onClick={e => e.stopPropagation()} style={{
            width:'100%', maxWidth:420, background:'white',
            borderRadius:4, boxShadow:'0 12px 32px rgba(11,13,16,0.18)',
            padding:'32px 28px 24px', display:'flex', flexDirection:'column', gap:20,
            animation:'popIn 200ms var(--ease-out)',
          }}>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <MicrosoftLogo size={22}/>
              <span style={{fontSize:13, fontWeight:600, color:'#5E5E5E', letterSpacing:'-0.01em'}}>Microsoft</span>
            </div>

            {step === 'picker' && (
              <>
                <div style={{display:'flex', flexDirection:'column', gap:4}}>
                  <h3 style={{margin:0, fontSize:22, fontWeight:600, color:'#1A1A1A', letterSpacing:'-0.01em'}}>{t('login.pickAccount')}</h3>
                </div>
                <div style={{display:'flex', flexDirection:'column', gap:0, marginTop:-4}}>
                  <AccountRow email="you@pmg.com" tenant="PMG · Pharmacy Group" onClick={pick}/>
                  <AccountRow email={t('login.useAnother')} tenant="" isOther onClick={pick}/>
                </div>
              </>
            )}

            {step === 'signing' && (
              <>
                <div style={{display:'flex', flexDirection:'column', gap:6}}>
                  <h3 style={{margin:0, fontSize:22, fontWeight:600, color:'#1A1A1A', letterSpacing:'-0.01em'}}>{t('login.signingIn')}</h3>
                  <p style={{margin:0, fontSize:13, color:'#5E5E5E'}}>you@pmg.com</p>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:10, padding:'10px 0'}}>
                  <Spinner/>
                  <span style={{fontSize:13, color:'#5E5E5E'}}>{t('login.checkingAccess')}</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function MicrosoftLogo({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 23 23" style={{flexShrink:0}}>
      <rect x="1"  y="1"  width="10" height="10" fill="#F25022"/>
      <rect x="12" y="1"  width="10" height="10" fill="#7FBA00"/>
      <rect x="1"  y="12" width="10" height="10" fill="#00A4EF"/>
      <rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
    </svg>
  );
}

function AccountRow({ email, tenant, isOther, onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <div onClick={onClick} onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        display:'flex', alignItems:'center', gap:12, padding:'10px 4px',
        cursor:'pointer', borderBottom:'1px solid #EBEBEB',
        background: hover ? '#F4F4F4' : 'transparent',
      }}>
      {isOther ? (
        <div style={{
          width:34, height:34, borderRadius:'50%', background:'#EBEBEB',
          display:'flex', alignItems:'center', justifyContent:'center', color:'#5E5E5E',
        }}>
          <Icon name="user-plus" size={16}/>
        </div>
      ) : (
        <div style={{
          width:34, height:34, borderRadius:'50%',
          background:'var(--accent-600)',
          color:'white', display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:13, fontWeight:600,
        }}>YO</div>
      )}
      <div style={{flex:1, display:'flex', flexDirection:'column', minWidth:0, lineHeight:1.25}}>
        <span style={{fontSize:14, color:'#1A1A1A', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{email}</span>
        {tenant && <span style={{fontSize:12, color:'#5E5E5E'}}>{tenant}</span>}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{
      width:16, height:16, borderRadius:'50%',
      border:'2px solid #E5E5E5', borderTopColor:'#1660CF',
      animation:'spin 700ms linear infinite',
    }}/>
  );
}

Object.assign(window, { Login, MicrosoftLogo });
