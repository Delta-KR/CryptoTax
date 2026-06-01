import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionEyebrow } from '@/components/ui/section-heading';
import { BreadcrumbJsonLd } from '@/components/seo/Breadcrumb';
import { SITE_URL } from '@/lib/site';
import { getGuide } from '@/lib/guides';
import { UPBIT_STEPS } from '@/lib/guides/exchange-steps';
import { getGlossaryTerm } from '@/lib/glossary/terms';

const guide = getGuide('upbit-pdf-download')!;

export const revalidate = 86400;

export const metadata: Metadata = {
  title: `${guide.title} — Kontaxt`,
  description: guide.summary,
  alternates: { canonical: `/guides/${guide.slug}` },
  openGraph: { title: `${guide.title} — Kontaxt`, description: guide.summary, url: `/guides/${guide.slug}` },
};

export default function UpbitPdfGuidePage() {
  const related = guide.related
    .map((s) => getGlossaryTerm(s))
    .filter((t): t is NonNullable<typeof t> => t != null);

  const howTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: guide.title,
    description: guide.summary,
    url: `${SITE_URL}/guides/${guide.slug}`,
    step: UPBIT_STEPS.map((s) => ({
      '@type': 'HowToStep',
      position: s.n,
      name: s.title,
      text: s.desc,
    })),
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }} />

      <section className="section-pad pb-6">
        <div className="mx-auto max-w-content">
          <Link href="/guides" className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-brand">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            가이드
          </Link>
          <SectionEyebrow>UPBIT</SectionEyebrow>
          <h1 className="mb-3 text-[32px] font-extrabold leading-[1.14] tracking-tighter3 text-ink lg:text-[44px]">
            {guide.title}
          </h1>
          <p className="max-w-[600px] text-[16px] leading-[1.7] text-ink-2 text-pretty">
            업비트는 거래내역 전체를 PDF 한 파일로 받을 수 있어서 가장 간편해요. 매수·매도·입출금이 한 번에 들어가요.
          </p>
        </div>
      </section>

      <section className="section-pad pt-0">
        <div className="mx-auto flex max-w-content flex-col gap-8">
          <ol className="flex flex-col gap-4">
            {UPBIT_STEPS.map((s) => (
              <li key={s.n} className="flex gap-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-faint text-[14px] font-bold text-brand">
                  {s.n}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <div className="text-[15px] font-bold text-ink">{s.title}</div>
                  <p className="mt-1 text-[14px] leading-[1.65] text-muted">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="rounded-md border border-warn/40 bg-warn-soft px-5 py-4 text-[13.5px] leading-[1.65] text-warn">
            <span className="font-semibold">자주 막히는 곳</span> · 모바일 앱에서는 PDF 출력 버튼이 없어요. 꼭 PC 브라우저에서 진행해 주세요. 기간을 좁게 잡으면 일부 거래가 빠질 수 있으니, 신고 대상 연도 전체나 [전체]를 골라 주세요.
          </div>

          {related.length > 0 && (
            <div className="border-t border-line-2 pt-6">
              <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-2">관련 용어</div>
              <div className="flex flex-wrap gap-2">
                {related.map((r) => (
                  <Link key={r.slug} href={`/glossary/${r.slug}`} className="rounded-full border border-line bg-card px-3.5 py-1.5 text-[13px] font-medium text-ink-2 transition-colors hover:border-brand/40 hover:text-brand">
                    {r.term}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Link href="/transactions/upload" className="self-start rounded-sm bg-brand px-5 py-3 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-brand-2">
            업로드 페이지로 이동
          </Link>
        </div>
      </section>
    </>
  );
}
