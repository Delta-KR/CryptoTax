import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { SectionEyebrow } from '@/components/ui/section-heading';

export const metadata: Metadata = {
  title: '사용 가이드 — Kontaxt',
  description:
    '업비트 PDF · 바이낸스 CSV 거래내역을 다운로드해서 Kontaxt에 업로드하는 방법, 그리고 세금 계산 결과를 해석하는 단계별 안내.',
};

export const revalidate = 86400;

import { UPBIT_STEPS, BINANCE_STEPS, type GuideStep } from '@/lib/guides/exchange-steps';

const FAQ: ReadonlyArray<{ q: string; a: string }> = [
  {
    q: '제 거래내역 데이터는 안전한가요?',
    a: '업로드한 파일은 서버 메모리에서만 처리되고 디스크에는 저장 안 해요. 처리 끝나면 바로 폐기돼요. 계산 결과는 본인 브라우저(localStorage)에만 저장되고, 서버나 외부로는 안 보내요.',
  },
  {
    q: '빗썸 거래내역은 어떻게 업로드하나요?',
    a: '지금은 빗썸 거래내역 추출 방식이 마련되지 않아서 지원하지 않아요. 빗썸 고객센터에 직접 CSV를 요청하면 받을 수는 있는데, Kontaxt는 차후에 정식 지원이 되면 자동 통합할 예정이에요.',
  },
  {
    q: '의제취득가액이 뭔가요?',
    a: '2026년 12월 31일 이전에 산 가상자산의 취득가액을 "실제 매수 가격"과 "2026.12.31 기준 시가" 중에서 더 큰 값으로 적용하는 규칙이에요. 한국 세법이 시행되기 전에 산 거에 대한 보호 장치이고, Kontaxt가 알아서 적용해 줘요.',
  },
  {
    q: 'USDT 같은 외화 거래는 어떻게 처리되나요?',
    a: '한국 원화(KRW)가 아닌 통화(USDT, USD 등)로 한 거래는 거래 시점 환율로 자동 환산해요. 바이낸스 BTC/USDT 거래라면 그 시각의 USDT/KRW 환율을 적용해서 KRW 기준 손익을 뽑아요.',
  },
  {
    q: '코인 간 교환(SWAP)은 어떻게 처리되나요?',
    a: '예를 들어 BTC를 ETH로 교환하면 "BTC 매도 + ETH 매수" 2건의 거래로 자동 나뉘어요. 양쪽 다 총평균 단가 산정에 반영돼요.',
  },
  {
    q: '선물(Futures)은 지원하나요?',
    a: '지금은 현물(Spot)만 지원해요. 한국 세법상 가상자산 양도소득세는 현물 거래에만 적용되고, 선물은 별도 카테고리(파생상품)라서 그래요.',
  },
  {
    q: '여러 거래소를 함께 처리할 수 있나요?',
    a: '네. 각 탭에 해당 거래소 파일을 차례로 올리면 모든 거래가 자동으로 합쳐지고 정렬돼서 한 화면에서 계산돼요.',
  },
  {
    q: '계산 결과를 다시 보려면 어떻게 하나요?',
    a: '같은 브라우저에서 다시 접속하면 마지막 계산 결과가 그대로 남아 있어요. 다른 기기·브라우저에서는 파일을 다시 올려야 해요 (지금은 로그인·서버 저장 기능 준비 중이에요).',
  },
];

interface FlowItem {
  n: number;
  title: string;
  desc: string;
}

const FLOW_STEPS: readonly FlowItem[] = [
  {
    n: 1,
    title: '거래내역 파일 업로드',
    desc: '거래소에서 받은 PDF나 CSV 파일을 그대로 끌어다 놓으세요. 형식·거래소는 자동으로 알아봐요.',
  },
  {
    n: 2,
    title: '자동 파싱 + 정규화',
    desc: '서버에서 거래소별 양식을 통일된 형태로 바꿔요. USDT 같은 외화 거래는 시점 환율로 KRW로 환산해요.',
  },
  {
    n: 3,
    title: '총평균법 + 세법 적용',
    desc: '거주자 시행령 §88①에 따라 연 단위 총평균 단가로 취득가액을 뽑고, 의제취득가액 같은 한국 세법 규칙도 알아서 적용해요.',
  },
  {
    n: 4,
    title: '결과 + PDF 리포트',
    desc: '연간 손익·과세표준·납부 세액을 바로 보고, 신고용 PDF로 받아 보실 수 있어요.',
  },
];

