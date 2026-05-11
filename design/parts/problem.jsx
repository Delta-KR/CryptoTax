// Problem section: CSV format comparison
function Problem() {
  const [active, setActive] = React.useState('upbit');
  return (
    <section id="problem" style={{ padding: '120px 32px', background: 'transparent' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <SectionEyebrow>PROBLEM</SectionEyebrow>
        <SectionTitle>같은 BTC 매수인데, 거래소마다<br /><span style={{ color: 'var(--muted)' }}>형식이 전부 다릅니다</span></SectionTitle>
        <SectionLead>
          한국 투자자 평균 2.4개 거래소 사용. 파일 형식·날짜·통화 단위가 모두 달라<br />
          엑셀로 합치는 데만 반나절이 걸립니다.
        </SectionLead>

        <div style={{
          marginTop: 56,
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16,
        }}>
          <CSVCard
            exchange="업비트"
            logo={(window.__resources && window.__resources.fav_upbit) || "https://www.google.com/s2/favicons?domain=upbit.com&sz=64"}
            color="#0E48F0"
            format="PDF"
            highlight={active === 'upbit'}
            onHover={() => setActive('upbit')}
            rows={[
              ['체결시간', '2027.01.15 09:32:11'],
              ['마켓', 'KRW-BTC'],
              ['종류', '매수'],
              ['거래수량', '0.005'],
              ['거래단가', '85,000,000'],
              ['거래금액', '425,000 KRW'],
              ['수수료(0.05%)', '213 KRW'],
              ['정산금액', '425,213 KRW'],
              ['주문시간', '2027.01.15 09:32:09'],
            ]}
            quirks={['PDF 전용', '점 구분 날짜', '체결·주문시간 2개']}
          />
          <CSVCard
            exchange="빗썸"
            logo={(window.__resources && window.__resources.fav_bithumb) || "https://www.bithumb.com/favicon.ico"}
            color="#F37321"
            format="XLS"
            highlight={active === 'bithumb'}
            onHover={() => setActive('bithumb')}
            rows={[
              ['거래일시', '2027/01/15 18:32'],
              ['주문구분', '매수'],
              ['코인명', 'BTC'],
              ['거래수량', '0.005'],
              ['체결가격', '85,000,000'],
              ['거래금액', '425,000 원'],
              ['수수료(0.04%)', '170 원'],
              ['결제금액', '425,170 원'],
              ['정산구분', '원화 마켓'],
            ]}
            quirks={['슬래시 날짜', '컬럼명 다름', '쿠폰 적용 수수료']}
          />
          <CSVCard
            exchange="바이낸스"
            logo={(window.__resources && window.__resources.fav_binance) || "https://bin.bnbstatic.com/static/images/common/favicon.ico"}
            color="#F0B90B"
            ink="#1E2329"
            format="CSV"
            highlight={active === 'binance'}
            onHover={() => setActive('binance')}
            rows={[
              ['Date(UTC)', '2027-01-15 00:32'],
              ['Pair', 'BTCUSDT'],
              ['Side', 'BUY'],
              ['Order Type', 'LIMIT'],
              ['Price', '62,450'],
              ['Executed', '0.005 BTC'],
              ['Amount', '312.25 USDT'],
              ['Fee(0.1%)', '0.31 USDT'],
              ['Fee Coin', 'USDT'],
            ]}
            quirks={['UTC 시간', 'Spot/Futures 분리', 'Fee Coin 별도']}
          />
        </div>

        {/* Reconciliation diagram */}
        <div style={{
          marginTop: 32,
          background: 'linear-gradient(135deg, color-mix(in srgb, var(--brand) 8%, var(--card)) 0%, var(--card) 50%, color-mix(in srgb, #8B5CF6 8%, var(--card)) 100%)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          padding: '32px 40px',
          display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr',
          alignItems: 'center', gap: 24,
        }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Pill tone="bad">PDF · KRW · 한글</Pill>
            <Pill tone="bad">XLS · 원 · 한글</Pill>
            <Pill tone="bad">CSV · USDT · UTC</Pill>
          </div>
          <ArrowRight />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, whiteSpace: 'nowrap' }}>크립토택스가 통일</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap' }}>한국 세법 표준 포맷</div>
            </div>
          </div>
          <ArrowRight />
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{
              padding: '10px 28px', background: 'var(--good-soft)',
              border: '1px solid #BBF7D0', borderRadius: 10,
              minWidth: 140, textAlign: 'center',
            }}>
              <div style={{ fontSize: 11, color: 'var(--good)', fontWeight: 600, marginBottom: 2, whiteSpace: 'nowrap' }}>처리 시간</div>
              <div className="num" style={{ fontSize: 18, fontWeight: 800, color: 'var(--good)' }}>3초</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CSVCard({ exchange, logo, color, ink, format, rows, quirks, highlight, onHover }) {
  return (
    <div
      onMouseEnter={onHover}
      className="hov"
      style={{
        background: 'var(--card)',
        border: highlight ? `1px solid ${color}` : '1px solid var(--line)',
        boxShadow: highlight ? `0 0 0 4px ${color}15, var(--shadow-md)` : 'var(--shadow-sm)',
        borderRadius: 14,
        overflow: 'hidden',
      }}>
      <div style={{
        padding: '14px 18px',
        background: color,
        color: ink || '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, overflow: 'hidden',
          }}>
            {logo ? (
              <img src={logo} alt={exchange}
                style={{ width: 16, height: 16, objectFit: 'contain' }}
                onError={(ev) => { ev.target.style.display = 'none'; }}
              />
            ) : (
              <span style={{ fontWeight: 800, fontSize: 12, color: ink || color }}>{exchange[0]}</span>
            )}
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{exchange}</span>
        </div>
        <span className="mono" style={{
          fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
          padding: '3px 8px', borderRadius: 999,
          background: 'rgba(0,0,0,0.18)',
          color: ink || '#fff',
        }}>.{format.toLowerCase()}</span>
      </div>
      <div style={{ padding: 16 }}>
        <div className="mono" style={{
          fontSize: 11, color: 'var(--muted-2)', marginBottom: 8,
          letterSpacing: '0.04em', textTransform: 'uppercase',
        }}># BTC 0.005 매수 · 425,212원</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
          <tbody>
            {rows.map(([k, v], i) => (
              <tr key={i} style={{ borderBottom: i === rows.length - 1 ? 'none' : '1px solid var(--line-2)' }}>
                <td className="mono" style={{ padding: '7px 0', color: 'var(--muted)', fontWeight: 500 }}>{k}</td>
                <td className="mono num" style={{ padding: '7px 0', textAlign: 'right', color: 'var(--ink)', fontWeight: 500 }}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{
        padding: '10px 16px', background: 'var(--bg-soft)',
        borderTop: '1px solid var(--line-2)',
        display: 'flex', flexWrap: 'wrap', gap: 6,
      }}>
        {quirks.map(q => (
          <span key={q} style={{
            fontSize: 10.5, fontWeight: 500, color: 'var(--muted)',
            padding: '3px 8px', background: 'var(--card)', whiteSpace: 'nowrap',
            border: '1px solid var(--line-2)', borderRadius: 999,
          }}>{q}</span>
        ))}
      </div>
    </div>
  );
}

function Pill({ children, tone }) {
  const c = tone === 'bad' ? { bg: '#FEF2F2', border: '#FECACA', text: '#B91C1C' } : { bg: 'var(--bg-soft)', border: 'var(--line)', text: 'var(--ink-2)' };
  return (
    <span className="mono" style={{
      padding: '8px 12px', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap',
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      borderRadius: 8,
    }}>{children}</span>
  );
}

function ArrowRight() {
  return (
    <svg width="32" height="14" viewBox="0 0 32 14" fill="none" style={{ flexShrink: 0 }}>
      <path d="M2 7h26m0 0l-6-5m6 5l-6 5" stroke="var(--muted-2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function SectionEyebrow({ children }) {
  return (
    <div style={{
      fontSize: 12, fontWeight: 700, letterSpacing: '0.18em',
      color: 'var(--brand)', marginBottom: 14,
    }}>{children}</div>
  );
}
function SectionTitle({ children }) {
  return (
    <h2 style={{
      fontSize: 44, fontWeight: 800, lineHeight: 1.18,
      letterSpacing: '-0.03em', color: 'var(--ink)',
      maxWidth: 760,
    }}>{children}</h2>
  );
}
function SectionLead({ children }) {
  return (
    <p style={{
      fontSize: 17, color: 'var(--muted)', marginTop: 18,
      lineHeight: 1.6, maxWidth: 620,
    }}>{children}</p>
  );
}

window.Problem = Problem;
window.SectionEyebrow = SectionEyebrow;
window.SectionTitle = SectionTitle;
window.SectionLead = SectionLead;
