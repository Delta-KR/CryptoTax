import { HoverCard } from '@/components/ui/HoverCard';
import {
  SectionEyebrow,
  SectionLead,
  SectionTitle,
} from '@/components/ui/section-heading';

interface Item {
  title: string;
  desc: string;
  icon: React.ReactNode;
}

const ITEMS: readonly Item[] = [
  {
    title: '거래내역 비저장',
    desc: '업로드한 거래내역 파일은 계산 직후 폐기합니다. 계산 결과는 본인 브라우저에만 저장됩니다.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path
          d="M9 13l6 4M15 13l-6 4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: '본인 데이터만 접근',
    desc: 'Supabase Row Level Security로 본인 계정의 row만 조회·수정 가능합니다. 운영자도 임의 조회할 수 없습니다.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3l8 3v6c0 4-3.5 7.5-8 9-4.5-1.5-8-5-8-9V6l8-3z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M9 12l2 2 4-4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: '결제정보 비저장',
    desc: '카드번호·CVC는 PG사(포트원)에서 직접 토큰화합니다. 결제 정보는 우리 데이터베이스에 들어오지 않습니다.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect
          x="3"
          y="6"
          width="18"
          height="13"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path d="M3 11h18" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M7 15h3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

function SecurityCard({ item }: { item: Item }) {
  return (
    <HoverCard className="rounded-lg border border-line bg-card p-7 shadow-sm">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-md bg-brand-soft text-brand">
        {item.icon}
      </div>
      <h3 className="mb-2.5 text-[18px] font-bold tracking-tightish text-ink">
        {item.title}
      </h3>
      <p className="text-sm leading-[1.65] text-muted text-pretty">{item.desc}</p>
    </HoverCard>
  );
}

export function Security() {
  return (
    <section id="security" className="section-pad">
      <div className="mx-auto max-w-content">
        <div className="mb-14 text-center">
          <SectionEyebrow>SECURITY</SectionEyebrow>
          <SectionTitle className="mx-auto">
            내 데이터는
            <br />
            어떻게 보호돼요?
          </SectionTitle>
          <SectionLead className="mx-auto">
            한국 핀테크 표준 그대로. 안 받을 데이터는 처음부터 안 받아요.
          </SectionLead>
        </div>

        <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-4 lg:grid-cols-3">
          {ITEMS.map((item) => (
            <SecurityCard key={item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