function StepCard({ s }: { s: GuideStep }) {
  return (
    <li className="flex gap-4">
      <div className="flex-shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-faint text-[14px] font-bold text-brand">
          {s.n}
        </div>
      </div>
      <div className="min-w-0 flex-1 pb-1">
        <div className="text-[15px] font-bold text-ink">{s.title}</div>
        <p className="mt-1 text-[13.5px] leading-[1.65] text-muted">
          {s.desc}
        </p>
      </div>
    </li>
  );
}

function ExchangeGuideCard({
  name,
  sub,
  logo,
  bg,
  format,
  steps,
  note,
  href,
}: {
  name: string;
  sub: string;
  logo: string;
  bg: string;
  format: string;
  steps: readonly GuideStep[];
  note?: { tone: 'warn' | 'info'; text: string };
  href: string;
}) {
  return (
    <Card padding="lg" className="flex flex-col gap-5">
      <div className="flex items-center gap-3 border-b border-line-2 pb-5">
        <div
          className="exchange-logo-bg flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md"
          style={{ '--logo-bg': bg } as React.CSSProperties}
        >
          <Image
            src={logo}
            alt={`${name} 로고`}
            width={26}
            height={26}
            className="object-contain"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-bold text-ink">{name}</div>
          <div className="text-[12px] text-muted">{sub}</div>
        </div>
        <Pill tone="neutral" className="font-mono text-[11px]">
          .{format.toLowerCase()}
        </Pill>
      </div>

      <ol className="flex flex-col gap-4">
        {steps.map((s) => (
          <StepCard key={s.n} s={s} />
        ))}
      </ol>

      {note && (
        <div
          className={
            'rounded-md border px-4 py-3 text-[12.5px] leading-[1.6] ' +
            (note.tone === 'warn'
              ? 'border-warn/40 bg-warn-soft text-warn'
              : 'border-line-2 bg-bg-soft text-muted')
          }
        >
          {note.text}
        </div>
      )}

      <Link href={href} className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand transition-colors hover:text-brand-2">
        자세한 단계 보기
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </Link>
    </Card>
  );
}

