# C-S2 거래소·기능 가이드 4종 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 거래소·기능별 독립 가이드 4종(`/guides/upbit-pdf-download`·`binance-csv-export`·`swap-tax-handling`·`usdt-fx-conversion`) + `/guides` 인덱스를 만들어 long-tail 검색·LLM 인용을 토픽 단위로 흡수한다.

**Architecture:** 하이브리드 source — 가이드 메타는 `lib/guides/index.ts` 데이터(인덱스·sitemap·cross-link 용), 거래소 단계는 `lib/guides/exchange-steps.ts`(통합 `/guide`와 개별 페이지가 공유 → drift 0), 각 가이드 본문은 독립 페이지 컴포넌트. 어제 PR #158(glossary)·#161(pricing) 패턴 연장.

**Tech Stack:** Next.js 14 App Router (RSC, `revalidate=86400` ISR) · TypeScript · Tailwind · vitest(데이터 무결성만) · schema.org JSON-LD

**Spec:** [docs/superpowers/specs/2026-06-01-guides-exchange-tasks-design.md](../specs/2026-06-01-guides-exchange-tasks-design.md)

**테스트 정책:** 이 레포는 페이지 컴포넌트에 vitest를 두지 않는다(엔진·계산만 테스트 — glossary·pricing 페이지도 무테스트). 단 `lib/guides/index.ts`는 sitemap·라우트에 직결돼 dangling slug가 404를 유발하므로 **데이터 무결성만 vitest로 TDD**한다. 페이지는 `next build` prerender + prod `curl` 로 검증.

**경로 주의:** 모든 경로는 repo 루트 기준. Edit/Write 시 워크트리 상대경로 사용([[feedback_absolute_path_worktree_pitfall]] — 절대경로는 메인 저장소 오염).

---

## File Structure

**PR 1 (base):**
- Create: `lib/guides/index.ts` — 가이드 메타 데이터 + 헬퍼(단일 source)
- Create: `lib/guides/__tests__/guides.test.ts` — 데이터 무결성
- Create: `lib/guides/exchange-steps.ts` — 업비트·바이낸스 단계 배열(통합·개별 페이지 공유)
- Create: `app/(marketing)/guides/page.tsx` — 인덱스 페이지
- Modify: `app/sitemap.ts` — `GUIDE_SLUGS` map 추가(9→10, 인덱스만 먼저)
- Modify: `app/robots.ts` — `PUBLIC_PATHS`에 `/guides` 추가

**PR 2 (거래소 2종):**
- Create: `app/(marketing)/guides/upbit-pdf-download/page.tsx`
- Create: `app/(marketing)/guides/binance-csv-export/page.tsx`
- Modify: `app/(marketing)/guide/page.tsx` — `exchange-steps.ts` 참조로 전환 + 거래소 카드에 "자세히 →" 링크
- Modify: `app/sitemap.ts` — 거래소 2 slug 추가(10→12) *(GUIDE_SLUGS가 자동 반영하면 코드 변경 없음 — 아래 설계 참조)*

**PR 3 (기능 2종):**
- Create: `app/(marketing)/guides/swap-tax-handling/page.tsx`
- Create: `app/(marketing)/guides/usdt-fx-conversion/page.tsx`
- Modify: `app/(marketing)/guide/page.tsx` — 기능 카드 2개 신설 + FAQ에서 SWAP·USDT 항목 이동·정리
- Modify: `app/sitemap.ts` — 기능 2 slug 추가(12→14) *(GUIDE_SLUGS 자동 반영)*

**sitemap 설계 결정:** `sitemap.ts`는 `GUIDE_SLUGS`(전체 4 slug) + 인덱스를 한 번에 추가하되, PR 1에서 `lib/guides/index.ts`에 **4 slug 전부** 정의한다. 페이지가 아직 없는 slug가 sitemap에 들어가면 크롤러 404 → PR 1에서는 `GUIDES` 배열의 `published: boolean` 플래그로 제어. `GUIDE_SLUGS`는 `published===true`만 노출. PR마다 해당 가이드를 `published: true`로 뒤집는다. 이렇게 하면 sitemap.ts는 PR 1에서 한 번만 수정하고, PR 2·3은 데이터 플래그만 변경(코드 변경 최소).

---

## PR 1 — base (lib/guides + 인덱스 + sitemap·robots)

### Task 1.1: 가이드 메타 데이터 + 무결성 테스트

**Files:**
- Create: `lib/guides/index.ts`
- Test: `lib/guides/__tests__/guides.test.ts`

- [ ] **Step 1: 데이터 파일 작성**

`lib/guides/index.ts`:

