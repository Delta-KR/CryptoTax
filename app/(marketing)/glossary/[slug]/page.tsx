import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SectionEyebrow } from '@/components/ui/section-heading';
import { BreadcrumbJsonLd } from '@/components/seo/Breadcrumb';
import { SITE_URL } from '@/lib/site';
import {
  GLOSSARY_SLUGS,
  getGlossaryTerm,
} from '@/lib/glossary/terms';

export const revalidate = 86400;

export function generateStaticParams() {
  return GLOSSARY_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const term = getGlossaryTerm(slug);
  if (!term) return {};
  const title = `${term.term} — 가상자산 세금 용어사전`;
  return {
    title,
    description: term.summary,
    alternates: { canonical: `/glossary/${slug}` },
    openGraph: { title, description: term.summary, url: `/glossary/${slug}` },
  };
}

export default async function GlossaryTermPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const term = getGlossaryTerm(slug);
  if (!term) notFound();

  const related = term.related
    .map((s) => getGlossaryTerm(s))
    .filter((t): t is NonNullable<typeof t> => t != null);

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Kontaxt', path: '' },
          { name: '용어사전', path: '/glossary' },
          { name: term.term, path: `/glossary/${slug}` },
        ]}
      />
      {/* DefinedTerm — GEO/검색 엔진이 용어 정의로 인식·인용하도록 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'DefinedTerm',
            name: term.term,
            description: term.summary,
            inDefinedTermSet: `${SITE_URL}/glossary`,
            url: `${SITE_URL}/glossary/${slug}`,
          }),
        }}
      />

      <section className="section-pad pb-6">
        <div className="mx-auto max-w-content">
          <Link
            href="/glossary"
            className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-brand"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M10 4L6 8l4 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            용어사전
          </Link>
          <SectionEyebrow>GLOSSARY</SectionEyebrow>
          <h1 className="mb-2 text-[36px] font-extrabold leading-[1.12] tracking-tighter3 text-ink lg:text-[48px]">
            {term.term}
          </h1>
          {term.aka && (
            <p className="text-[14px] font-medium text-muted-2">{term.aka}</p>
          )}
        </div>
      </section>

      <section className="section-pad pt-0">
        <div className="mx-auto flex max-w-content flex-col gap-4">
          {term.body.map((p, i) => (
            <p key={i} className="text-[16px] leading-[1.75] text-ink-2 text-pretty">
              {p}
            </p>
          ))}

          {term.law && (
            <div className="mt-2 rounded-md border border-line bg-bg-soft px-5 py-4 text-[14px] text-muted">
              <span className="font-semibold text-ink-2">근거</span> · {term.law}
            </div>
          )}

          {related.length > 0 && (
            <div className="mt-6 border-t border-line-2 pt-6">
              <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-2">
                관련 용어
              </div>
              <div className="flex flex-wrap gap-2">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/glossary/${r.slug}`}
                    className="nowrap rounded-full border border-line bg-card px-3.5 py-1.5 text-[13px] font-medium text-ink-2 transition-colors hover:border-brand/40 hover:text-brand"
                  >
                    {r.term}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
