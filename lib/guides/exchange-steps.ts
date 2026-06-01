// 거래소 거래내역 다운로드 단계 — /guide 통합 페이지와 /guides/<exchange> 개별 페이지가 공유.
// 기존 app/(marketing)/guide/page.tsx 의 UPBIT_STEPS·BINANCE_STEPS 를 단일 source 로 추출.
// 톤: VOICE.md Guide 해요체.

export interface GuideStep {
  n: number;
  title: string;
  desc: string;
}

export const UPBIT_STEPS: readonly GuideStep[] = [
  {
    n: 1,
    title: '업비트 웹사이트 로그인',
    desc: 'upbit.com에 접속해서 본인 계정으로 로그인하세요. 모바일 앱은 PDF 출력이 안 되니까 PC에서 진행해 주세요.',
  },
  {
    n: 2,
    title: '거래내역 페이지로 이동',
    desc: '상단 메뉴 [내정보] → [거래내역]을 누르세요. 주소창에 upbit.com/investments/history 를 직접 쳐도 돼요.',
  },
  {
    n: 3,
    title: '양도소득 탭 선택',
    desc: '거래내역 화면 상단의 [양도소득] 또는 [전체 내역] 탭을 누르세요.',
  },
  {
    n: 4,
    title: '기간 설정',
    desc: '조회할 기간(연도별 또는 전체)을 골라 주세요. 보통 신고 대상 연도 전체를 고르면 돼요.',
  },
  {
    n: 5,
    title: 'PDF 출력',
    desc: '화면 우측이나 하단의 [PDF 출력] 버튼을 누르면 .pdf 파일이 자동으로 받아져요.',
  },
  {
    n: 6,
    title: 'Kontaxt에 업로드',
    desc: '받은 PDF를 업로드 페이지의 [업비트] 탭에 끌어다 놓으세요. 자동으로 파싱·계산이 돼요.',
  },
];

export const BINANCE_STEPS: readonly GuideStep[] = [
  {
    n: 1,
    title: 'Binance에 로그인',
    desc: 'binance.com에 접속해서 로그인하세요. 2FA가 켜져 있으면 인증까지 완료해 주세요.',
  },
  {
    n: 2,
    title: 'Wallet 메뉴 진입',
    desc: '우측 상단 [Wallet] → [Transaction History] (한국어 환경에서는 [지갑] → [거래 내역])를 누르세요.',
  },
  {
    n: 3,
    title: 'Export 버튼 클릭',
    desc: '거래 내역 페이지 우측 상단의 [Export Transaction Records] 또는 [내보내기]를 누르세요.',
  },
  {
    n: 4,
    title: 'Spot(현물) 선택 — 중요',
    desc: 'Account type에서 반드시 [Spot]을 골라 주세요. Futures(선물)는 한국 세법상 별도 카테고리라 지원하지 않아요.',
  },
  {
    n: 5,
    title: '기간 + CSV 형식',
    desc: '한 번에 최대 3개월씩 조회할 수 있어요. 1년치가 필요하면 4번 나눠 받으면 돼요. 파일 형식은 CSV로 골라 주세요.',
  },
  {
    n: 6,
    title: '제출 후 이메일 또는 다운로드 페이지 확인',
    desc: 'Submit 누른 다음 처리가 끝나면 가입 이메일로 다운로드 링크가 와요. Binance의 [Generated Reports] 페이지에서 직접 받아도 돼요.',
  },
  {
    n: 7,
    title: 'Kontaxt에 업로드',
    desc: '받은 .csv 파일을 업로드 페이지의 [바이낸스] 탭에 끌어다 놓으세요. 기간별 파일이 여러 개여도 순서 상관없이 올리시면 돼요.',
  },
];
