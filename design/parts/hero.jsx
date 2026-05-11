// Hero section
function Hero() {
  return (
    <section style={{
      position: 'relative', overflow: 'hidden',
      padding: '88px 32px 96px',
      background: 'transparent',
    }}>
      {/* Hero-local glow blobs removed — global .atmosphere now drives ambient color */}

      {/* Notebook grid with circular fade — overlay on hero only */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(color-mix(in srgb, var(--brand) 22%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--brand) 22%, transparent) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        backgroundPosition: 'center',
        maskImage: 'radial-gradient(ellipse 60% 70% at 50% 50%, black 0%, black 35%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 60% 70% at 50% 50%, black 0%, black 35%, transparent 80%)',
        opacity: 0.55, zIndex: 0, pointerEvents: 'none',
      }}></div>
      <div style={{
        maxWidth: 1240, margin: '0 auto', position: 'relative', zIndex: 1,
        display: 'grid', gridTemplateColumns: '1fr 1.05fr', gap: 56, alignItems: 'center',
      }}>
        {/* Copy */}
        <div>
          <Badge />
          <h1 style={{
            fontSize: 56, fontWeight: 800, lineHeight: 1.12,
            letterSpacing: '-0.035em', marginTop: 22, marginBottom: 22,
            color: 'var(--ink)',
          }}>
            가상자산 과세가<br />
            다가오는데<br />
            <span style={{
              background: 'linear-gradient(120deg, var(--brand) 0%, #6366F1 60%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>세금 계산은 아직도 엑셀?</span>
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.6, color: 'var(--muted)', marginBottom: 32, maxWidth: 520 }}>
            거래소별 거래내역을 업로드하면, 한국 세법 기준 과세 금액을<br />
            <strong style={{ color: 'var(--ink-2)', fontWeight: 600 }}>3초 만에</strong> 계산해드립니다. 수작업 반나절 → 클릭 한 번.
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 28 }}>
            <button style={{
              background: 'var(--brand)', color: '#fff', border: 0,
              padding: '14px 22px', fontSize: 15, fontWeight: 600,
              borderRadius: 10, letterSpacing: '-0.005em',
              boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 6px 18px -4px rgba(37,99,235,.4)',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              무료로 시작하기
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10m0 0L9 4m4 4L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button style={{
              background: 'var(--card)', color: 'var(--ink-2)', border: '1px solid var(--line)',
              padding: '13px 20px', fontSize: 15, fontWeight: 500,
              borderRadius: 10, letterSpacing: '-0.005em',
              display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M4 2h5l3 3v9H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M9 2v3h3M6 9h4M6 11.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              샘플 리포트 보기
            </button>
          </div>
          <div style={{ display: 'flex', gap: 24, color: 'var(--muted-2)', fontSize: 13, flexWrap: 'wrap' }}>
            <Check>신용카드 불필요</Check>
            <Check>1거래소 영구 무료</Check>
            <Check>2분만에 첫 결과</Check>
          </div>
        </div>

        {/* Dashboard mock */}
        <DashboardMock />
      </div>
    </section>
  );
}

function Badge() {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '6px 12px 6px 8px',
      background: 'rgba(37,99,235,0.08)',
      border: '1px solid rgba(37,99,235,0.18)',
      borderRadius: 999,
      fontSize: 12, fontWeight: 600, color: 'var(--brand-2)',
      letterSpacing: '-0.005em', whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: 18, height: 18, borderRadius: 999,
        background: 'var(--brand)', color: '#fff',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700,
      }}>!</span>
      2027년 1월 1일 과세 시행 확정 · D-237
    </div>
  );
}

function Check({ children }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="7" fill="var(--good-soft)"/>
        <path d="M5 8.5L7 10.5L11 6" stroke="var(--good)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {children}
    </span>
  );
}

