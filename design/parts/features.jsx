// Features
function Features() {
  const big = {
    title: '다중 거래소 데이터 통합',
    desc: '국내외 어떤 거래소든 파일만 올리면 자동으로 형식을 통일하고 시간순 병합. 같은 코인 다른 거래소 입출금도 추적합니다.',
    color: '#2563EB', soft: '#EEF4FF'
  };
  const items = [
  {
    title: '계산 방식 선택',
    desc: '선입선출법(FIFO) 또는 이동평균법(MA). 동일 거래에서 어느 쪽이 유리한지 즉시 비교해드립니다.',
    color: '#7C3AED', soft: '#F5F3FF',
    icon: 'compare'
  },
  {
    title: '의제취득가액 자동 적용',
    desc: '2026년 12월 31일 이전 보유분은 시가 자동 조회 → 실제 매수가와 큰 금액으로 적용해 세금을 줄여드립니다.',
    color: '#0891B2', soft: '#ECFEFF',
    icon: 'shield'
  },
  {
    title: '해외 거래 환율 변환',
    desc: '바이낸스 등 USDT 거래는 거래 시점 KRW 환율로 자동 변환. 한국은행 고시 환율 기준으로 정확하게.',
    color: '#16A34A', soft: '#ECFDF5',
    icon: 'globe'
  },
  {
    title: '세무사 전달용 PDF',
    desc: '종합소득세 신고서 양식에 맞춘 항목별 정리 PDF. 거래 원본 + 계산 근거 + 산출 내역까지 포함.',
    color: '#D97706', soft: '#FFFBEB',
    icon: 'doc'
  }];

  return (
    <section id="features" style={{ padding: '120px 32px', background: 'transparent' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <SectionEyebrow>FEATURES</SectionEyebrow>
          <h2 style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 16 }}>
            한국 세법, 빠짐없이 반영
          </h2>
          <p style={{ fontSize: 17, color: 'var(--muted)', maxWidth: 580, margin: '0 auto' }}>
            세무사가 검수하고, 개발자가 만든 계산 엔진. 누락 없이 정확하게.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr 1fr',
          gridTemplateRows: 'auto auto',
          gap: 16
        }}>
          {/* Big card */}
          <FeatureBig {...big} />
          <FeatureCard {...items[0]} />
          <FeatureCard {...items[1]} />
          <FeatureCard {...items[2]} />
          <FeatureCard {...items[3]} />
        </div>
      </div>
    </section>);

}

function FeatureIcon({ name, color }) {
  const common = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
  switch (name) {
    case 'compare':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24"><path d="M5 7h12M5 7l3-3M5 7l3 3M19 17H7M19 17l-3 3M19 17l-3-3" {...common} /></svg>);

    case 'shield':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 3l8 3v6c0 4-3.5 7.5-8 9-4.5-1.5-8-5-8-9V6l8-3z" {...common} /><path d="M9 12l2 2 4-4" {...common} /></svg>);

    case 'globe':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" {...common} /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" {...common} /></svg>);

    case 'swap':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24"><path d="M7 7h12m0 0l-3-3m3 3l-3 3M17 17H5m0 0l3 3m-3-3l3-3" {...common} /></svg>);

    case 'doc':
      return (
        <svg width="22" height="22" viewBox="0 0 24 24"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" {...common} /><path d="M14 3v5h5M9 13h6M9 17h4" {...common} /></svg>);

    default:return null;
  }
}

function FeatureBig({ title, desc, color, soft }) {
  return (
    <div className="hov" style={{
      gridRow: 'span 2',
      background: `linear-gradient(160deg, color-mix(in srgb, ${color} 8%, var(--card)) 0%, var(--card) 60%)`,
      border: `1px solid ${color}25`,
      borderRadius: 16,
      padding: 32,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      minHeight: 380,
      overflow: 'hidden'
    }}>
      <div>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'var(--card)', border: `1px solid ${color}30`,
          color, display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24, boxShadow: 'var(--shadow-sm)'
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 17l4-4 4 4 7-7M21 7v4M21 7h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em' }}>{title}</h3>
        <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 360 }}>{desc}</p>
      </div>

      {/* Visual */}
      <div style={{
        marginTop: 24,
        background: 'var(--card)', borderRadius: 12,
        border: '1px solid var(--line)', padding: '14px 16px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ fontSize: 11, color: 'var(--muted-2)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 10 }}>통합된 거래 — 247건</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
          ['업비트', '#0E48F0', 124],
          ['빗썸', '#F37321', 78],
          ['바이낸스', '#F0B90B', 45]].
          map(([n, c, v]) =>
          <div key={n} style={{
            flex: 1, minWidth: 0,
            background: 'var(--bg-soft)', borderRadius: 8,
            padding: '10px 12px',
            borderLeft: `3px solid ${c}`
          }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500 }}>{n}</div>
              <div className="num" style={{ fontSize: 16, fontWeight: 700 }}>{v}<span style={{ fontSize: 10, fontWeight: 500, color: 'var(--muted-2)', marginLeft: 2 }}>건</span></div>
            </div>
          )}
        </div>
      </div>
    </div>);

}

function FeatureCard({ title, desc, color, soft, icon }) {
  return (
    <div className="hov" style={{
      background: 'var(--card)', borderRadius: 16,
      border: '1px solid var(--line)',
      padding: 24
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: `color-mix(in srgb, ${color} 12%, var(--card))`, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 16
      }}>
        <FeatureIcon name={icon} color={color} />
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, letterSpacing: '-0.015em' }}>{title}</h3>
      <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{desc}</p>
    </div>);

}

window.Features = Features;