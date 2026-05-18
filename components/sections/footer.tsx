import Link from 'next/link';

interface FooterItem {
  label: string;
  href: string;
  external?: boolean;
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: readonly FooterItem[];
}) {
  return (
    <div>
      <div className="mb-3.5 text-[13px] font-semibold text-ink">{title}</div>
      <ul className="flex list-none flex-col gap-2.5">
        {items.map((it) => (
          <li key={it.label} className="text-[13px] text-muted">
            {it.external ? (
              <a href={it.href} className="transition-colors hover:text-ink">
                {it.label}
              </a>
            ) : (
              <Link href={it.href} className="transition-colors hover:text-ink">
                {it.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="section-pad-footer border-t border-line bg-bg-soft text-muted">
      <div className="mx-auto max-w-content">
        <div className="grid grid-cols-1 gap-10 border-b border-line pb-10 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <div className="mb-3.5 text-base font-bold text-ink">Kontaxt</div>
            <p className="max-w-[320px] text-[13px] leading-[1.7] text-muted">
              한국 가상자산 투자자를 위한 세금 정산 플랫폼.
              <br />
              여러 거래소 데이터를 한 번에, 한국 세법 그대로.
            </p>
          </div>
          <FooterCol
            title="서비스"
            items={[
              { label: '거래 데이터 통합 엔진', href: '/#features' },
              { label: '한국 세법 기준 자동 계산', href: '/#how' },
              { label: '샘플 리포트 보기', href: '/sample' },
              { label: '사용 가이드', href: '/guide' },
            ]}
          />
          <FooterCol
            title="보안"
            items={[
              { label: '보안 개요', href: '/#security' },
              {
                label: '취약점 신고',
                href: 'mailto:security@kontaxt.kr?subject=취약점 신고',
                external: true,
              },
              { label: '개인정보처리방침', href: '/legal/privacy' },
            ]}
          />
          <FooterCol
            title="고객지원"
            items={[
              {
                label: '문의하기',
                href: 'mailto:hello@kontaxt.kr?subject=문의',
                external: true,
              },
              { label: '이용약관', href: '/legal/terms' },
            ]}
          />
        </div>
        <div className="flex flex-col gap-3 pt-6 text-xs text-muted-2 md:flex-row md:justify-between md:gap-0">
          <div>© 2026 Kontaxt. All rights reserved.</div>
          <div>본 서비스는 세무 신고의 참고 자료를 제공하며, 최종 신고는 세무사 검토를 권장합니다.</div>
        </div>
      </div>
    </footer>
  );
}
