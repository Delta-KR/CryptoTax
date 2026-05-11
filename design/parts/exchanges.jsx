// Supported exchanges — uses real favicons
function Exchanges() {
  const exchanges = [
    { name: '업비트', sub: 'Upbit', logo: (window.__resources && window.__resources.fav_upbit) || 'https://www.google.com/s2/favicons?domain=upbit.com&sz=64', bg: '#EEF3FF', status: 'live' },
    { name: '빗썸', sub: 'Bithumb', logo: (window.__resources && window.__resources.fav_bithumb) || 'https://www.bithumb.com/favicon.ico', bg: '#FFF0ED', status: 'live' },
    { name: '바이낸스', sub: 'Binance', logo: (window.__resources && window.__resources.fav_binance) || 'https://bin.bnbstatic.com/static/images/common/favicon.ico', bg: '#FFFBEC', status: 'live' },
    { name: '바이빗', sub: 'Bybit', logo: (window.__resources && window.__resources.fav_bybit) || 'https://www.bybit.com/favicon.ico', bg: '#FFF7ED', status: 'soon' },
    { name: 'OKX', sub: 'OKX', logo: (window.__resources && window.__resources.fav_okx) || 'https://www.okx.com/favicon.ico', bg: '#F5F5F5', status: 'soon' },
    { name: 'Bitget', sub: 'Bitget', logo: (window.__resources && window.__resources.fav_bitget) || 'https://www.bitget.com/favicon.ico', bg: '#E6FAF8', status: 'soon' },
    { name: '코인원', sub: 'Coinone', logo: (window.__resources && window.__resources.fav_coinone) || 'https://www.google.com/s2/favicons?domain=coinone.co.kr&sz=64', bg: '#FFF0F8', status: 'soon' },
  ];
  const live = exchanges.filter(e => e.status === 'live');
  const soon = exchanges.filter(e => e.status === 'soon');

  return (
    <section id="exchanges" style={{ padding: '120px 32px', background: 'transparent' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <SectionEyebrow>SUPPORTED EXCHANGES</SectionEyebrow>
          <h2 style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 16 }}>
            국내외 주요 거래소 지원
          </h2>
          <p style={{ fontSize: 17, color: 'var(--muted)', maxWidth: 580, margin: '0 auto' }}>
            MVP 출시 시 3개 거래소. 매월 새 거래소가 추가됩니다.
          </p>
        </div>

        {/* Live */}
        <div style={{ marginBottom: 48 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
            justifyContent: 'center',
          }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
              padding: '4px 10px', background: 'var(--good-soft)',
              border: '1px solid #BBF7D0', borderRadius: 999,
              fontSize: 11.5, fontWeight: 700, color: 'var(--good)', letterSpacing: '0.04em',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--good)', boxShadow: '0 0 0 3px #BBF7D070' }}></span>
              LIVE
            </span>
            <span style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap' }}>지금 바로 사용 가능</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 800, margin: '0 auto' }}>
            {live.map(e => (
              <div key={e.name} className="hov" style={{
                background: 'var(--card)', borderRadius: 14,
                border: '1px solid var(--line)',
                boxShadow: 'var(--shadow-sm)',
                padding: '24px 20px',
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: e.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <img src={e.logo} alt={e.name}
                    style={{ width: 28, height: 28, objectFit: 'contain' }}
                    onError={(ev) => { ev.target.style.display = 'none'; }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{e.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{e.sub}</div>
                </div>
                <div style={{
                  width: 24, height: 24, borderRadius: 999,
                  background: 'var(--good-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M4 8L7 11L12 5" stroke="var(--good)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coming soon */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
            justifyContent: 'center',
          }}>
            <span style={{
              padding: '4px 10px', background: 'var(--warn-soft)', whiteSpace: 'nowrap',
              border: '1px solid #FDE68A', borderRadius: 999,
              fontSize: 11.5, fontWeight: 700, color: 'var(--warn)', letterSpacing: '0.04em',
            }}>COMING SOON</span>
            <span style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap' }}>2026년 7월 ~ 9월 순차 추가</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${soon.length}, 1fr)`, gap: 12, maxWidth: 880, margin: '0 auto' }}>
            {soon.map(e => (
              <div key={e.name} style={{
                background: 'var(--card)', borderRadius: 12,
                border: '1px dashed var(--line)',
                padding: '20px 12px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                opacity: 0.9,
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: e.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <img src={e.logo} alt={e.name}
                    style={{ width: 22, height: 22, objectFit: 'contain' }}
                    onError={(ev) => { ev.target.style.display = 'none'; }}
                  />
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{e.name}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--muted-2)', textAlign: 'center', marginTop: 24 }}>
            요청하시는 거래소가 있다면 <a style={{ color: 'var(--brand)', textDecoration: 'underline' }}>알려주세요</a> · 평균 2주 내 추가
          </p>
        </div>
      </div>
    </section>
  );
}

window.Exchanges = Exchanges;