export default function GuidePage() {
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

  const UPBIT_HOWTO = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: '업비트 거래내역 PDF 받는 법',
    description:
      '업비트 웹사이트에서 양도소득 PDF를 받아서 Kontaxt에 업로드하는 단계별 안내',
    step: UPBIT_STEPS.map((s) => ({
      '@type': 'HowToStep',
      position: s.n,
      name: s.title,
      text: s.desc,
    })),
  };

  const BINANCE_HOWTO = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: '바이낸스 거래내역 CSV 받는 법',
    description:
      'Binance에서 Spot 거래내역 CSV를 받아서 Kontaxt에 업로드하는 단계별 안내',
    step: BINANCE_STEPS.map((s) => ({
      '@type': 'HowToStep',
      position: s.n,
      name: s.title,
      text: s.desc,
    })),
  };

  const BREADCRUMB = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Kontaxt',
        item: 'https://kontaxt.kr',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '사용 가이드',
        item: 'https://kontaxt.kr/guide',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(UPBIT_HOWTO) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BINANCE_HOWTO) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(BREADCRUMB) }}
      />

      {/* Hero */}
      <section className="section-pad pb-6">
        <div className="mx-auto max-w-content text-center">
          <SectionEyebrow>USER GUIDE</SectionEyebrow>
          <h1 className="mb-4 text-[36px] font-extrabold leading-[1.12] tracking-tighter3 text-ink lg:text-[52px]">
            처음 쓰는 분을 위한 <br className="hidden sm:block" />
            <span className="text-brand">단계별 안내예요.</span>
          </h1>
          <p className="mx-auto max-w-[640px] text-[17px] leading-[1.65] text-muted text-pretty">
            파일 받는 법부터 결과 해석까지, 한 화면에 모아 뒀어요.
          </p>
        </div>
      </section>

      {/* 작동 방식 */}
      <section className="section-pad pt-6">
        <div className="mx-auto max-w-content">
          <div className="mb-10 text-center">
            <SectionEyebrow>HOW IT WORKS</SectionEyebrow>
            <h2 className="text-[28px] font-extrabold leading-[1.2] tracking-tighter3 text-ink lg:text-[36px]">
              어떻게 작동하나요?
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {FLOW_STEPS.map((s) => (
              <div
                key={s.n}
                className="relative rounded-[14px] border border-line bg-card p-6 shadow-sm"
              >
                <div
                  className="num pointer-events-none absolute right-4 top-2 text-[48px] font-extrabold leading-none tracking-[-0.04em] text-bg-tint"
                  aria-hidden="true"
                >
                  0{s.n}
                </div>
                <div className="mb-4 inline-block rounded-full bg-brand-soft px-2 py-0.5 text-[10.5px] font-bold tracking-[0.06em] text-brand-2">
                  STEP 0{s.n}
                </div>
                <h3 className="mb-2 text-[16px] font-bold leading-snug text-ink">
                  {s.title}
                </h3>
                <p className="text-[13px] leading-[1.6] text-muted">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 거래소별 다운로드 가이드 */}
      <section id="exchanges" className="section-pad">
        <div className="mx-auto max-w-content">
          <div className="mb-10 text-center">
            <SectionEyebrow>EXCHANGE GUIDES</SectionEyebrow>
            <h2 className="mb-3 text-[28px] font-extrabold leading-[1.2] tracking-tighter3 text-ink lg:text-[36px]">
              거래소별 거래내역 받는 법.
            </h2>
            <p className="mx-auto max-w-[560px] text-[15px] leading-[1.65] text-muted">
              지금 지원하는 거래소는 업비트와 바이낸스(현물)예요. 빗썸 같은 곳은 차례로 추가할 예정이에요.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ExchangeGuideCard
              name="업비트"
              sub="Upbit · 한국 원화 거래소"
              logo="/logos/upbit.png"
              bg="#EEF3FF"
              format="PDF"
              steps={UPBIT_STEPS}
              note={{
                tone: 'info',
                text: 'PDF는 한 번에 전체 거래를 받을 수 있어서 가장 간편해요. 매수·매도·입출금 내역이 한 파일에 다 들어가요.',
              }}
              href="/guides/upbit-pdf-download"
            />
            <ExchangeGuideCard
              name="바이낸스"
              sub="Binance · 글로벌 거래소 (Spot 전용)"
              logo="/logos/binance.png"
              bg="#FFFBEC"
              format="CSV"
              steps={BINANCE_STEPS}
              note={{
                tone: 'warn',
                text: 'Futures(선물) 거래내역은 지원하지 않아요. 한국 세법상 양도소득세는 현물(Spot)에만 적용되고, 선물은 파생상품 카테고리라 따로 처리돼요.',
              }}
              href="/guides/binance-csv-export"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-pad pt-0">
        <div className="mx-auto max-w-content">
          <div className="mb-10 text-center">
            <SectionEyebrow>FAQ</SectionEyebrow>
            <h2 className="text-[28px] font-extrabold leading-[1.2] tracking-tighter3 text-ink lg:text-[36px]">
              자주 묻는 질문.
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
                  <p className="text-[13.5px] leading-[1.7] text-muted">
                    {item.a}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-pad pt-0">
        <div className="mx-auto max-w-content">
          <div className="mx-auto max-w-[720px] rounded-[18px] border border-brand/30 bg-brand-faint px-8 py-10 text-center">
            <h3 className="mb-3 text-[24px] font-extrabold tracking-tighter3 text-ink lg:text-[30px]">
              준비됐으면 지금 시작해 보세요.
            </h3>
            <p className="mx-auto mb-6 max-w-[440px] text-[14px] leading-[1.6] text-muted text-pretty">
              회원가입 없이 바로 파일 올려서 계산해 볼 수 있어요.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/transactions/upload"
                className="rounded-sm bg-brand px-5 py-3 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-brand-2"
              >
                업로드 페이지로 이동
              </Link>
              <Link
                href="/"
                className="rounded-sm border border-line bg-card px-5 py-3 text-[14px] font-semibold text-ink-2 transition-colors hover:bg-bg-soft"
              >
                메인으로 돌아가기
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