```typescript
// 거래소·기능 가이드 메타 — C-S2 (GEO long-tail 흡수 + Naver "업비트 매도 선입 선출" 신호).
//
// 본문은 각 페이지 컴포넌트(app/(marketing)/guides/<slug>/page.tsx)에 있고,
// 여기에는 인덱스 카드·sitemap·cross-link 용 메타만 둔다.
//
// published: 페이지 컴포넌트가 실제 존재하는 slug만 true. sitemap/인덱스가
// published만 노출 → 페이지 없는 slug 크롤 404 방지. PR마다 해당 가이드 true 전환.
//
// 톤: VOICE.md — Guide 친밀 영역(해요체). 세무사 언급 금지([[feedback_no_tax_agent_framing]]).

export type GuideCategory = 'exchange' | 'feature';

export interface GuideMeta {
  slug: string;
  title: string; // 페이지 h1 + 인덱스 카드 제목
  summary: string; // meta description + 인덱스 카드 본문 (한 줄, 해요체)
  category: GuideCategory;
  related: string[]; // 관련 glossary term slug (cross-link)
  published: boolean;
}

export const GUIDES: readonly GuideMeta[] = [
  {
    slug: 'upbit-pdf-download',
    title: '업비트 거래내역 PDF 받는 법',
    summary:
      '업비트에서 양도소득세 신고용 거래내역 PDF를 받아 Kontaxt에 올리는 방법을 단계별로 정리했어요.',
    category: 'exchange',
    related: ['total-average-method', 'deemed-acquisition-cost'],
    published: false,
  },
  {
    slug: 'binance-csv-export',
    title: '바이낸스 거래내역 CSV 받는 법',
    summary:
      '바이낸스에서 현물(Spot) 거래내역 CSV를 내보내 Kontaxt에 올리는 방법을 단계별로 정리했어요.',
    category: 'exchange',
    related: ['total-average-method', 'necessary-expense'],
    published: false,
  },
  {
    slug: 'swap-tax-handling',
    title: '코인 교환(SWAP)은 세금이 어떻게 매겨지나요',
    summary:
      'BTC를 ETH로 바꾸는 코인 교환은 매도와 매수 2건으로 나뉘어 과세돼요. 계산 예시로 풀었어요.',
    category: 'feature',
    related: ['total-average-method', 'tax-base'],
    published: false,
  },
  {
    slug: 'usdt-fx-conversion',
    title: 'USDT 거래는 원화로 어떻게 환산되나요',
    summary:
      'USDT 같은 외화 거래는 거래 시점 환율로 원화로 환산해 손익을 계산해요. 계산 예시로 풀었어요.',
    category: 'feature',
    related: ['total-average-method', 'tax-base'],
    published: false,
  },
];

export function getGuide(slug: string): GuideMeta | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

// sitemap·인덱스가 노출하는 slug — published만.
export const GUIDE_SLUGS: readonly string[] = GUIDES.filter(
  (g) => g.published,
).map((g) => g.slug);

// 인덱스 카드는 published 무관 전체를 카테고리별로 — 단 미published는 "준비 중" 배지.
export const GUIDES_BY_CATEGORY = {
  exchange: GUIDES.filter((g) => g.category === 'exchange'),
  feature: GUIDES.filter((g) => g.category === 'feature'),
} as const;
```

- [ ] **Step 2: 무결성 테스트 작성 (실패 확인용)**

`lib/guides/__tests__/guides.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { GUIDES, getGuide, GUIDE_SLUGS } from '../index';
import { GLOSSARY_SLUGS } from '@/lib/glossary/terms';

describe('guides 메타 무결성', () => {
  it('slug가 유니크하다', () => {
    const slugs = GUIDES.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('slug는 URL-safe kebab-case다', () => {
    for (const g of GUIDES) {
      expect(g.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('category는 exchange 또는 feature다', () => {
    for (const g of GUIDES) {
      expect(['exchange', 'feature']).toContain(g.category);
    }
  });

  it('related는 모두 실재하는 glossary term이다 (dangling cross-link 방지)', () => {
    for (const g of GUIDES) {
      for (const r of g.related) {
        expect(GLOSSARY_SLUGS).toContain(r);
      }
    }
  });

  it('title·summary는 비어 있지 않다', () => {
    for (const g of GUIDES) {
      expect(g.title.length).toBeGreaterThan(0);
      expect(g.summary.length).toBeGreaterThan(0);
    }
  });

  it('getGuide는 slug로 조회된다', () => {
    expect(getGuide('upbit-pdf-download')?.category).toBe('exchange');
    expect(getGuide('nonexistent')).toBeUndefined();
  });

  it('GUIDE_SLUGS는 published만 포함한다', () => {
    for (const slug of GUIDE_SLUGS) {
      expect(getGuide(slug)?.published).toBe(true);
    }
  });
});
```

- [ ] **Step 3: 테스트 실행 — related dangling 검증이 핵심**

Run: `npm test -- guides.test`
Expected: PASS (단 `related`에 적은 glossary slug가 실재해야 함 — `taxable-base`·`necessary-expense`·`total-average-method`·`deemed-acquisition-cost`가 `lib/glossary/terms.ts`에 있는지 확인. 없으면 FAIL → 실재하는 slug로 교정).

먼저 확인: `grep -E "slug: '(taxable-base|necessary-expense|total-average-method|deemed-acquisition-cost)'" lib/glossary/terms.ts`
4개 다 나와야 함. 없는 게 있으면 GUIDES의 related에서 실재 slug로 바꾼다.

- [ ] **Step 4: 커밋**

```bash
git add lib/guides/index.ts lib/guides/__tests__/guides.test.ts
git commit -m "feat(guides): 가이드 메타 데이터 + 무결성 테스트 (C-S2 base)"
```

### Task 1.2: 거래소 단계 데이터 추출

**Files:**
- Create: `lib/guides/exchange-steps.ts`

`/guide/page.tsx`의 `UPBIT_STEPS`(6단계)·`BINANCE_STEPS`(7단계)를 그대로 옮겨 단일 source로 만든다. 통합 `/guide`와 개별 페이지(PR 2)가 둘 다 import → drift 0.

