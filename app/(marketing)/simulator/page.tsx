import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionEyebrow } from '@/components/ui/section-heading';
import { SimulatorForm } from './SimulatorForm';

export const metadata: Metadata = {
  title: '양도소득세 시뮬레이터 — 지금 팔면 세금 얼마 · Kontaxt',
  description:
    '한국 가상자산 양도소득세 자동 계산. 매수가·매도가·수량을 입력하면 산출세액 + 신고 누락 시 가산세까지 즉시 확인. 회원가입 없이 무료.',
  keywords: [
    '양도소득세 계산기',
    '비트코인 세금 계산기',
    '가상자산 양도소득세',
    '암호화폐 양도소득세 계산기',
    '의제취득가액',
    '2027 가상자산 세금',
    '코인 세금 계산',
    '암호화폐 세금',
  ],
  openGraph: {
    title: '양도소득세 시뮬레이터 — Kontaxt',
    description:
      '매수가·매도가·수량 입력으로 산출세액 + 가산세를 즉시 확인. 2027.01.01 시행 한국 가상자산 양도소득세.',
    type: 'website',
  },
};

export default function SimulatorPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 lg:py-24">
      {/* Hero */}
      <SectionEyebrow>양도소득세 시뮬레이터</SectionEyebrow>
      <h1 className="mt-3 text-[36px] font-extrabold leading-[1.12] tracking-tighter3 text-ink lg:text-[52px]">
        지금 팔면 세금 얼마.
      </h1>
      <p className="mt-5 max-w-[640px] text-[16px] leading-[1.65] text-muted text-pretty lg:text-[17px]">
        한국 가상자산 양도소득세(2027.01.01 시행, 2028.05 첫 확정신고) 자동 계산이에요.
        회원가입 없이 매수가·매도가·수량만 넣으면 산출세액 + 신고 누락 시 가산세까지
        한 화면에서 바로 확인할 수 있어요.
      </p>

      {/* Form + Result */}
      <div className="mt-12">
        <SimulatorForm />
      </div>

      {/* CTA */}
      <div className="mt-16 rounded-[14px] border border-line bg-card p-8 text-center shadow-sm lg:mt-20 lg:p-10">
        <h2 className="text-[22px] font-extrabold tracking-tighter3 text-ink lg:text-[28px]">
          한 번 더 정확하게.
        </h2>
        <p className="mx-auto mt-3 max-w-[520px] text-[14px] leading-[1.65] text-muted text-pretty lg:text-[15px]">
          거래내역 전체를 올리면 거주자 법정 총평균법(시행령 §88①)·의제취득가액·환율 변환까지
          자동 적용해서 한국 세법 양식의 PDF 신고서를 만들어 드려요.
        </p>
        <Link
          href="/signup"
          className="mt-7 inline-flex items-center gap-2 rounded-lg bg-brand px-6 py-3 text-[15px] font-semibold text-white hover:bg-brand-2"
        >
          전체 거래내역으로 신고서 만들기 →
        </Link>
      </div>

      {/* Footer 안내 */}
      <p className="mt-12 max-w-[720px] text-[12.5px] leading-[1.7] text-muted-2 text-pretty">
        본 시뮬레이터는 단일 거래 추정치라 실제 신고와 차이가 있을 수 있어요. 정확한 세액은
        전체 거래내역으로 만든 PDF 리포트가 기준이에요. 가산세 비율은
        국세기본법 §47의2~4 기준 — 무신고 일반 20%, 무신고 부정 40%, 과소신고 일반 10%,
        납부지연 일 0.022%(연 환산 약 8.03%).
      </p>
    </main>
  );
}
