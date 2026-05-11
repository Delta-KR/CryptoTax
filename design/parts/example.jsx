// Tax calculation example — interactive
function Example() {
  const [method, setMethod] = React.useState('fifo');
  const items = [
    { coin: 'BTC', name: '비트코인', buy: 3000, sell: 5000, color: '#F7931A' },
    { coin: 'ETH', name: '이더리움', buy: 1000, sell: 700, color: '#627EEA' },
    { coin: 'SOL', name: '솔라나', buy: 500, sell: 800, color: '#9945FF' },
  ];
  const totalGain = items.reduce((s, i) => s + (i.sell - i.buy), 0);
  const taxable = Math.max(0, totalGain - 250);
  const tax = Math.round(taxable * 0.22);

  return (
    <section style={{ padding: '120px 32px', background: 'transparent', position: 'relative' }}>
      <div aria-hidden style={{
        position: 'absolute', top: '20%', left: '-10%',
        width: 500, height: 500,
        background: 'radial-gradient(closest-side, color-mix(in srgb, var(--brand) 20%, transparent), transparent 70%)',
        filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0,
      }}></div>
      <div aria-hidden style={{
        position: 'absolute', bottom: '10%', right: '-8%',
        width: 480, height: 480,
        background: 'radial-gradient(closest-side, color-mix(in srgb, #8B5CF6 18%, transparent), transparent 70%)',
        filter: 'blur(80px)', pointerEvents: 'none', zIndex: 0,
      }}></div>
      <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <SectionEyebrow>TAX CALCULATION</SectionEyebrow>
          <h2 style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 16 }}>
            실제 계산은 <span style={{ color: 'var(--brand)' }}>이렇게</span> 됩니다
          </h2>
          <p style={{ fontSize: 17, color: 'var(--muted)', maxWidth: 580, margin: '0 auto' }}>
            BTC 익절, ETH 손절, SOL 익절. 한국 세법 기준 어떻게 계산되는지 보세요.
          </p>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24,
          maxWidth: 1080, margin: '0 auto',
        }}>
          {/* Trades */}
          <div className="glass" style={{
            background: 'color-mix(in srgb, var(--card) 75%, transparent)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: 16,
            border: '1px solid color-mix(in srgb, var(--line) 60%, transparent)',
            boxShadow: 'var(--shadow-md)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '18px 24px', borderBottom: '1px solid var(--line-2)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--muted-2)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 2 }}>STEP 1</div>
                <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap' }}>거래 내역 손익</div>
              </div>
              <div style={{ display: 'flex', gap: 4, padding: 4, background: 'var(--bg-tint)', borderRadius: 8 }}>
                {[['fifo', '선입선출'], ['avg', '이동평균']].map(([k, lbl]) => (
                  <button
                    key={k}
                    onClick={() => setMethod(k)}
                    style={{
                      padding: '6px 12px', fontSize: 12, fontWeight: 600,
                      border: 0, borderRadius: 6,
                      background: method === k ? 'var(--card)' : 'transparent',
                      color: method === k ? 'var(--ink)' : 'var(--muted)',
                      boxShadow: method === k ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                    }}>{lbl}</button>
                ))}
              </div>
            </div>
            <div style={{ padding: '8px 24px 16px' }}>
              {items.map((it, i) => (
                <div key={it.coin} style={{
                  padding: '16px 0',
                  borderBottom: i === items.length - 1 ? 'none' : '1px solid var(--line-2)',
                  display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 999,
                      background: `${it.color}18`, color: it.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: 11, letterSpacing: '-0.02em',
                    }}>{it.coin}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{it.name}</div>
                      <div className="mono num" style={{ fontSize: 11.5, color: 'var(--muted)' }}>
                        매수 {it.buy.toLocaleString()}만 → 매도 {it.sell.toLocaleString()}만
                      </div>
                    </div>
                  </div>
                  <div className="num" style={{
                    fontSize: 18, fontWeight: 700,
                    color: it.sell - it.buy >= 0 ? 'var(--good)' : 'var(--bad)',
                    letterSpacing: '-0.01em',
                  }}>
                    {it.sell - it.buy >= 0 ? '+' : ''}{(it.sell - it.buy).toLocaleString()}만원
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calculation */}
          <div className="glass" style={{
            background: 'linear-gradient(180deg, color-mix(in srgb, var(--card) 75%, transparent) 0%, color-mix(in srgb, var(--card-2) 75%, transparent) 100%)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: 16,
            border: '1px solid color-mix(in srgb, var(--line) 60%, transparent)',
            boxShadow: 'var(--shadow-sm)',
            padding: '24px 28px',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ fontSize: 11, color: 'var(--muted-2)', fontWeight: 600, letterSpacing: '0.06em', marginBottom: 4 }}>STEP 2</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18 }}>세액 산출</div>

            <CalcRow label="총 양도차익" value={`+${totalGain.toLocaleString()}만원`} tone="good" />
            <CalcRow label="기본공제" value="−250만원" sub="연 1회" />
            <Divider />
            <CalcRow label="과세표준" value={`${taxable.toLocaleString()}만원`} bold />
            <CalcRow label="× 세율" value="22%" sub="소득세 20% + 지방세 2%" />
            <Divider thick />

            <div style={{
              marginTop: 8,
              padding: '20px 22px',
              background: 'var(--brand)',
              borderRadius: 12,
              color: '#fff',
              boxShadow: '0 8px 24px -8px rgba(37,99,235,0.5)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.9, marginBottom: 4, whiteSpace: 'nowrap' }}>2027년 5월 납부 세액</div>
              <div className="num" style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, whiteSpace: 'nowrap' }}>
                {tax.toLocaleString()}<span style={{ fontSize: 18, fontWeight: 600, marginLeft: 4 }}>만원</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CalcRow({ label, value, sub, tone, bold }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '8px 0', gap: 12,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: bold ? 700 : 500, color: bold ? 'var(--ink)' : 'var(--muted)', whiteSpace: 'nowrap' }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--muted-2)', marginTop: 1, whiteSpace: 'nowrap' }}>{sub}</div>}
      </div>
      <div className="num" style={{
        fontSize: bold ? 17 : 15, fontWeight: bold ? 700 : 600,
        color: tone === 'good' ? 'var(--good)' : 'var(--ink)',
        letterSpacing: '-0.01em', whiteSpace: 'nowrap',
      }}>{value}</div>
    </div>
  );
}
function Divider({ thick }) {
  return <div style={{ height: thick ? 2 : 1, background: thick ? 'var(--ink)' : 'var(--line)', margin: '6px 0', opacity: thick ? 0.1 : 1 }}></div>;
}

window.Example = Example;