- [ ] **Step 1: 단계 데이터 추출**

`lib/guides/exchange-steps.ts`:

```typescript
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
```

- [ ] **Step 2: typecheck**

Run: `npm run typecheck`
Expected: PASS (아직 import하는 곳 없음 — 정의만)

- [ ] **Step 3: 커밋**

```bash
git add lib/guides/exchange-steps.ts
git commit -m "feat(guides): 업비트·바이낸스 단계 데이터 추출 (공유 source)"
```

### Task 1.3: /guides 인덱스 페이지

**Files:**
- Create: `app/(marketing)/guides/page.tsx`

glossary 인덱스 페이지(`app/(marketing)/glossary/page.tsx`) 구조를 따른다. 차이: 카테고리 2개(거래소/기능) 구분 + 미published는 "준비 중" 배지 + `ItemList` JSON-LD.

- [ ] **Step 1: 인덱스 페이지 작성**

`app/(marketing)/guides/page.tsx`:

```tsx
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
```

- [ ] **Step 2: VOICE grep 3종 (0건 확인)**

Run: CLAUDE.md 작업패턴 5)의 grep 3종을 `app/(marketing)/guides/page.tsx`에 실행
Expected: 모두 0건. (특히 `!`·"여러분"·copula "강력하고" 등)

- [ ] **Step 3: 커밋**

```bash
git add "app/(marketing)/guides/page.tsx"
git commit -m "feat(guides): /guides 인덱스 페이지 (카테고리 2 + ItemList schema)"
```

### Task 1.4: sitemap + robots 갱신

**Files:**
- Modify: `app/sitemap.ts`
- Modify: `app/robots.ts`

- [ ] **Step 1: sitemap에 인덱스 + GUIDE_SLUGS 추가**

`app/sitemap.ts`의 import에 추가:
```typescript
import { GUIDE_SLUGS } from '@/lib/guides';
```

