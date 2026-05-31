import type { Metadata } from 'next';
import Link from 'next/link';
import { Pricing } from '@/components/sections/pricing';
import { BreadcrumbJsonLd } from '@/components/seo/Breadcrumb';
import { SectionEyebrow } from '@/components/ui/section-heading';
import { getPlan } from '@/lib/pricing/plans';
import { SITE_NAME } from '@/lib/site';

// 요금제 독립 페이지 (C-S5 / GEO Strategic Investments S5).
// 홈 #pricing anchor 섹션(<Pricing />)을 별도 라우트로 승격 — 검색·LLM 이 "Kontaxt 가격"
// 질의에 인용할 표준 URL 확보. 홈 섹션은 그대로 유지 (둘 다 존재).
//
// 가격은 lib/pricing/plans.ts 단일 source 에서만 read (하드코딩 금지).
// 카드 자체는 <Pricing /> 컴포넌트 재사용 → 가격·기능 drift 0.

export const metadata: Metadata = {
  title: '요금제 — Kontaxt',
  description:
    '단일 과세연도 ₩49,900, 구독 ₩89,000/년(2026년 4분기 출시). 결제 전에 무료로 결과를 미리 봐요. 시스템 오류·중복 결제는 100% 환불.',
  openGraph: {
    title: '요금제 — Kontaxt',
    description:
      '단일 과세연도 ₩49,900, 구독 ₩89,000/년. 결제 전 무료 미리보기 + 시스템 오류·중복 결제 100% 환불.',
    type: 'website',
  },
};

export const revalidate = 86400;

const FAQ: readonly { q: string; a: string }[] = [
  {
    q: '환불은 가능한가요?',
    a: '계산 결과와 PDF 리포트는 결제하면 바로 받는 디지털 콘텐츠라, 단순 변심으로는 환불이 어려워요(전자상거래법 제17조 제2항). 다만 시스템 오류로 서비스가 제공되지 않거나 같은 결제가 중복 청구된 경우에는 100% 환불해 드려요. 자세한 기준은 이용약관 제7조에 있어요.',
  },
  {
    q: '결제 수단은 뭐가 있어요?',
    a: '카카오페이·네이버페이·토스페이와 신용카드로 결제할 수 있어요. 결제 기능은 2026년 4분기에 열려요.',
  },
  {
    q: '한 번 결제하면 계속 볼 수 있어요?',
    a: '단일 과세연도를 결제하면 그 연도 결과는 영구히 다시 볼 수 있어요. PDF 리포트도 횟수 제한 없이 다시 받을 수 있고요.',
  },
  {
    q: '구독은 언제부터 결제할 수 있어요?',
    a: '구독은 2026년 4분기에 열려요. 지금 가입해 두면 출시될 때 알림을 보내 드려요. 가입만으로는 요금이 청구되지 않아요.',
  },
  {
    q: '결제 전에 결과를 미리 볼 수 있어요?',
    a: '네, 무료 플랜으로 총 양도차익까지 미리 볼 수 있어요. 전체 결과와 PDF 리포트가 필요할 때 결제하면 돼요.',
  },
];

export default function PricingPage() {
  const onetime = getPlan('onetime');
  const premium = getPlan('premium');

  const PRODUCT_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${SITE_NAME} — 가상자산 양도소득세 신고`,
    description:
      '업비트·빗썸·바이낸스 거래내역을 한국 세법(총평균법) 기준으로 계산해 양도소득세 신고 자료를 만드는 서비스.',
    brand: { '@type': 'Brand', name: SITE_NAME },
    offers: [
      {
        '@type': 'Offer',
        name: onetime.name,
        price: String(onetime.priceKRW),
        priceCurrency: 'KRW',
        description: '선택한 1개 과세연도 결과 열람 + PDF 리포트 무제한 다운로드',
      },
      {
        '@type': 'Offer',
        name: premium.name,
        price: String(premium.priceKRW),
        priceCurrency: 'KRW',
        description: '모든 과세연도 무제한 + 연중 절세 도구 (2026년 4분기 출시)',
      },
    ],
  };

  const FAQ_SCHEMA = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Kontaxt', path: '' },
          { name: '요금제', path: '/pricing' },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PRODUCT_SCHEMA) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />

      {/* Hero */}
      <section className="section-pad pb-0">
        <div className="mx-auto max-w-content text-center">
          <SectionEyebrow>PRICING</SectionEyebrow>
          <h1 className="mb-4 text-[32px] font-extrabold leading-[1.15] tracking-tighter3 text-ink lg:text-[44px]">
            상황에 맞게 골라 보세요.
          </h1>
          <p className="mx-auto max-w-[640px] text-[17px] leading-[1.6] text-muted text-pretty">
            5월 신고 시즌만 쓸 거면 <strong className="font-semibold text-ink">단일 연도</strong>,
            연중 절세 도구가 필요하면 <strong className="font-semibold text-ink">구독</strong>이에요.
            <span className="whitespace-nowrap">둘 다</span> 결제 전에 무료로 결과를 미리 봐요.
          </p>
        </div>
      </section>

      {/* 가격 카드 — 홈과 동일한 <Pricing /> 재사용 (가격·기능 단일 source) */}
      <Pricing />

      {/* 환불 정책 */}
      <section className="section-pad pt-0">
        <div className="mx-auto max-w-[760px] rounded-[14px] border border-line-2 bg-bg-soft px-7 py-6">
          <h2 className="mb-2.5 text-[15px] font-bold tracking-[-0.01em] text-ink">
            결제 전 환불 정책 안내.
          </h2>
          <p className="text-[13.5px] leading-[1.7] text-muted text-pretty">
            계산 결과와 PDF 리포트는 결제하면 바로 받는 디지털 콘텐츠라 단순 변심 환불은 어려워요.
            대신 시스템 오류로 서비스가 제공되지 않거나 같은 결제가 중복 청구된 경우에는
            영업일 기준 5일 이내에 100% 환불해 드려요. 결제 화면에서 환불 정책에 동의한 뒤 진행돼요.{' '}
            <Link href="/legal/terms" className="font-semibold text-brand hover:underline">
              이용약관 제7조
            </Link>
            에 자세히 적어 뒀어요.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-pad pt-0">
        <div className="mx-auto max-w-content">
          <div className="mb-10 text-center">
            <SectionEyebrow>FAQ</SectionEyebrow>
            <h2 className="text-[28px] font-extrabold leading-[1.2] tracking-tighter3 text-ink lg:text-[36px]">
              요금제 자주 묻는 질문.
            </h2>
          </div>

          <div className="mx-auto max-w-[820px]">
            <ul className="flex flex-col gap-3">
              {FAQ.map((item, i) => (
                <li
                  key={i}
                  className="rounded-[12px] border border-line bg-card px-6 py-5 shadow-sm"
                >
                  <div className="mb-2 text-[15px] font-bold tracking-[-0.01em] text-ink">
                    Q. {item.q}
                  </div>
                  <p className="text-[13.5px] leading-[1.7] text-muted">{item.a}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
