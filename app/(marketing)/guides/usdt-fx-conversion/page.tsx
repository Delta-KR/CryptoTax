import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionEyebrow } from '@/components/ui/section-heading';
import { BreadcrumbJsonLd } from '@/components/seo/Breadcrumb';
import { SITE_URL } from '@/lib/site';
import { getGuide } from '@/lib/guides';
import { getGlossaryTerm } from '@/lib/glossary/terms';

const guide = getGuide('usdt-fx-conversion')!;

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

export default function UsdtFxGuidePage() {
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
          <SectionEyebrow>USDT · 환율</SectionEyebrow>
          <h1 className="mb-3 text-[32px] font-extrabold leading-[1.14] tracking-tighter3 text-ink lg:text-[44px]">
            {guide.title}
          </h1>
          <p className="max-w-[600px] text-[16px] leading-[1.7] text-ink-2 text-pretty">
            USDT나 USD로 한 거래도 한국 세금은 원화 기준이에요. 그래서
            거래가 일어난 그 시점의 환율로 원화로 환산해서 손익을 계산해요.
          </p>
        </div>
      </section>

      <section className="section-pad pt-0">
        <div className="mx-auto flex max-w-content flex-col gap-5">
          <p className="text-[16px] leading-[1.75] text-ink-2 text-pretty">
            바이낸스 BTC/USDT 거래처럼 원화가 아닌 통화로 사고팔면,
            Kontaxt는 거래 시각의 USDT/KRW 환율을 적용해 원화 기준
            양도가액·취득가액을 구해요.
          </p>
          <p className="text-[16px] leading-[1.75] text-ink-2 text-pretty">
            중요한 건 매도와 매수가 각각 그 시점 환율을 따로 쓴다는 거예요.
            같은 USDT여도 산 날과 판 날의 원화 가치가 다르니까요. 환율
            데이터는 매일 갱신되는 출처를 써요.
          </p>

          <div className="rounded-[12px] border border-line bg-bg-soft px-6 py-5">
            <div className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-2">
              계산 예시
            </div>
            <ul className="flex flex-col gap-2 text-[14.5px] leading-[1.7] text-ink-2">
              <li>
                · 바이낸스에서 비트코인 1개를 60,000 USDT에 매도 (매도 시점
                USDT/KRW 1,380원)
              </li>
              <li>
                · 양도가액 — 60,000 × 1,380원 ={' '}
                <span className="num">8,280만원</span>
              </li>
              <li>
                · 예전에 45,000 USDT(취득 시점 1,300원)에 샀다면 취득원가
                45,000 × 1,300원 = <span className="num">5,850만원</span> →
                양도차익 <span className="num">2,430만원</span>
              </li>
            </ul>
            <p className="mt-3 text-[12.5px] leading-[1.6] text-muted">
              매도·매수 시점의 환율을 각각 적용해요. 세액은 연간 손익을
              합산한 뒤 250만원 공제 후 22%를 매겨요.
            </p>
          </div>

          <p className="text-[16px] leading-[1.75] text-ink-2 text-pretty">
            Kontaxt는 외화 거래를 자동으로 인식해 시점별 환율로 환산하니,
            환율을 직접 찾아 넣을 필요가 없어요.
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
