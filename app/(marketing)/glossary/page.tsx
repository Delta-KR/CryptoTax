import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionEyebrow } from '@/components/ui/section-heading';
import { BreadcrumbJsonLd } from '@/components/seo/Breadcrumb';
import { GLOSSARY } from '@/lib/glossary/terms';

const title = '가상자산 세금 용어사전 — Kontaxt';
const description =
  '총평균법·의제취득가액·선입선출법·기본공제 등 2027년 가상자산 양도소득세에 자주 나오는 핵심 용어를 쉽게 정리했어요.';

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/glossary' },
  openGraph: { title, description, url: '/glossary' },
};

export const revalidate = 86400;

export default function GlossaryIndexPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Kontaxt', path: '' },
          { name: '용어사전', path: '/glossary' },
        ]}
      />
      <section className="section-pad pb-6">
        <div className="mx-auto max-w-content">
          <SectionEyebrow>GLOSSARY</SectionEyebrow>
          <h1 className="mb-4 text-[36px] font-extrabold leading-[1.12] tracking-tighter3 text-ink lg:text-[52px]">
            가상자산 세금 용어사전
          </h1>
          <p className="max-w-[560px] text-[15px] leading-[1.65] text-muted text-pretty">
            2027년 양도소득세, 자주 나오는 용어부터 짚어요. 거주자 기준 총평균법·의제취득가액 같은
            핵심 개념을 쉽게 풀었어요.
          </p>
        </div>
      </section>

      <section className="section-pad pt-0">
        <div className="mx-auto grid max-w-content gap-4 sm:grid-cols-2">
          {GLOSSARY.map((t) => (
            <Link
              key={t.slug}
              href={`/glossary/${t.slug}`}
              className="group flex flex-col rounded-[14px] border border-line bg-card p-6 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-brand/40 hover:shadow-md"
            >
              <div className="flex items-baseline gap-2">
                <span className="text-[18px] font-extrabold tracking-tightish text-ink group-hover:text-brand">
                  {t.term}
                </span>
                {t.aka && (
                  <span className="text-[11px] font-medium text-muted-2">{t.aka}</span>
                )}
              </div>
              <p className="mt-2 text-[14px] leading-[1.6] text-ink-2 text-pretty">
                {t.summary}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