function DashboardMock() {
  const bars = [
    { label: 'BTC', amount: '+2,000만', pct: 100, gain: true },
    { label: 'ETH', amount: '-300만', pct: 15, gain: false },
    { label: 'SOL', amount: '+300만', pct: 15, gain: true },
    { label: 'XRP', amount: '+120만', pct: 6, gain: true },
  ];
  return (
    <div style={{ position: 'relative' }}>
      {/* Floating ambient cards */}
      <div style={{
        position: 'absolute', top: -56, right: 24,
        background: 'var(--card)', borderRadius: 12,
        padding: '12px 14px',
        boxShadow: 'var(--shadow-md)', border: '1px solid var(--line-2)',
        display: 'flex', alignItems: 'center', gap: 10, zIndex: 3,
        whiteSpace: 'nowrap',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: '#EEF3FF',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <img src={(window.__resources && window.__resources.fav_upbit) || "https://www.google.com/s2/favicons?domain=upbit.com&sz=64"}
               alt="업비트"
               style={{ width: 20, height: 20, objectFit: 'contain' }}
               onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style=\"color:#fff;font-size:13px;font-weight:700;\">U</span>'; e.target.parentElement.style.background = '#0E48F0'; }}
          />
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>업비트 거래내역</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>upbit_2027.pdf · 통합 완료</div>
        </div>
        <div style={{
          marginLeft: 4,
          width: 22, height: 22, borderRadius: 999, background: 'var(--good-soft)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M4 8L7 11L12 5" stroke="var(--good)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: -28, right: -16,
        background: 'var(--card)', borderRadius: 12,
        padding: '14px 16px',
        boxShadow: 'var(--shadow-md)', border: '1px solid var(--line-2)',
        zIndex: 3, minWidth: 200, whiteSpace: 'nowrap',
      }}>
        <div style={{ fontSize: 11, color: 'var(--muted-2)', fontWeight: 600, letterSpacing: '0.04em', marginBottom: 4 }}>2027 신고용 PDF</div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>tax_report_홍길동.pdf</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted)' }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--good)' }}></span>
          세무사 전달 가능
        </div>
      </div>

      {/* Main dashboard */}
      <div className="glass" style={{
        background: 'var(--card)', borderRadius: 16,
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--line-2)',
        overflow: 'hidden',
        position: 'relative', zIndex: 2,
      }}>
        {/* App chrome */}
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid var(--line-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-soft)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: '#FF5F56' }}></span>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: '#FFBD2E' }}></span>
            <span style={{ width: 10, height: 10, borderRadius: 999, background: '#27C93F' }}></span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted-2)', whiteSpace: 'nowrap' }}>2027 dashboard</div>
          <div style={{ width: 30 }}></div>
        </div>

        <div style={{ padding: 24 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4, whiteSpace: 'nowrap' }}>2027년 귀속 · 가상자산 양도소득</div>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>세금 계산 결과</div>
            </div>
            <div style={{
              padding: '4px 10px', background: 'var(--good-soft)',
              border: '1px solid #BBF7D0', borderRadius: 999,
              fontSize: 11, fontWeight: 600, color: 'var(--good)', whiteSpace: 'nowrap',
            }}>● 계산 완료</div>
          </div>

          {/* Stat row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            <Stat label="총 양도차익" value="+₩2,120만" tone="good" />
            <Stat label="기본공제" value="−₩250만" tone="muted" />
            <Stat label="납부세액" value="₩411만" tone="brand" big />
          </div>

          {/* Chart */}
          <div style={{
            background: 'var(--bg-soft)', borderRadius: 12,
            padding: '16px 18px', border: '1px solid var(--line-2)',
            marginBottom: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14, gap: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>코인별 손익</div>
              <div style={{ fontSize: 11, color: 'var(--muted-2)', whiteSpace: 'nowrap' }}>22% 세율 적용</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bars.map(b => <Bar key={b.label} {...b} />)}
            </div>
          </div>

          {/* Footer chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Chip>선입선출법</Chip>
            <Chip>의제취득가액 적용</Chip>
            <Chip>3개 거래소 통합</Chip>
            <Chip light>247건 거래</Chip>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone, big }) {
  const colors = {
    good: 'var(--good)', bad: 'var(--bad)', brand: 'var(--brand)', muted: 'var(--ink-2)',
  };
  return (
    <div style={{
      background: tone === 'brand' ? 'var(--brand-faint)' : 'var(--card-2)',
      border: tone === 'brand' ? '1px solid color-mix(in srgb, var(--brand) 20%, transparent)' : '1px solid var(--line-2)',
      borderRadius: 10, padding: '12px 14px',
    }}>
      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4, fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</div>
      <div className="num" style={{
        fontSize: big ? 22 : 18, fontWeight: 700, letterSpacing: '-0.02em',
        color: colors[tone] || 'var(--ink)', whiteSpace: 'nowrap',
      }}>{value}</div>
    </div>
  );
}

function Bar({ label, amount, pct, gain }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '36px 1fr 90px', alignItems: 'center', gap: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>{label}</div>
      <div style={{ background: 'var(--bg-tint)', borderRadius: 6, height: 10, position: 'relative', border: '1px solid var(--line-2)' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${pct}%`,
          background: gain ? 'linear-gradient(90deg, #60A5FA, var(--brand))' : 'linear-gradient(90deg, #FCA5A5, var(--bad))',
          borderRadius: 6,
        }}></div>
      </div>
      <div className="num" style={{
        fontSize: 12, fontWeight: 600, textAlign: 'right',
        color: gain ? 'var(--good)' : 'var(--bad)', whiteSpace: 'nowrap',
      }}>{amount}</div>
    </div>
  );
}

function Chip({ children, light }) {
  return (
    <span style={{
      padding: '4px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap',
      color: light ? 'var(--muted)' : 'var(--brand-2)',
      background: light ? 'var(--bg-tint)' : 'var(--brand-soft)',
      border: light ? '1px solid var(--line-2)' : '1px solid #DBEAFE',
    }}>{children}</span>
  );
}

window.Hero = Hero;
