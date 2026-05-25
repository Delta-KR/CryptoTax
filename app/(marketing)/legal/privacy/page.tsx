import type { Metadata } from 'next';
import { SectionEyebrow } from '@/components/ui/section-heading';

export const metadata: Metadata = {
  title: '개인정보처리방침 — Kontaxt',
  description:
    'Kontaxt가 처리하는 개인정보 항목, 처리 목적, 보유 기간, 제3자 제공·위탁, 정보주체의 권리 등을 안내합니다.',
};

const EFFECTIVE_DATE = '2026년 5월 22일';

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
        {num}. {title}
      </h2>
      <div className="flex flex-col gap-3 text-[15px] leading-[1.75] text-muted">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <>
      <section className="section-pad pb-6">
        <div className="mx-auto max-w-content">
          <SectionEyebrow>LEGAL</SectionEyebrow>
          <h1 className="mb-4 text-[36px] font-extrabold leading-[1.12] tracking-tighter3 text-ink lg:text-[52px]">
            개인정보처리방침
          </h1>
          <p className="text-[15px] leading-[1.65] text-muted">
            시행일: {EFFECTIVE_DATE}
          </p>
        </div>
      </section>

      <section className="section-pad pt-0">
        <div className="mx-auto max-w-content">
          <p className="text-[15px] leading-[1.75] text-muted">
            Kontaxt(이하 &ldquo;서비스&rdquo;)는 「개인정보 보호법」 제30조 및 같은 법 시행령
            제31조에 따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수
            있도록 다음과 같이 개인정보처리방침을 수립·공개합니다.
          </p>

          <div className="mt-8 rounded-md border border-good/30 bg-good-soft px-5 py-4 text-[14px] leading-[1.7] text-good">
            <div className="mb-1 font-bold">거래소 파일 비저장 정책</div>
            <p>
              회원이 업로드하는 거래소 거래내역 파일(PDF·CSV·XLS)은 서버 메모리에서 즉시 파싱된 후
              폐기되며, 디스크에 저장되지 않습니다. 회원 계정과 연결되어 저장되는 정보는 파일 자체가
              아니라 계산 결과입니다.
            </p>
          </div>

          <Article num={1} title="처리하는 개인정보 항목">
            <p>서비스는 다음의 개인정보 항목을 처리합니다.</p>
            <div className="rounded-md border border-line bg-bg-soft px-5 py-4">
              <p className="mb-2 text-[14.5px] font-bold text-ink">가. 회원가입 및 인증</p>
              <p className="text-[14px] leading-[1.7]">
                필수: 이메일 주소, 비밀번호(암호화 저장), Supabase 인증 UID
                <br />
                선택: 표시 이름(닉네임)
              </p>
            </div>
            <div className="rounded-md border border-line bg-bg-soft px-5 py-4">
              <p className="mb-2 text-[14.5px] font-bold text-ink">나. 소셜 로그인 이용 시</p>
              <p className="text-[14px] leading-[1.7]">
                Google·Kakao·Naver 등 소셜 인증 제공자로부터 수신: 이메일 주소, 프로필 이름, 소셜
                계정 고유 식별자
              </p>
            </div>
            <div className="rounded-md border border-line bg-bg-soft px-5 py-4">
              <p className="mb-2 text-[14.5px] font-bold text-ink">다. 유료 결제 이용 시</p>
              <p className="text-[14px] leading-[1.7]">
                결제 금액, 결제 일시, 결제 승인번호, 결제 수단 종류, 영수증 URL
                <br />
                <span className="text-muted">
                  ※ 카드번호·유효기간 등 결제 수단 상세 정보는 결제대행사(포트원/PortOne)가 직접
                  처리하며, 본 서비스는 이를 수집·보관하지 않습니다.
                </span>
              </p>
            </div>
            <div className="rounded-md border border-line bg-bg-soft px-5 py-4">
              <p className="mb-2 text-[14.5px] font-bold text-ink">라. 서비스 이용 중 자동 수집</p>
              <p className="text-[14px] leading-[1.7]">
                접속 IP 주소, 브라우저 종류 및 버전, 운영체제, 접속 일시, 서비스 이용 기록(서버 로그)
              </p>
            </div>
            <div className="rounded-md border border-line bg-bg-soft px-5 py-4">
              <p className="mb-2 text-[14.5px] font-bold text-ink">마. 계산 결과</p>
              <p className="text-[14px] leading-[1.7]">
                회원이 업로드한 거래소 파일을 기반으로 산출된 연도별 손익, 과세표준, 납부세액, 실현손익
                내역 등의 계산 결과
              </p>
            </div>
          </Article>

          <Article num={2} title="개인정보의 처리 목적">
            <p>서비스는 수집한 개인정보를 다음 목적으로만 처리합니다.</p>
            <p>
              ① 회원 식별 및 인증
              <br />
              ② 서비스 제공(거래내역 분석, 세액 계산, PDF 리포트 생성·저장)
              <br />
              ③ 유료 서비스 결제 처리 및 결제 이력 관리
              <br />
              ④ 회원 문의 응대 및 고객 지원
              <br />
              ⑤ 부정 이용 방지 및 서비스 운영 안정성 확보
            </p>
          </Article>

          <Article num={3} title="개인정보의 처리 및 보유 기간">
            <p>
              서비스는 법령에 따른 보존 의무가 있는 경우를 제외하고, 회원이 탈퇴하거나 동의를 철회한
              시점에 개인정보를 지체 없이 파기합니다.
            </p>
            <p>
              ① 회원 정보(이메일, 인증 정보, 계산 결과): 회원 탈퇴 시까지
              <br />
              ② 결제 기록: 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 5년
              <br />
              ③ 소비자의 불만 또는 분쟁처리 기록: 동법에 따라 3년
              <br />
              ④ 접속 로그(서버 로그): 30일
            </p>
          </Article>

          <Article num={4} title="개인정보의 제3자 제공">
            <p>
              서비스는 정보주체의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만 다음 각호의
              경우에는 예외로 합니다.
            </p>
            <p>
              ① 정보주체로부터 별도의 동의를 받은 경우
              <br />
              ② 법령에 특별한 규정이 있거나, 수사기관·법원의 적법한 요청이 있는 경우
            </p>
          </Article>

          <Article num={5} title="개인정보 처리의 위탁">
            <p>
              서비스는 원활한 서비스 제공을 위해 다음과 같이 개인정보 처리 업무를 외부 전문 업체에
              위탁하고 있습니다.
            </p>
            <div className="overflow-hidden rounded-md border border-line">
              <table className="w-full border-collapse text-[13.5px]">
                <thead className="bg-bg-soft text-ink-2">
                  <tr>
                    <th className="border-b border-line px-4 py-2.5 text-left font-semibold">
                      수탁업체
                    </th>
                    <th className="border-b border-line px-4 py-2.5 text-left font-semibold">
                      위탁 업무
                    </th>
                  </tr>
                </thead>
                <tbody className="text-muted">
                  <tr>
                    <td className="border-b border-line px-4 py-2.5">Supabase, Inc.</td>
                    <td className="border-b border-line px-4 py-2.5">
                      회원 인증 및 데이터베이스 호스팅 (한국 리전)
                    </td>
                  </tr>
                  <tr>
                    <td className="border-b border-line px-4 py-2.5">Vercel, Inc.</td>
                    <td className="border-b border-line px-4 py-2.5">
                      웹 애플리케이션 호스팅
                    </td>
                  </tr>
                  <tr>
                    <td className="border-b border-line px-4 py-2.5">포트원 (PortOne)</td>
                    <td className="border-b border-line px-4 py-2.5">
                      유료 서비스 결제 처리 (카카오페이·네이버페이·토스페이·신용카드 통합 게이트웨이)
                    </td>
                  </tr>
                  <tr>
                    <td className="border-b border-line px-4 py-2.5">Google LLC / Kakao Corp.</td>
                    <td className="border-b border-line px-4 py-2.5">
                      소셜 로그인 인증 (회원이 해당 기능을 이용하는 경우)
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5">Naver Corp (네이버 주식회사)</td>
                    <td className="px-4 py-2.5">
                      소셜 로그인 인증 (회원이 해당 기능을 이용하는 경우)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>
              위탁 업체에는 처리 목적 달성에 필요한 최소한의 정보만 제공되며, 수탁업체와 개인정보 보호
              관련 법령 준수 의무를 계약상 명시하고 있습니다.
            </p>
          </Article>

          <Article num={6} title="정보주체의 권리·의무 및 행사 방법">
            <p>
              정보주체는 서비스에 대하여 언제든지 다음 각호의 권리를 행사할 수 있습니다.
            </p>
            <p>
              ① 개인정보 열람 요구
              <br />
              ② 개인정보의 정정·삭제 요구
              <br />
              ③ 개인정보 처리정지 요구
              <br />
              ④ 회원 탈퇴(개인정보 파기) 요구
            </p>
            <p>
              위 권리 행사는 서비스 내 설정 페이지에서 직접 진행하거나, 본 방침 말미의 연락처로
              요청하실 수 있습니다. 서비스는 요청 접수 후 지체 없이 처리합니다.
            </p>
          </Article>

          <Article num={7} title="개인정보의 파기 절차 및 방법">
            <p>
              서비스는 개인정보 보유 기간이 경과하거나 처리 목적이 달성된 경우, 다음의 방법으로 개인정보를
              파기합니다.
            </p>
            <p>
              ① 전자적 파일 형태의 정보: 복구 및 재생이 불가능한 방법으로 영구 삭제
              <br />
              ② 종이 문서: 분쇄 또는 소각
            </p>
          </Article>

          <Article num={8} title="개인정보의 안전성 확보 조치">
            <p>
              서비스는 「개인정보 보호법」 제29조에 따라 다음과 같은 안전성 확보 조치를 취하고 있습니다.
            </p>
            <p>
              ① 비밀번호 등 인증 정보의 단방향 해시 암호화 저장(Supabase Auth)
              <br />
              ② HTTPS(TLS) 전송 구간 암호화
              <br />
              ③ Row Level Security(RLS) 정책을 통한 데이터베이스 접근 권한 제어 — 회원은 본인 데이터만
              접근 가능
              <br />
              ④ 접근 권한 최소화 및 정기 점검
              <br />
              ⑤ 침입 차단 및 접속 기록 보관
            </p>
          </Article>

          <Article num={9} title="개인정보 보호책임자">
            <p>
              서비스는 정보주체의 개인정보 관련 문의·민원·피해 구제 등을 처리하기 위해 다음과 같이
              개인정보 보호책임자를 지정하고 있습니다.
            </p>
            <div className="rounded-md border border-line bg-bg-soft px-5 py-4 text-[14px] leading-[1.7]">
              <p>
                <span className="font-semibold text-ink">개인정보 보호책임자</span>
              </p>
              <p>이메일: support@kontaxt.kr</p>
              <p className="mt-2 text-[13px] text-muted">
                ※ 사업자 등록 후 상호·사업자등록번호·소재지 정보가 추가될 예정입니다.
              </p>
            </div>
          </Article>

          <Article num={10} title="권익침해 구제 방법">
            <p>
              개인정보 침해로 인한 신고·상담이 필요하신 경우 아래 기관에 문의하실 수 있습니다.
            </p>
            <p>
              ① 개인정보침해신고센터 (privacy.kisa.or.kr / 국번 없이 118)
              <br />
              ② 개인정보분쟁조정위원회 (kopico.go.kr / 1833-6972)
              <br />
              ③ 대검찰청 사이버수사과 (spo.go.kr / 국번 없이 1301)
              <br />
              ④ 경찰청 사이버수사국 (ecrm.cyber.go.kr / 국번 없이 182)
            </p>
          </Article>

          <Article num={11} title="개인정보처리방침의 변경">
            <p>
              본 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경 내용의 추가·삭제 및
              정정이 있는 경우에는 변경 사항의 시행 7일 전부터 서비스 화면을 통해 공지합니다.
            </p>
          </Article>

          <div className="mt-12 rounded-md border border-line-2 bg-bg-soft px-5 py-4 text-[13px] leading-[1.7] text-muted">
            <div className="mb-1 font-semibold text-ink-2">부칙</div>
            <div>본 방침은 {EFFECTIVE_DATE}부터 시행합니다.</div>
          </div>
        </div>
      </section>
    </>
  );
}