`glossary` 블록 다음(배열 끝 `]` 직전)에 추가:
```typescript
    {
      url: `${SITE_URL}/guides`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...GUIDE_SLUGS.map((slug) => ({
      url: `${SITE_URL}/guides/${slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
```

PR 1 시점 `GUIDE_SLUGS`는 빈 배열(전부 published:false)이라 `/guides` 인덱스만 추가됨(9→10). PR 2·3에서 published 전환 시 자동 증가.

- [ ] **Step 2: robots PUBLIC_PATHS에 /guides 추가**

`app/robots.ts`의 `PUBLIC_PATHS` 배열에 `'/guides'` 추가:
```typescript
const PUBLIC_PATHS = ['/', '/pricing', '/sample', '/login', '/signup', '/guide', '/guides', '/simulator', '/glossary', '/legal/terms', '/legal/privacy'];
```
(`allow`는 prefix 매칭이라 `/guides` 한 줄로 `/guides/*` 4 가이드 전부 커버 — glossary가 `/glossary`만으로 개별 term 커버하는 것과 동일.)

- [ ] **Step 3: 빌드 검증**

Run: `npm run typecheck && npm run build 2>&1 | grep -E "guides|sitemap|Static|error"`
Expected: `/guides` 가 `○ (Static)` prerender 목록에 나옴. error 0.

- [ ] **Step 4: 커밋**

```bash
git add app/sitemap.ts app/robots.ts
git commit -m "feat(seo): /guides sitemap + robots 추가 (GUIDE_SLUGS published 연동)"
```

### Task 1.5: PR 1 검증 + 생성

- [ ] **Step 1: 전체 검증**

Run: `npm run typecheck && npm test`
Expected: typecheck PASS + 전체 테스트 PASS (guides.test 신규 7건 포함)

- [ ] **Step 2: 빌드 prerender 확인**

Run: `npm run build 2>&1 | grep -A2 "guides"`
Expected: `/guides` `○ (Static)`. 4 가이드 라우트는 아직 없음(정상).

- [ ] **Step 3: 푸시 + PR**

```bash
git push -u origin claude/charming-swirles-2e55ec
gh pr create --title "feat(guides): C-S2 base — lib/guides + /guides 인덱스 + sitemap·robots" --body "$(cat <<'EOF'
## C-S2 가이드 base (PR 1/3)

거래소·기능 가이드 4종의 공통 토대.

- `lib/guides/index.ts` — 가이드 메타 단일 source + `published` 플래그(페이지 없는 slug sitemap 404 방지)
- `lib/guides/__tests__/guides.test.ts` — 무결성 7건 (slug 유니크·kebab·related dangling 방지 등)
- `lib/guides/exchange-steps.ts` — 업비트·바이낸스 단계 추출(통합·개별 페이지 공유)
- `/guides` 인덱스 페이지 — 카테고리 2(거래소/기능) + ItemList JSON-LD + 미published "준비 중" 배지
- sitemap 9→10(인덱스) + robots `/guides` allow

다음: PR 2(거래소 2종) → PR 3(기능 2종).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: 머지 (사용자 `ㄱㄱ` 후)** — CI(typecheck·vitest) PASS 확인 후 `gh pr merge --squash`. prod 머지 후 `curl -I https://kontaxt.kr/guides` → 200 + `curl -s https://kontaxt.kr/sitemap.xml | grep guides` → `/guides` 1건([[feedback_prod_url_resolve_verify]]).

---

## PR 2 — 거래소 2종 + /guide 전환

> PR 1 머지 후 origin/main 기반 새 브랜치. `git fetch origin && git checkout -b claude/guides-exchange origin/main`

### Task 2.1: /guides/upbit-pdf-download 페이지

**Files:**
- Create: `app/(marketing)/guides/upbit-pdf-download/page.tsx`

`/glossary/[slug]/page.tsx`의 골격(뒤로가기 링크 + Eyebrow + h1 + 본문 + 근거 박스 + 관련 cross-link)을 따르되, 본문은 단계 리스트 + 박스 + HowTo schema.

- [ ] **Step 1: 페이지 작성**

`app/(marketing)/guides/upbit-pdf-download/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionEyebrow } from '@/components/ui/section-heading';
import { BreadcrumbJsonLd } from '@/components/seo/Breadcrumb';
import { SITE_URL } from '@/lib/site';
import { getGuide } from '@/lib/guides';
import { UPBIT_STEPS } from '@/lib/guides/exchange-steps';
import { getGlossaryTerm } from '@/lib/glossary/terms';

const guide = getGuide('upbit-pdf-download')!;

export const revalidate = 86400;

export const metadata: Metadata = {
  title: `${guide.title} — Kontaxt`,
  description: guide.summary,
  alternates: { canonical: `/guides/${guide.slug}` },
  openGraph: { title: `${guide.title} — Kontaxt`, description: guide.summary, url: `/guides/${guide.slug}` },
};

export default function UpbitPdfGuidePage() {
  const related = guide.related
    .map((s) => getGlossaryTerm(s))
    .filter((t): t is NonNullable<typeof t> => t != null);

  const howTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: guide.title,
    description: guide.summary,
    step: UPBIT_STEPS.map((s) => ({
      '@type': 'HowToStep',
      position: s.n,
      name: s.title,
      text: s.desc,
    })),
  };

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Kontaxt', path: '' },
          { name: '가이드', path: '/guides' },
          { name: guide.title, path: `/guides/${guide.slug}` },
        ]}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }} />

      <section className="section-pad pb-6">
        <div className="mx-auto max-w-content">
          <Link href="/guides" className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-brand">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            가이드
          </Link>
          <SectionEyebrow>UPBIT</SectionEyebrow>
          <h1 className="mb-3 text-[32px] font-extrabold leading-[1.14] tracking-tighter3 text-ink lg:text-[44px]">
            {guide.title}
          </h1>
          <p className="max-w-[600px] text-[16px] leading-[1.7] text-ink-2 text-pretty">
            업비트는 거래내역 전체를 PDF 한 파일로 받을 수 있어서 가장 간편해요. 매수·매도·입출금이 한 번에 들어가요.
          </p>
        </div>
      </section>

      <section className="section-pad pt-0">
        <div className="mx-auto flex max-w-content flex-col gap-8">
          <ol className="flex flex-col gap-4">
            {UPBIT_STEPS.map((s) => (
              <li key={s.n} className="flex gap-4">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-faint text-[14px] font-bold text-brand">
                  {s.n}
                </div>
                <div className="min-w-0 flex-1 pb-1">
                  <div className="text-[15px] font-bold text-ink">{s.title}</div>
                  <p className="mt-1 text-[14px] leading-[1.65] text-muted">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="rounded-md border border-warn/40 bg-warn-soft px-5 py-4 text-[13.5px] leading-[1.65] text-warn">
            <span className="font-semibold">자주 막히는 곳</span> · 모바일 앱에서는 PDF 출력 버튼이 없어요. 꼭 PC 브라우저에서 진행해 주세요. 기간을 좁게 잡으면 일부 거래가 빠질 수 있으니, 신고 대상 연도 전체나 [전체]를 골라 주세요.
          </div>

          {related.length > 0 && (
            <div className="border-t border-line-2 pt-6">
              <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-2">관련 용어</div>
              <div className="flex flex-wrap gap-2">
                {related.map((r) => (
                  <Link key={r.slug} href={`/glossary/${r.slug}`} className="rounded-full border border-line bg-card px-3.5 py-1.5 text-[13px] font-medium text-ink-2 transition-colors hover:border-brand/40 hover:text-brand">
                    {r.term}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Link href="/transactions/upload" className="self-start rounded-sm bg-brand px-5 py-3 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-brand-2">
            업로드 페이지로 이동
          </Link>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 2: published 전환** — `lib/guides/index.ts`의 `upbit-pdf-download` `published: false` → `true`.

- [ ] **Step 3: VOICE grep 3종 (0건)** — 새 페이지 + 변경된 data 파일.

- [ ] **Step 4: 커밋**

```bash
git add "app/(marketing)/guides/upbit-pdf-download/page.tsx" lib/guides/index.ts
git commit -m "feat(guides): /guides/upbit-pdf-download + published 전환"
```

### Task 2.2: /guides/binance-csv-export 페이지

**Files:**
- Create: `app/(marketing)/guides/binance-csv-export/page.tsx`

- [ ] **Step 1: 2.1 페이지 복사** (fresh subagent도 실재 파일 기반으로 작업)

Run:
```bash
mkdir -p "app/(marketing)/guides/binance-csv-export"
cp "app/(marketing)/guides/upbit-pdf-download/page.tsx" "app/(marketing)/guides/binance-csv-export/page.tsx"
```

- [ ] **Step 2: 복사본 수정** — 복사한 파일에 다음 Edit:
1. `import { UPBIT_STEPS }` → `import { BINANCE_STEPS }`
2. `const guide = getGuide('upbit-pdf-download')!;` → `const guide = getGuide('binance-csv-export')!;`
3. 컴포넌트명 `export default function UpbitPdfGuidePage()` → `BinanceCsvGuidePage()`
4. `<SectionEyebrow>UPBIT</SectionEyebrow>` → `<SectionEyebrow>BINANCE</SectionEyebrow>`
5. Hero `<p>` 본문 → `바이낸스는 거래내역을 CSV로 내보내요. 현물(Spot)만 한국 양도소득세 대상이라, 내보낼 때 계정 유형을 꼭 Spot으로 골라 주세요.`
6. `UPBIT_STEPS.map` 2곳(ol 렌더 + HowTo schema step) → `BINANCE_STEPS.map`
7. 경고 박스 `<div>` 텍스트 → `자주 막히는 곳 · 한 번에 최대 3개월까지만 받아져요. 1년치는 4번 나눠 받아서 다 올리면 자동으로 합쳐져요. Futures(선물)는 한국 세법상 파생상품 카테고리라 지원하지 않아요 — 계정 유형에서 Spot인지 꼭 확인하세요.`

- [ ] **Step 3: published 전환** — `binance-csv-export` `published: true`.

- [ ] **Step 4: VOICE grep 3종 (0건)**

- [ ] **Step 5: 커밋**

```bash
git add "app/(marketing)/guides/binance-csv-export/page.tsx" lib/guides/index.ts
git commit -m "feat(guides): /guides/binance-csv-export + published 전환"
```

### Task 2.3: /guide 통합 페이지 → exchange-steps 참조 전환 + 카드 링크

**Files:**
- Modify: `app/(marketing)/guide/page.tsx`

- [ ] **Step 1: 단계 데이터 import 전환**

`app/(marketing)/guide/page.tsx` 상단의 로컬 `interface Step`·`const UPBIT_STEPS`·`const BINANCE_STEPS` 정의(L16~L91)를 삭제하고 import로 교체:
```typescript
import { UPBIT_STEPS, BINANCE_STEPS, type GuideStep } from '@/lib/guides/exchange-steps';
```
`StepCard`·`ExchangeGuideCard`의 `s: Step`·`steps: readonly Step[]` 타입을 `GuideStep`으로 변경. HowTo schema 블록은 그대로(같은 배열 참조).

> **(PR 1 code-quality review 노트)** reviewer가 `GuideStep.n`(=index+1) 중복 → reorder drift 위험 지적. **검토 결과 n 유지 결정**: 기존 StepCard `0{s.n}` 라벨 + HowTo `position: s.n`이 1-index에 의존하고, `readonly` 배열이라 실제 drift 가능성 낮음, HowTo position에 명시 1-index가 자연스러움. n 제거 시 2.1·2.2·2.3 전부 `i+1` derive 동반 수정이라 이득 대비 비용 큼. PR 2에서 재고민 불필요 — n 그대로 사용.

- [ ] **Step 2: 거래소 카드에 "자세히 →" 링크 추가**

`ExchangeGuideCard`에 `href` prop 추가, 카드 하단(note 아래)에 링크:
```tsx
// props에 추가: href: string;
// note 블록 다음:
      <Link href={href} className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand transition-colors hover:text-brand-2">
        자세한 단계 보기
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </Link>
```
업비트 카드 `href="/guides/upbit-pdf-download"`, 바이낸스 카드 `href="/guides/binance-csv-export"`. (`Link`는 이미 import됨.)

- [ ] **Step 3: typecheck + 빌드 + VOICE grep**

Run: `npm run typecheck && npm run build 2>&1 | grep -E "guide|error"`
Expected: `/guide` + `/guides/upbit-pdf-download` + `/guides/binance-csv-export` 전부 `○ (Static)`. drift 검증 — UPBIT_STEPS 단계 텍스트가 통합·개별 동일(같은 import).
VOICE grep 3종 0건.

- [ ] **Step 4: 커밋**

```bash
git add "app/(marketing)/guide/page.tsx"
git commit -m "refactor(guide): 단계 데이터 exchange-steps 참조 + 거래소 카드 상세 링크"
```

### Task 2.4: PR 2 검증 + 생성 + 머지

- [ ] **Step 1: 전체 검증** — `npm run typecheck && npm test` PASS.
- [ ] **Step 2: 빌드 prerender** — `npm run build 2>&1 | grep guides` → 2 거래소 가이드 `○ (Static)`.
- [ ] **Step 3: PR 생성** — `gh pr create`, 본문에 "거래소 2종 + /guide 단계 단일 source 전환(drift 0) + 카드 상세 링크. sitemap 10→12(published 전환 자동)".
- [ ] **Step 4: 머지 (사용자 `ㄱㄱ` 후)** + prod `curl -I /guides/upbit-pdf-download`·`/guides/binance-csv-export` 200 + `curl -s <url> | grep -o 'HowTo'` emit + sitemap에 2건 증가 확인.

---

## PR 3 — 기능 2종 (SWAP·USDT 계산 예시 + 세법 대조)

> PR 2 머지 후 origin/main 기반 새 브랜치.

### Task 3.1: /guides/swap-tax-handling 페이지

**Files:**
- Create: `app/(marketing)/guides/swap-tax-handling/page.tsx`

**계산 예시는 엔진(`normalizer.ts:37` isSwap → SELL+BUY 분해)·세법(총평균법 §88①, 250만 공제·22% §64의3②)과 일치해야 함.** 아래 숫자는 검증된 값:
- BTC 0.5개를 ETH로 교환. 교환 시점 BTC 시세 6,000만원/개, ETH 시세 400만원/개.
- **BTC 매도분**: 양도가액 = 0.5 × 6,000만원 = **3,000만원**. BTC 연 총평균 취득단가가 5,000만원/개였다면 취득원가 = 0.5 × 5,000만원 = **2,500만원** → 양도차익 = **500만원**.
- **ETH 매수분**: 3,000만원으로 ETH 7.5개 취득(3,000만원 ÷ 400만원). 이 3,000만원이 ETH의 취득가액이 돼요.
- 단서: 실제 취득단가는 거래 1건이 아니라 **연 단위 총평균**으로 정해지고, 세액은 연간 손익을 다 합산한 뒤 250만원 공제 후 22%예요(이 예시는 교환 1건만 떼어 본 것).

검증 step: 구현 전 `grep -nA20 "isSwap" lib/engine/normalizer.ts`로 SELL+BUY 분해·quote 환율 로직 재확인. `law/kontaxt_법률_가이드.md` §10에서 총평균법 §88①·250만/22% §64의3② 재확인.

- [ ] **Step 1: 페이지 작성**

`app/(marketing)/guides/swap-tax-handling/page.tsx` — 골격은 2.1과 동일(뒤로가기·Eyebrow·h1·본문·관련 용어·CTA)하되 schema는 `Article`, 본문은 단계가 아니라 설명 단락 + 계산 예시 박스:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionEyebrow } from '@/components/ui/section-heading';
import { BreadcrumbJsonLd } from '@/components/seo/Breadcrumb';
import { SITE_URL } from '@/lib/site';
import { getGuide } from '@/lib/guides';
import { getGlossaryTerm } from '@/lib/glossary/terms';

const guide = getGuide('swap-tax-handling')!;

export const revalidate = 86400;

export const metadata: Metadata = {
  title: `${guide.title} — Kontaxt`,
  description: guide.summary,
  alternates: { canonical: `/guides/${guide.slug}` },
  openGraph: { title: `${guide.title} — Kontaxt`, description: guide.summary, url: `/guides/${guide.slug}` },
};

export default function SwapTaxGuidePage() {
  const related = guide.related
    .map((s) => getGlossaryTerm(s))
    .filter((t): t is NonNullable<typeof t> => t != null);

  const article = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.summary,
    author: { '@type': 'Organization', name: 'Kontaxt' },
    publisher: { '@type': 'Organization', name: 'Kontaxt' },
    mainEntityOfPage: `${SITE_URL}/guides/${guide.slug}`,
  };

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Kontaxt', path: '' },
          { name: '가이드', path: '/guides' },
          { name: guide.title, path: `/guides/${guide.slug}` },
        ]}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }} />

      <section className="section-pad pb-6">
        <div className="mx-auto max-w-content">
          <Link href="/guides" className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-brand">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            가이드
          </Link>
          <SectionEyebrow>SWAP</SectionEyebrow>
          <h1 className="mb-3 text-[32px] font-extrabold leading-[1.14] tracking-tighter3 text-ink lg:text-[44px]">
            {guide.title}
          </h1>
          <p className="max-w-[600px] text-[16px] leading-[1.7] text-ink-2 text-pretty">
            BTC를 ETH로 바꾸는 코인 교환은 원화가 한 푼도 오가지 않아도 세금이 매겨져요. 교환은 "가진 코인을 팔고 → 새 코인을 사는" 2건의 거래로 보거든요.
          </p>
        </div>
      </section>

      <section className="section-pad pt-0">
        <div className="mx-auto flex max-w-content flex-col gap-5">
          <p className="text-[16px] leading-[1.75] text-ink-2 text-pretty">
            예를 들어 비트코인을 이더리움으로 교환하면, 세법은 이걸 "비트코인 매도 + 이더리움 매수" 2건으로 나눠서 봐요. 비트코인 매도분에서는 양도차익이 생기고, 받은 이더리움은 그 시점 가치가 새 취득가액이 돼요.
          </p>
          <p className="text-[16px] leading-[1.75] text-ink-2 text-pretty">
            한국 거주자는 취득가액을 연 단위 총평균법으로 산정해요(소득세법 시행령 §88①). 그래서 교환으로 매도한 코인의 취득원가도 그해 평균 매수단가를 따라요.
          </p>

          <div className="rounded-[12px] border border-line bg-bg-soft px-6 py-5">
            <div className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-muted-2">계산 예시</div>
            <ul className="flex flex-col gap-2 text-[14.5px] leading-[1.7] text-ink-2">
              <li>· 비트코인 0.5개를 이더리움으로 교환 (교환 시점 비트코인 6,000만원, 이더리움 400만원)</li>
              <li>· <span className="font-semibold text-ink">비트코인 매도분</span> — 양도가액 0.5 × 6,000만원 = <span className="num">3,000만원</span>. 그해 총평균 취득단가가 5,000만원이었다면 취득원가 <span className="num">2,500만원</span> → 양도차익 <span className="num">500만원</span></li>
              <li>· <span className="font-semibold text-ink">이더리움 매수분</span> — 3,000만원어치(7.5 ETH)를 새로 취득한 것으로 봐요. 이 3,000만원이 이더리움의 취득가액이 돼요</li>
            </ul>
            <p className="mt-3 text-[12.5px] leading-[1.6] text-muted">
              실제 취득단가는 교환 1건이 아니라 그해 전체 매수를 평균한 값이에요. 세액은 연간 손익을 모두 합산한 뒤 250만원을 공제하고 22%(지방세 포함)를 매겨요. 위는 교환 1건만 떼어 본 거예요.
            </p>
          </div>

          <p className="text-[16px] leading-[1.75] text-ink-2 text-pretty">
            Kontaxt는 거래내역에서 교환 거래를 자동으로 찾아 매도·매수 2건으로 나누고, 양쪽 모두 총평균 단가 산정에 반영해요. 직접 나눌 필요가 없어요.
          </p>

          {related.length > 0 && (
            <div className="border-t border-line-2 pt-6">
              <div className="mb-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-2">관련 용어</div>
              <div className="flex flex-wrap gap-2">
                {related.map((r) => (
                  <Link key={r.slug} href={`/glossary/${r.slug}`} className="rounded-full border border-line bg-card px-3.5 py-1.5 text-[13px] font-medium text-ink-2 transition-colors hover:border-brand/40 hover:text-brand">
                    {r.term}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <Link href="/transactions/upload" className="self-start rounded-sm bg-brand px-5 py-3 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-brand-2">
            업로드 페이지로 이동
          </Link>
        </div>
      </section>
    </>
  );
}
```

- [ ] **Step 2: published 전환** — `swap-tax-handling` `published: true`.
- [ ] **Step 3: 세법 대조 + VOICE grep** — 위 검증 step의 normalizer·law 재확인 완료 + grep 3종 0건. (related slug `tax-base`(과세표준)·`total-average-method`는 glossary 실재 확인됨 — plan 작성 시 grep 검증.)
- [ ] **Step 4: 커밋**

```bash
git add "app/(marketing)/guides/swap-tax-handling/page.tsx" lib/guides/index.ts
git commit -m "feat(guides): /guides/swap-tax-handling (계산 예시 + 세법 §88① 대조)"
```

### Task 3.2: /guides/usdt-fx-conversion 페이지

**Files:**
- Create: `app/(marketing)/guides/usdt-fx-conversion/page.tsx`

**계산 예시는 엔진(`normalizer.ts` quoteCurrency→KRW, `pricePerUnitKRW = pricePerUnit × rateKRW`, daily_rates DB)과 일치.** 검증된 값:
- 바이낸스에서 비트코인 1개를 60,000 USDT에 매도. 매도 시점 USDT/KRW = 1,380원.
- 양도가액(KRW) = 60,000 × 1,380 = **8,280만원**.
- 그 비트코인을 45,000 USDT(취득 시점 USDT/KRW 1,300원)에 샀다면 취득원가 = 45,000 × 1,300 = **5,850만원**.
- 양도차익 = 8,280만원 − 5,850만원 = **2,430만원**.
- 핵심: 매도·매수 **각 시점의 환율**을 따로 적용해요(같은 USDT라도 시점 환율 다름).

검증 step: 구현 전 `grep -nB2 -A10 "quoteCurrency\|rateKRW" lib/engine/normalizer.ts lib/engine/types.ts`로 환율 적용 재확인.

- [ ] **Step 1: 3.1 페이지 복사** (fresh subagent도 실재 파일 기반으로 작업)

```bash
mkdir -p "app/(marketing)/guides/usdt-fx-conversion"
cp "app/(marketing)/guides/swap-tax-handling/page.tsx" "app/(marketing)/guides/usdt-fx-conversion/page.tsx"
```

- [ ] **Step 2: 복사본 수정** — 복사한 파일을 아래대로 Edit:
- `getGuide('usdt-fx-conversion')!`, 컴포넌트명 `UsdtFxGuidePage`, `<SectionEyebrow>USDT · 환율</SectionEyebrow>`
- Hero 본문: `USDT나 USD로 한 거래도 한국 세금은 원화 기준이에요. 그래서 거래가 일어난 그 시점의 환율로 원화로 환산해서 손익을 계산해요.`
- 본문 단락 2개:
  1. `바이낸스 BTC/USDT 거래처럼 원화가 아닌 통화로 사고팔면, Kontaxt는 거래 시각의 USDT/KRW 환율을 적용해 원화 기준 양도가액·취득가액을 구해요.`
  2. `중요한 건 매도와 매수가 각각 그 시점 환율을 따로 쓴다는 거예요. 같은 USDT여도 산 날과 판 날의 원화 가치가 다르니까요. 환율 데이터는 매일 갱신되는 출처(daily_rates)를 써요.`
- 계산 예시 박스(li 3개):
  - `· 바이낸스에서 비트코인 1개를 60,000 USDT에 매도 (매도 시점 USDT/KRW 1,380원)`
  - `· 양도가액 — 60,000 × 1,380원 = <span class="num">8,280만원</span>`
  - `· 예전에 45,000 USDT(취득 시점 1,300원)에 샀다면 취득원가 45,000 × 1,300원 = <span class="num">5,850만원</span> → 양도차익 <span class="num">2,430만원</span>`
  - 단서(muted): `매도·매수 시점의 환율을 각각 적용해요. 세액은 연간 손익을 합산한 뒤 250만원 공제 후 22%를 매겨요.`
- 마무리 단락: `Kontaxt는 외화 거래를 자동으로 인식해 시점별 환율로 환산하니, 환율을 직접 찾아 넣을 필요가 없어요.`
- schema는 `Article`(3.1과 동일 구조, `guide` 변수만 다름), Breadcrumb·related·CTA 동일.

- [ ] **Step 3: published 전환** — `usdt-fx-conversion` `published: true`.
- [ ] **Step 4: 세법·환율 대조 + VOICE grep 0건**
- [ ] **Step 5: 커밋**

```bash
git add "app/(marketing)/guides/usdt-fx-conversion/page.tsx" lib/guides/index.ts
git commit -m "feat(guides): /guides/usdt-fx-conversion (환율 환산 계산 예시)"
```

### Task 3.3: /guide 기능 카드 신설 + FAQ 정리

**Files:**
- Modify: `app/(marketing)/guide/page.tsx`

- [ ] **Step 1: 기능 카드 2개 신설**

거래소 카드 섹션(`<section id="exchanges">`) 다음에 기능 가이드 카드 2개 섹션 추가. 간단한 링크 카드(제목 + 요약 + 자세히):
```tsx
      <section className="section-pad pt-0">
        <div className="mx-auto max-w-content">
          <div className="mb-8 text-center">
            <SectionEyebrow>FEATURE GUIDES</SectionEyebrow>
            <h2 className="text-[28px] font-extrabold leading-[1.2] tracking-tighter3 text-ink lg:text-[36px]">
              세금 처리가 헷갈리는 거래.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { slug: 'swap-tax-handling', title: '코인 교환(SWAP) 세금', desc: 'BTC를 ETH로 바꾸면 매도+매수 2건으로 과세돼요.' },
              { slug: 'usdt-fx-conversion', title: 'USDT 원화 환산', desc: '외화 거래는 거래 시점 환율로 원화로 환산해요.' },
            ].map((c) => (
              <Link key={c.slug} href={`/guides/${c.slug}`} className="group flex flex-col rounded-[14px] border border-line bg-card p-6 shadow-sm transition-[border-color,box-shadow] hover:border-brand/40 hover:shadow-md">
                <span className="text-[16px] font-bold text-ink group-hover:text-brand">{c.title}</span>
                <p className="mt-2 text-[13.5px] leading-[1.6] text-muted">{c.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
```

- [ ] **Step 2: FAQ에서 SWAP·USDT 항목 정리**

`/guide`의 `FAQ` 배열에서 "USDT 같은 외화 거래는 어떻게 처리되나요"·"코인 간 교환(SWAP)은 어떻게 처리되나요" 2건을 **요약 후 링크로** 교체(중복 콘텐츠 회피 — canonical은 개별 가이드):
- SWAP FAQ `a`: `BTC를 ETH로 바꾸면 "매도 + 매수" 2건으로 나뉘어 양쪽 다 총평균 단가에 반영돼요. 자세한 계산 예시는 코인 교환 가이드에서 볼 수 있어요.`
- USDT FAQ `a`: `원화가 아닌 통화 거래는 거래 시점 환율로 원화로 환산해요. 자세한 계산 예시는 USDT 환산 가이드에서 볼 수 있어요.`
(FAQPage schema는 그대로 — 답변 텍스트만 축약. 8건 유지.)

- [ ] **Step 3: typecheck + 빌드 + VOICE grep 0건**

Run: `npm run typecheck && npm run build 2>&1 | grep -E "guides|guide|error"`
Expected: `/guide` + 4 `/guides/*` 전부 `○ (Static)`. error 0.

- [ ] **Step 4: 커밋**

```bash
git add "app/(marketing)/guide/page.tsx"
git commit -m "feat(guide): 기능 가이드 카드 2 신설 + FAQ SWAP·USDT 링크 정리"
```

### Task 3.4: PR 3 검증 + 생성 + 머지

- [ ] **Step 1: 전체 검증** — `npm run typecheck && npm test` PASS.
- [ ] **Step 2: 세법 최종 대조** — SWAP·USDT 계산 예시 숫자가 본 plan의 검증값과 일치 + law §10(총평균법 §88①·250만/22% §64의3②) 정합. [[reference_law_folder_verification]] 본법↔시행령 구분 확인.
- [ ] **Step 3: 빌드 prerender** — 4 가이드 전부 `○ (Static)`, sitemap 14 URL.
- [ ] **Step 4: PR 생성 + 머지 (사용자 `ㄱㄱ` 후)** — prod `curl -I /guides/swap-tax-handling`·`/guides/usdt-fx-conversion` 200 + `Article` emit + sitemap 14건.

---

## 완료 후

- [ ] TASKS.md Phase 9 S2 `- [ ]` → `- [x]` + PR 링크 ([[feedback_auto_todo_sync]])
- [ ] vault Daily 2026-06-01 기록
- [ ] 메모리: 필요 시 가이드 패턴 메모(glossary와 다른 하이브리드 source 결정)
```
