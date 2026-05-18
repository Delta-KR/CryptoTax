// Nav and Footer
function ThemeToggle() {
  const [dark, setDark] = React.useState(() =>
  typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark'
  );
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    try {localStorage.setItem('kontaxt-theme', dark ? 'dark' : 'light');} catch (e) {}
  }, [dark]);
  return (
    <button
      onClick={() => setDark((d) => !d)}
      aria-label={dark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      title={dark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      style={{
        width: 36, height: 36, borderRadius: 999,
        background: 'transparent',
        border: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--ink-2)', cursor: 'pointer',
        transition: 'background 120ms, border-color 120ms'
      }}
      onMouseEnter={(e) => {e.currentTarget.style.background = 'var(--bg-soft)';}}
      onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent';}}>
      
      {dark ?
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg> :

      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      }
    </button>);

}

function Nav() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      borderBottom: '1px solid var(--line)',
      background: 'color-mix(in srgb, var(--bg) 85%, transparent)',
      backdropFilter: 'saturate(180%) blur(20px)',
      WebkitBackdropFilter: 'saturate(180%) blur(20px)'
    }}>
      <div style={{
        maxWidth: 1240, margin: '0 auto',
        padding: '14px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>Kontaxt</span>
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, fontSize: 14, color: 'var(--ink-2)' }}>
          <a href="#how">작동 방식</a>
          <a href="#exchanges">지원 거래소</a>
          <a href="#features">기능</a>
          <a href="#pricing">요금제</a>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThemeToggle />
          <button style={{
            background: 'transparent', border: 0, padding: '8px 14px',
            fontSize: 14, color: 'var(--ink-2)', fontWeight: 500
          }}>로그인</button>
          <button style={{
            background: 'var(--brand)', border: 0, color: '#fff',
            padding: '9px 16px', fontSize: 14, fontWeight: 600,
            borderRadius: 8, letterSpacing: '-0.005em',
            boxShadow: '0 1px 0 rgba(255,255,255,0.2) inset, 0 1px 2px rgba(37,99,235,.2)'
          }}>무료 시작</button>
        </div>
      </div>
    </nav>);

}

function Logo() {
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 7,
      background: 'linear-gradient(135deg, var(--brand) 0%, #1E40AF 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 1px 2px rgba(37,99,235,.3), inset 0 1px 0 rgba(255,255,255,.2)'
    }}>
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M2 11 L6 6 L9 9 L14 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="14" cy="3" r="1.4" fill="white" />
      </svg>
    </div>);

}

function Footer() {
  return (
    <footer style={{ background: 'var(--bg-soft)', color: 'var(--muted)', padding: '64px 32px 40px', borderTop: '1px solid var(--line)' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40, paddingBottom: 40, borderBottom: '1px solid var(--line)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Kontaxt</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--muted)', maxWidth: 320 }}>
              한국 가상자산 투자자를 위한 세금 정산 플랫폼.<br />
              여러 거래소 데이터를 한 번에, 한국 세법 그대로.
            </p>
          </div>
          <FooterCol title="서비스" items={['거래 데이터 통합 엔진', '한국 세법 기준 자동 계산', '신고용 리포트 생성']} />
          <FooterCol title="회사" items={['소개', '팀', '채용']} />
          <FooterCol title="고객지원" items={['문의하기', '개인정보처리방침', '이용약관']} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 24, fontSize: 12, color: 'var(--muted-2)' }}>
          <div>© 2026 Kontaxt. All rights reserved.</div>
          <div>본 서비스는 세무 신고의 참고 자료를 제공하며, 최종 신고는 세무사 검토를 권장합니다.</div>
        </div>
      </div>
    </footer>);

}

function FooterCol({ title, items }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', marginBottom: 14 }}>{title}</div>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((it) => <li key={it} style={{ fontSize: 13, color: 'var(--muted)' }}>{it}</li>)}
      </ul>
    </div>);

}

window.Nav = Nav;
window.Footer = Footer;
window.Logo = Logo;