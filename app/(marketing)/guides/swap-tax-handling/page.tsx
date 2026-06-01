import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionEyebrow } from '@/components/ui/section-heading';
import { BreadcrumbJsonLd } from '@/components/seo/Breadcrumb';
import { SITE_URL } from '@/lib/site';
import { getGuide } from '@/lib/guides';
import { getGlossaryTerm } from '@/lib/glossary/terms';

const guide = getGuide('swap-tax-handling')!;

export const revalidate = 86400;

export const metadata: Metadata = {
  title: `${guide.title} — Kontaxt`,
  description: guide.summary,
  alternates: { canonical: `/guides/${guide.slug}` },
  openGraph: {
    title: `${guide.title} — Kontaxt`,
    description: guide.summary,
    url: `/guides/${guide.slug}`,
  },
};

export default function SwapTaxGuidePage() {
  const related = guide.related
    .map((s) => getGlossaryTerm(s))
    .filter((t): t is NonNullable<typeof t> => t != null);

  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.summary,
    author: { '@type': 'Organization', name: 'Kontaxt' },
    publisher: { '@type': 'Organization', name: 'Kontaxt' },
    mainEntityOfPage: `${SITE_URL}/guides/${guide.slug}`,
  };

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Kontaxt', path: '' },
          { name: '가이드', path: '/guides' },
          { name: guide.title, path: `/guides/${guide.slug}` },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }}
      />

      <section className="section-pad pb-6">
        <div className="mx-auto max-w-content">
          <Link
            href="/guides"
            className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-brand"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M10 4L6 8l4 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            가이드
          </Link>
          <SectionEyebrow>SWAP</SectionEyebrow>
          <h1 className="mb-3 text-[32px] font-extrabold leading-[1.14] tracking-tighter3 text-ink lg:text-[44px]">
            {guide.title}
          </h1>
          <p className="max-w-[600px] text-[16px] leading-[1.7] text-ink-2 text-pretty">
            BTC를 ETH로 바꾸는 코인 교환은 원화가 한 푼도 오가지 않아도
            세금이 매겨져요. 교환은 &ldquo;가진 코인을 팔고 → 새 코인을
            사는&rdquo; 2건의 거래로 보거든요.
          </p>
        </div>
      </section>

      <section className="section-pad pt-0">
        <div className="mx-auto flex max-w-content flex-col gap-5">
          <p className="text-[16px] leading-[1.75] text-ink-2 text-pretty">
            예를 들어 비트코인을 이더리움으로 교환하면, 세법은 이걸
            &ldquo;비트코인 매도 + 이더리움 매수&rdquo; 2건으로 나눠서 봐요.
            비트코인 매도분에서는 양도차익이 생기고, 받은 이더리움은 그
            시점 가치가 새 취득가액이 돼요.
          </p>
          <p className="text-[16px] leading-[1.75] text-ink-2 text-pretty">
            한국 거주자는 취득가액을 연 단위 총평균법으로 산정해요(소득세법
            시행령 §88①). 그래서 교환으로 매도한 코인의 취득원가도 그해
            평균 매수단가를 따라요.
          </p>

          <div className="rounded-[12px] border border-line bg-bg-soft px-6 py-5">
            <div className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-2">
              계산 예시
            </div>
            <ul className="flex flex-col gap-2 text-[14.5px] leading-[1.7] text-ink-2">
              <li>
                · 비트코인 0.5개를 이더리움으로 교환 (교환 시점 비트코인
                6,000만원, 이더리움 400만원)
              </li>
              <li>
                ·{' '}
                <span className="font-semibold text-ink">비트코인 매도분</span>{' '}
                — 양도가액 0.5 × 6,000만원 ={' '}
                <span className="num">3,000만원</span>. 그해 총평균 취득단가가
                5,000만원이었다면 취득원가{' '}
                <span className="num">2,500만원</span> → 양도차익{' '}
                <span className="num">500만원</span>
              </li>
              <li>
                ·{' '}
                <span className="font-semibold text-ink">이더리움 매수분</span>{' '}
                — 3,000만원어치(7.5 ETH)를 새로 취득한 것으로 봐요. 이
                3,000만원이 이더리움의 취득가액이 돼요
              </li>
            </ul>
            <p className="mt-3 text-[12.5px] leading-[1.6] text-muted">
              실제 취득단가는 교환 1건이 아니라 그해 전체 매수를 평균한
              값이에요. 세액은 연간 손익을 모두 합산한 뒤 250만원을 공제하고
              22%(지방세 포함)를 매겨요. 위는 교환 1건만 떼어 본 거예요.
            </p>
          </div>

          <p className="text-[16px] leading-[1.75] text-ink-2 text-pretty">
            Kontaxt는 거래내역에서 교환 거래를 자동으로 찾아 매도·매수
            2건으로 나누고, 양쪽 모두 총평균 단가 산정에 반영해요. 직접
            나눌 필요가 없어요.
          </p>

          {related.length > 0 && (
            <div className="border-t border-line-2 pt-6">
              <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-2">
                관련 용어
              </div>
              <div className="flex flex-wrap gap-2">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/glossary/${r.slug}`}
                    className="rounded-full border border-line bg-card px-3.5 py-1.5 text-[13px] font-medium text-ink-2 transition-colors hover:border-brand/40 hover:text-brand"
                  >
                    {r.term}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Link
            href="/transactions/upload"
            className="self-start rounded-sm bg-brand px-5 py-3 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-brand-2"
          >
            업로드 페이지로 이동
          </Link>
        </div>
      </section>
    </>
  );
}
