import Link from 'next/link';
import type { Metadata } from 'next';
import { SectionEyebrow } from '@/components/ui/section-heading';

export const metadata: Metadata = {
  title: '이용약관 — 크립토택스',
  description:
    '크립토택스 서비스 이용에 관한 권리·의무·책임을 규정하는 약관. 유료 서비스의 종류, 환불 정책, 책임 제한 사항을 포함합니다.',
};

const EFFECTIVE_DATE = '2026년 5월 12일';

function Article({
  num,
  title,
  children,
}: {
  num: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-24" id={`article-${num}`}>
      <h2 className="mb-3 mt-10 text-[22px] font-extrabold tracking-tighter3 text-ink lg:text-[26px]">
        제{num}조 ({title})
      </h2>
      <div className="flex flex-col gap-3 text-[15px] leading-[1.75] text-muted">
        {children}
      </div>
    </section>
  );
}

function Clause({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <p>
      <span className="mr-2 font-semibold text-ink-2">{num}.</span>
      {children}
    </p>
  );
}

export default function TermsPage() {
  return (
    <>
      <section className="section-pad pb-6">
        <div className="mx-auto max-w-content">
          <SectionEyebrow>LEGAL</SectionEyebrow>
          <h1 className="mb-4 text-[36px] font-extrabold leading-[1.12] tracking-tighter3 text-ink lg:text-[52px]">
            이용약관
          </h1>
          <p className="text-[15px] leading-[1.65] text-muted">
            시행일: {EFFECTIVE_DATE}
          </p>
        </div>
      </section>

      <section className="section-pad pt-0">
        <div className="mx-auto max-w-content">
          <Article num={1} title="목적">
            <p>
              본 약관은 크립토택스(이하 &ldquo;서비스&rdquo;)가 제공하는 가상자산 양도소득세 계산 서비스의
              이용 조건 및 절차, 서비스와 회원 간의 권리·의무·책임 등을 규정함을 목적으로 합니다.
            </p>
          </Article>

          <Article num={2} title="정의">
            <Clause num={1}>
              &ldquo;서비스&rdquo;라 함은 크립토택스가 운영하는 가상자산 양도소득세 계산·리포트 생성 웹
              서비스를 의미합니다.
            </Clause>
            <Clause num={2}>
              &ldquo;회원&rdquo;이라 함은 본 약관에 동의하고 서비스에 가입하여 서비스를 이용하는 자를
              의미합니다.
            </Clause>
            <Clause num={3}>
              &ldquo;단일 과세연도 리포트&rdquo;라 함은 회원이 선택한 특정 1개 과세연도에 대한 계산 및 PDF
              리포트 1회 제공을 의미합니다.
            </Clause>
            <Clause num={4}>
              &ldquo;정기 구독&rdquo;이라 함은 결제 유효기간 동안 모든 과세연도에 대해 무제한 계산 및 리포트
              생성이 가능한 유료 서비스를 의미합니다.
            </Clause>
          </Article>

          <Article num={3} title="약관의 효력 및 변경">
            <Clause num={1}>
              본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다.
            </Clause>
            <Clause num={2}>
              서비스는 관련 법령에 위배되지 않는 범위에서 본 약관을 변경할 수 있으며, 변경 시 시행일 7일
              전부터 서비스 화면에 공지합니다. 회원에게 불리한 변경의 경우 30일 전 공지합니다.
            </Clause>
            <Clause num={3}>
              회원이 변경된 약관의 적용에 동의하지 아니하는 경우 회원 탈퇴를 통해 서비스 이용을 중단할 수
              있습니다.
            </Clause>
          </Article>

          <Article num={4} title="회원가입">
            <Clause num={1}>
              회원가입은 이메일/비밀번호 또는 소셜 로그인(Google, Kakao 등)을 통해 진행되며, 회원은
              가입 시 정확한 정보를 제공해야 합니다.
            </Clause>
            <Clause num={2}>
              서비스는 다음 각호의 경우 가입을 거부하거나 사후에 회원 자격을 제한할 수 있습니다.
              <br />— 타인의 정보를 도용한 경우
              <br />— 허위 정보로 가입한 경우
              <br />— 관련 법령 또는 본 약관을 위반한 이력이 있는 경우
            </Clause>
          </Article>

          <Article num={5} title="서비스 내용">
            <Clause num={1}>
              서비스는 다음 기능을 제공합니다.
              <br />— 거래소 거래내역 파일(PDF·CSV 등) 업로드를 통한 양도소득세 자동 계산
              <br />— 한국 세법 기준 FIFO(선입선출법) 적용 및 의제취득가액 자동 반영
              <br />— 신고용 PDF 리포트 생성
              <br />— 유료 결제 시 전체 결과 열람 및 리포트 다운로드
            </Clause>
            <Clause num={2}>
              서비스는 회원이 업로드한 거래내역 파일을 서버 메모리에서만 처리하며, 디스크에 저장하지
              않습니다. 계산 결과만 회원 계정과 연결되어 저장됩니다.
            </Clause>
          </Article>

          <Article num={6} title="유료 서비스">
            <Clause num={1}>
              서비스는 다음 두 가지 유료 상품을 제공합니다.
            </Clause>
            <div className="ml-5 rounded-md border border-line bg-bg-soft px-5 py-4">
              <p className="mb-2 text-[14.5px] font-bold text-ink">가. 단일 과세연도 리포트</p>
              <p className="text-[14px] leading-[1.7]">
                ₩29,900 일시불. 회원이 선택한 특정 과세연도(예: 2027년) 1개에 대한 계산 결과 열람 및
                PDF 리포트 다운로드 권한이 제공됩니다.
              </p>
            </div>
            <div className="ml-5 rounded-md border border-line bg-bg-soft px-5 py-4">
              <p className="mb-2 text-[14.5px] font-bold text-ink">나. 정기 구독</p>
              <p className="text-[14px] leading-[1.7]">
                ₩19,900/년. 결제 유효기간 동안 모든 과세연도(현재·과거·미래)에 대한 무제한 계산 및 PDF
                리포트 생성 권한이 제공됩니다.
              </p>
            </div>
            <Clause num={2}>
              <strong className="font-semibold text-ink">정기 구독 해지 시 기존 리포트 접근:</strong>{' '}
              회원이 정기 구독을 해지하거나 구독이 만료된 경우, 해지·만료 시점까지 회원이 생성한 PDF
              리포트는 영구적으로 다운로드 가능합니다. 단, 신규 계산 및 신규 과세연도 리포트 생성은
              중단됩니다. 이는 세무조사·자료 보존 등에 대비한 회원 보호 조치입니다.
            </Clause>
            <Clause num={3}>
              유료 서비스 이용 요금, 결제 수단, 결제 절차는 결제 페이지에 별도로 안내합니다. 결제는
              Toss Payments 등 외부 결제대행사를 통해 처리되며, 회원의 카드 정보는 본 서비스가 직접
              저장하지 않습니다.
            </Clause>
          </Article>

          <Article num={7} title="환불 정책">
            <Clause num={1}>
              서비스는 디지털 콘텐츠(계산 결과 및 PDF 리포트)를 결제 즉시 제공하므로, 「전자상거래 등에서의
              소비자보호에 관한 법률」 제17조 제2항 제5호에 따라 청약철회가 제한됩니다.
            </Clause>
            <Clause num={2}>
              회원은 결제 전 본 환불 정책에 명시적으로 동의해야 하며, 동의 없이는 결제가 진행되지
              않습니다.
            </Clause>
            <Clause num={3}>
              다음 각호의 경우에는 예외적으로 100% 환불이 가능합니다.
              <br />— 서비스의 시스템 오류로 인해 결제 후 서비스가 정상 제공되지 않은 경우
              <br />— 동일 결제 건이 중복으로 청구된 경우
              <br />— 관련 법령에 따라 환불이 의무화된 경우
            </Clause>
            <Clause num={4}>
              환불 요청은 본 약관 말미의 운영자 연락처로 접수하며, 정당한 사유 확인 후 영업일 기준 5일
              이내 결제 수단을 통해 환급합니다.
            </Clause>
          </Article>

          <Article num={8} title="회원의 의무">
            <Clause num={1}>
              회원은 본 서비스를 이용함에 있어 다음 행위를 하여서는 안 됩니다.
              <br />— 타인의 계정 정보를 도용하거나 부정 사용하는 행위
              <br />— 서비스의 운영을 방해하거나 자동화된 수단으로 비정상적으로 이용하는 행위
              <br />— 서비스의 결과물을 변조하여 허위 자료로 활용하는 행위
              <br />— 관련 법령 또는 본 약관을 위반하는 행위
            </Clause>
            <Clause num={2}>
              회원의 비밀번호 관리 책임은 회원 본인에게 있으며, 비밀번호 노출로 인한 손해에 대해 서비스는
              책임을 지지 않습니다.
            </Clause>
          </Article>

          <Article num={9} title="서비스의 책임 제한">
            <Clause num={1}>
              <strong className="font-semibold text-ink">
                본 서비스가 제공하는 세액 계산 결과는 참고 자료이며, 실제 세무 신고 책임은 회원 본인에게
                있습니다. 정확한 신고를 위해 세무 전문가의 검토를 권장합니다.
              </strong>
            </Clause>
            <Clause num={2}>
              서비스는 회원이 업로드한 거래내역 파일의 내용 자체에 오류·누락·위변조가 있는 경우 그 결과로
              발생한 계산 오류에 대해 책임을 지지 않습니다.
            </Clause>
            <Clause num={3}>
              서비스는 한국 세법 및 관련 규정의 변경, 거래소의 파일 형식 변경 등으로 인해 계산 결과가
              실제 세법 적용과 차이가 발생할 수 있음을 안내하며, 회원은 신고 전 결과를 반드시 검토해야
              합니다.
            </Clause>
            <Clause num={4}>
              천재지변, 외부 결제대행사·인증 서비스·호스팅 서비스의 장애 등 서비스의 통제 범위를 벗어난
              사유로 인한 서비스 중단에 대해서는 책임이 제한됩니다.
            </Clause>
          </Article>

          <Article num={10} title="개인정보 보호">
            <p>
              회원의 개인정보 처리에 관한 사항은 별도의{' '}
              <Link href="/legal/privacy" className="text-brand underline">
                개인정보처리방침
              </Link>
              에 따릅니다.
            </p>
          </Article>

          <Article num={11} title="분쟁 해결 및 준거법">
            <Clause num={1}>
              본 약관과 서비스 이용에 관한 분쟁은 대한민국 법령에 따릅니다.
            </Clause>
            <Clause num={2}>
              서비스와 회원 간 발생한 분쟁의 관할 법원은 「민사소송법」에 따른 관할 법원으로 하되, 별도
              합의가 없는 한 서울중앙지방법원을 제1심 관할 법원으로 합니다.
            </Clause>
          </Article>

          <Article num={12} title="부칙">
            <p>본 약관은 {EFFECTIVE_DATE}부터 시행합니다.</p>
          </Article>

          <div className="mt-12 rounded-md border border-line-2 bg-bg-soft px-5 py-4 text-[13px] leading-[1.7] text-muted-2">
            <div className="mb-1 font-semibold text-ink-2">운영자 연락처</div>
            <div>이메일: deltakr@icloud.com</div>
          </div>
        </div>
      </section>
    </>
  );
}
