import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionEyebrow } from '@/components/ui/section-heading';
import { BreadcrumbJsonLd } from '@/components/seo/Breadcrumb';
import { SITE_URL } from '@/lib/site';
import { GUIDES_BY_CATEGORY, type GuideMeta } from '@/lib/guides';

const title = '거래소·기능별 가이드 — Kontaxt';
const description =
  '업비트 PDF·바이낸스 CSV 받는 법부터 코인 교환(SWAP)·USDT 환산 같은 세금 처리까지, 토픽별로 정리한 가이드예요.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/guides' },
  openGraph: { title, description, url: '/guides' },
};

export const revalidate = 86400;

function GuideCard({ g }: { g: GuideMeta }) {
  if (!g.published) {
    return (
      <div className="flex flex-col rounded-[14px] border border-line bg-bg-soft p-6 opacity-70">
        <div className="flex items-baseline gap-2">
          <span className="text-[17px] font-bold tracking-tightish text-muted">
            {g.title}
          </span>
          <span className="text-[11px] font-medium text-muted-2">준비 중</span>
        </div>
        <p className="mt-2 text-[14px] leading-[1.6] text-muted text-pretty">
          {g.summary}
        </p>
      </div>
    );
  }
  return (
    <Link
      href={`/guides/${g.slug}`}
      className="group flex flex-col rounded-[14px] border border-line bg-card p-6 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-brand/40 hover:shadow-md"
    >
      <span className="text-[17px] font-bold tracking-tightish text-ink group-hover:text-brand">
        {g.title}
      </span>
      <p className="mt-2 text-[14px] leading-[1.6] text-ink-2 text-pretty">
        {g.summary}
      </p>
    </Link>
  );
}

export default function GuidesIndexPage() {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: [
      ...GUIDES_BY_CATEGORY.exchange,
      ...GUIDES_BY_CATEGORY.feature,
    ]
      .filter((g) => g.published)
      .map((g, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: g.title,
        url: `${SITE_URL}/guides/${g.slug}`,
      })),
  };

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Kontaxt', path: '' },
          { name: '가이드', path: '/guides' },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />

      <section className="section-pad pb-6">
        <div className="mx-auto max-w-content">
          <SectionEyebrow>GUIDES</SectionEyebrow>
          <h1 className="mb-4 text-[36px] font-extrabold leading-[1.12] tracking-tighter3 text-ink lg:text-[52px]">
            거래소·기능별 가이드
          </h1>
          <p className="max-w-[560px] text-[15px] leading-[1.65] text-muted text-pretty">
            파일 받는 법부터 세금 처리 방식까지, 필요한 토픽만 골라 보세요.
          </p>
        </div>
      </section>

      <section className="section-pad pt-0">
        <div className="mx-auto max-w-content">
          <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-2">
            거래소별 거래내역 받는 법
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {GUIDES_BY_CATEGORY.exchange.map((g) => (
              <GuideCard key={g.slug} g={g} />
            ))}
          </div>

          <h2 className="mb-4 mt-10 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-2">
            세금 처리 방식
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {GUIDES_BY_CATEGORY.feature.map((g) => (
              <GuideCard key={g.slug} g={g} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
