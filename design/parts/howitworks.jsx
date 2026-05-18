// How it works section
function HowItWorks() {
  const steps = [
    {
      n: 1, title: '거래내역 업로드',
      desc: '거래소에서 다운받은 PDF · XLS · CSV 파일을 그대로 끌어다 놓으세요. 파일 형식은 자동 인식됩니다.',
      tone: '#2563EB', soft: '#EEF4FF',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M12 16V4M12 4l-4 4M12 4l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      n: 2, title: '한국 세법 기준 자동 계산',
      desc: '선입선출법·이동평균법 선택, 의제취득가액 자동 적용, 코인 간 교환 처리, 환율 변환까지 한 번에.',
      tone: '#7C3AED', soft: '#F5F3FF',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="3" width="16" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
          <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      n: 3, title: 'PDF 리포트 다운로드',
      desc: '종합소득세 신고 항목별로 정리된 리포트. 세무사에게 그대로 전달하거나 홈택스에 직접 입력하세요.',
      tone: '#16A34A', soft: '#ECFDF5',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M14 3v5h5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
          <path d="M9 14l3 3 3-3M12 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ];
  return (
    <section id="how" style={{ padding: '120px 32px', background: 'transparent' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <SectionEyebrow>HOW IT WORKS</SectionEyebrow>
          <h2 style={{
            fontSize: 44, fontWeight: 800, lineHeight: 1.15,
            letterSpacing: '-0.03em', marginBottom: 16,
          }}>단 3단계, <span style={{ color: 'var(--brand)' }}>약 2분</span>이면 끝납니다</h2>
          <p style={{ fontSize: 17, color: 'var(--muted)', maxWidth: 540, margin: '0 auto' }}>
            복잡한 계산은 Kontaxt가 대신 합니다. 당신은 파일만 올리세요.
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr',
          alignItems: 'stretch', gap: 0,
        }}>
          {steps.map((s, i) => (
            <React.Fragment key={s.n}>
              <div className="hov" style={{
                background: 'var(--card)', borderRadius: 18,
                padding: '36px 28px 32px',
                border: '1px solid var(--line)',
                boxShadow: 'var(--shadow-sm)',
                position: 'relative',
                display: 'flex', flexDirection: 'column',
              }}>
                {/* Big step numeral — primary ordering cue */}
                <div className="num" style={{
                  position: 'absolute', top: 18, right: 24,
                  fontSize: 64, fontWeight: 800,
                  letterSpacing: '-0.04em', lineHeight: 1,
                  color: s.tone, opacity: 0.7,
                  pointerEvents: 'none',
                }}>0{s.n}</div>

                {/* Step pill */}
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  alignSelf: 'flex-start',
                  padding: '4px 10px', marginBottom: 22,
                  background: s.soft, color: s.tone,
                  borderRadius: 999,
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                  whiteSpace: 'nowrap',
                }}>
                  <span className="num">STEP 0{s.n}</span>
                </div>

                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: s.soft, color: s.tone,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 18,
                }}>{s.icon}</div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.015em' }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7 }}>{s.desc}</p>
              </div>

              {/* Arrow between cards */}
              {i < steps.length - 1 && (
                <div aria-hidden style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 56, color: 'var(--muted-2)',
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                    <path d="M6 12h12m0 0l-5-5m5 5l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

window.HowItWorks = HowItWorks;
