// Pricing
function Pricing() {
  const [annual, setAnnual] = React.useState(true);
  const tiers = [
    {
      name: '무료', tag: '체험용',
      price: '₩0', sub: '영구 무료',
      features: ['1개 거래소 연동', '연 100건 거래까지', '기본 세금 계산', 'PDF 리포트 1회'],
      cta: '무료로 시작', emphasis: false,
    },
    {
      name: '프리미엄', tag: '대부분의 투자자',
      price: annual ? '₩19,900' : '₩4,900',
      sub: annual ? '/ 년 (월 ₩1,650)' : '/ 월',
      saving: annual ? '연간 결제 시 66% 할인' : null,
      features: ['모든 거래소 무제한', '거래 무제한', '선입선출 / 이동평균법', '의제취득가액 자동', '세무사 전달용 PDF', '이메일 우선 지원'],
      cta: '프리미엄 시작', emphasis: true,
    },
    {
      name: '원타임', tag: '5월 신고 시즌',
      price: '₩29,900', sub: '신고 시즌 1회',
      features: ['프리미엄 기능 전체', '5월 ~ 6월 30일간', '단 한 번의 정산', '구독 부담 없음'],
      cta: '신고 시즌 구매', emphasis: false,
    },
  ];

  return (
    <section id="pricing" style={{ padding: '120px 32px', background: 'transparent' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <SectionEyebrow>PRICING</SectionEyebrow>
          <h2 style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 16 }}>
            합리적인 요금제
          </h2>
          <p style={{ fontSize: 17, color: 'var(--muted)', maxWidth: 580, margin: '0 auto' }}>
            세금 한 번 신고하는 데 들이는 시간을 생각하면, 커피 4잔 값.
          </p>
        </div>

        {/* Billing toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 40 }}>
          <div style={{
            display: 'inline-flex', padding: 4,
            background: 'var(--card)', border: '1px solid var(--line)',
            borderRadius: 999, gap: 4,
          }}>
            {[['monthly', '월간'], ['annual', '연간']].map(([k, lbl]) => (
              <button
                key={k}
                onClick={() => setAnnual(k === 'annual')}
                style={{
                  padding: '8px 18px', fontSize: 13, fontWeight: 600,
                  border: 0, borderRadius: 999,
                  background: (annual && k === 'annual') || (!annual && k === 'monthly') ? 'var(--ink)' : 'transparent',
                  color: (annual && k === 'annual') || (!annual && k === 'monthly') ? '#fff' : 'var(--muted)',
                }}>
                {lbl}{k === 'annual' && (
                  <span style={{
                    marginLeft: 6, fontSize: 10, fontWeight: 700,
                    color: '#10B981', background: 'rgba(16,185,129,0.15)',
                    padding: '2px 6px', borderRadius: 999,
                  }}>−66%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 1080, margin: '0 auto' }}>
          {tiers.map(t => <PricingCard key={t.name} {...t} />)}
        </div>

        <p style={{ fontSize: 12.5, color: 'var(--muted-2)', textAlign: 'center', marginTop: 32 }}>
          모든 요금제 14일 무료 체험 · 언제든 해지 가능 · 환불 보장
        </p>
      </div>
    </section>
  );
}

function PricingCard({ name, tag, price, sub, saving, features, cta, emphasis }) {
  return (
    <div className="hov" style={{
      background: emphasis ? 'linear-gradient(165deg, #1E3A8A 0%, #0F1B3D 100%)' : 'var(--card)',
      color: emphasis ? '#fff' : 'var(--ink)',
      borderRadius: 18,
      border: emphasis ? '1px solid #1E3A8A' : '1px solid var(--line)',
      boxShadow: emphasis ? '0 24px 48px -12px rgba(30,58,138,0.45)' : 'var(--shadow-sm)',
      padding: 32,
      transform: emphasis ? 'translateY(-12px)' : 'none',
    }}>
      {emphasis && (
        <div style={{
          position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
          padding: '5px 14px', background: 'var(--brand)', color: '#fff',
          fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
          borderRadius: 999, boxShadow: '0 4px 12px rgba(37,99,235,0.4)',
        }}>BEST VALUE</div>
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: emphasis ? 'rgba(255,255,255,0.6)' : 'var(--muted-2)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 4 }}>
          {tag.toUpperCase()}
        </div>
        <h3 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>{name}</h3>
      </div>

      <div style={{ marginBottom: 24, paddingBottom: 24, borderBottom: emphasis ? '1px solid rgba(255,255,255,0.12)' : '1px solid var(--line-2)' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span className="num" style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>{price}</span>
          <span style={{ fontSize: 13, color: emphasis ? 'rgba(255,255,255,0.7)' : 'var(--muted)' }}>{sub}</span>
        </div>
        {saving && (
          <div style={{ fontSize: 12, color: emphasis ? '#6EE7B7' : 'var(--good)', fontWeight: 600, marginTop: 6 }}>
            ✓ {saving}
          </div>
        )}
      </div>

      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        {features.map(f => (
          <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
              <circle cx="8" cy="8" r="8" fill={emphasis ? 'rgba(255,255,255,0.15)' : 'var(--brand-soft)'}/>
              <path d="M5 8L7 10L11 6" stroke={emphasis ? '#fff' : 'var(--brand)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ color: emphasis ? 'rgba(255,255,255,0.92)' : 'var(--ink-2)' }}>{f}</span>
          </li>
        ))}
      </ul>

      <button style={{
        width: '100%', padding: '14px 18px',
        fontSize: 14, fontWeight: 700, letterSpacing: '-0.005em',
        borderRadius: 10, border: 0,
        background: emphasis ? '#fff' : 'var(--card)',
        color: emphasis ? '#1E3A8A' : 'var(--ink)',
        boxShadow: emphasis ? '0 4px 12px rgba(0,0,0,0.2)' : 'inset 0 0 0 1px var(--line)',
        cursor: 'pointer',
      }}>{cta}</button>
    </div>
  );
}

window.Pricing = Pricing;
