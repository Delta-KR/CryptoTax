// CTA section — pronounced glass card on top of vivid glow
function CTA() {
  return (
    <section style={{
      padding: '120px 32px',
      background: 'transparent',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Vivid glow blobs behind the glass card */}
      <div aria-hidden style={{
        position: 'absolute', top: '10%', left: '15%',
        width: 520, height: 520,
        background: 'radial-gradient(closest-side, color-mix(in srgb, var(--brand) 55%, transparent), transparent 70%)',
        filter: 'blur(70px)', pointerEvents: 'none', zIndex: 0
      }}></div>
      <div aria-hidden style={{
        position: 'absolute', bottom: '5%', right: '12%',
        width: 480, height: 480,
        background: 'radial-gradient(closest-side, color-mix(in srgb, #8B5CF6 50%, transparent), transparent 70%)',
        filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0
      }}></div>
      <div aria-hidden style={{
        position: 'absolute', top: '40%', left: '50%',
        width: 380, height: 380, transform: 'translateX(-50%)',
        background: 'radial-gradient(closest-side, color-mix(in srgb, #06B6D4 40%, transparent), transparent 70%)',
        filter: 'blur(70px)', pointerEvents: 'none', zIndex: 0
      }}></div>

      {/* Notebook ruling — horizontal + vertical lines with linear fade top→bottom */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(color-mix(in srgb, var(--brand) 22%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--brand) 22%, transparent) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        backgroundPosition: '0 0',
        maskImage: 'linear-gradient(to bottom, transparent 0%, black 35%, black 65%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 35%, black 65%, transparent 100%)',
        opacity: 0.55, zIndex: 0
      }}></div>

      {/* Glass card */}
      <div style={{
        maxWidth: 880, margin: '0 auto',
        position: 'relative', zIndex: 1,
        padding: '64px 56px',
        borderRadius: 28,
        background: 'linear-gradient(160deg, color-mix(in srgb, var(--card) 55%, transparent) 0%, color-mix(in srgb, var(--card) 35%, transparent) 100%)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        border: '1px solid color-mix(in srgb, var(--ink) 12%, transparent)',
        boxShadow: '0 1px 0 color-mix(in srgb, #fff 35%, transparent) inset, 0 30px 80px -20px rgba(15,23,42,0.25), 0 0 0 1px color-mix(in srgb, #fff 8%, transparent) inset',
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 14px', marginBottom: 24,
          background: 'color-mix(in srgb, var(--brand) 14%, transparent)',
          border: '1px solid color-mix(in srgb, var(--brand) 28%, transparent)',
          borderRadius: 999, fontSize: 12, fontWeight: 600, color: 'var(--brand)',
          letterSpacing: '0.02em', whiteSpace: 'nowrap'
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: 999, background: 'var(--brand)',
            boxShadow: '0 0 0 4px rgba(37,99,235,0.25)'
          }}></span>
          첫 신고까지 D-237
        </div>

        <h2 style={{
          fontSize: 56, fontWeight: 800, lineHeight: 1.12,
          letterSpacing: '-0.035em', marginBottom: 20, color: 'var(--ink)'
        }}>
          지금 무료로<br />
          <span style={{
            background: 'linear-gradient(120deg, var(--brand) 0%, #7C3AED 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>시작하세요</span>
        </h2>
        <p style={{ fontSize: 17, color: 'var(--muted)', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.6 }}>
          신용카드 없이 1분 가입. 거래 100건까지 영구 무료.<br />
          첫 결과를 받아본 뒤 결정해도 늦지 않습니다.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          <button style={{
            background: 'var(--brand)', color: '#fff', border: 0,
            padding: '15px 28px', fontSize: 15, fontWeight: 700,
            borderRadius: 10, letterSpacing: '-0.005em',
            display: 'inline-flex', alignItems: 'center', gap: 8,
            boxShadow: '0 8px 24px -8px rgba(37,99,235,0.6)',
            cursor: 'pointer'
          }}>
            무료로 시작하기
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button style={{
            background: 'color-mix(in srgb, var(--card) 50%, transparent)',
            color: 'var(--ink)',
            border: '1px solid color-mix(in srgb, var(--ink) 14%, transparent)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            padding: '14px 24px', fontSize: 15, fontWeight: 500,
            borderRadius: 10, letterSpacing: '-0.005em',
            cursor: 'pointer'
          }}>요금제 비교</button>
        </div>

        {/* Stats strip */}
        <div style={{
          marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 0, padding: '24px 0',
          borderTop: '1px solid color-mix(in srgb, var(--ink) 10%, transparent)',
          borderBottom: '1px solid color-mix(in srgb, var(--ink) 10%, transparent)'
        }}>
          <Stat2 num="1,550만" label="한국 가상자산 투자자" />
          <Stat2 num="22%" label="양도소득세율" sub="소득세 20% + 지방세 2%" border />
          <Stat2 num="250만원" label="기본공제" sub="연 1회 자동 적용" />
        </div>
      </div>
    </section>);

}

function Stat2({ num, label, sub, border }) {
  return (
    <div style={{
      textAlign: 'center', padding: '4px 24px',
      borderLeft: border ? '1px solid color-mix(in srgb, var(--ink) 10%, transparent)' : 'none',
      borderRight: border ? '1px solid color-mix(in srgb, var(--ink) 10%, transparent)' : 'none'
    }}>
      <div className="num" style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--ink)' }}>{num}</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 2, whiteSpace: 'nowrap' }}>{sub}</div>}
    </div>);

}

window.CTA = CTA;
