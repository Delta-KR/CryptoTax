# `/pricing` 독립 페이지 (C-S5) — Design

> 2026-05-31. GEO Strategic Investments S5. 홈 `#pricing` anchor 섹션을 별도 라우트로 승격.
> 가장 작은 단위의 콘텐츠 자산 — Product schema + FAQPage schema 로 LLM 인용·Google 점수 동시 노린다.

## 배경

- 현재 가격은 홈(`components/sections/pricing.tsx`)의 `<Pricing>` 섹션에만 존재 → `#pricing` anchor 로만 도달.
- nav "요금제"(`nav.tsx` L15 `/#pricing`) + cta(`cta.tsx` L78 `#pricing`) 가 anchor 참조.
- 독립 URL 부재 → 검색·LLM 이 "Kontaxt 가격" 질의에 인용할 표준 페이지가 없음.
- 가격 단일 source 는 `lib/pricing/plans.ts` (₩49,900 onetime / ₩89,000 premium / ₩0 free) — 이미 정착.

## 결정사항

### 1. 홈 섹션 vs 신규 페이지 관계 — **둘 다 유지 + nav anchor 그대로**

- 홈 `#pricing` 섹션 보존 (스크롤 내 가격 티저).
- 신규 `/pricing` = 상세 페이지 (FAQ + 환불 정책 + Product schema).
- nav "요금제" 는 `/#pricing` 그대로. (가격 페이지 정착 후 측정 → 차후 `/pricing` 이전 검토는 별도 PR.)
- 근거: Notion/Linear 등 일반 SaaS 패턴. 가장 작은 변경 + SEO 는 `/pricing` 자체 인덱싱으로 확보.

### 2. 콘텐츠 스코프 — **표준**

섹션 순서:
1. **Breadcrumb** — 홈 > 요금제 (`BreadcrumbJsonLd` 컴포넌트 재사용)
2. **Hero** — H1 + 1줄 desc
3. **`<Pricing />` 재사용** — 기존 3 카드 컴포넌트 통째로 (가격 drift 0 보장)
4. **환불 정책 박스** — 시스템 오류·중복결제 100% 환불 / 단순 변심 불가 + 약관 §10 링크
5. **FAQ 5건** — 정적 `<details>`/`<summary>` (JS 없음, guide 패턴)

### 3. JSON-LD inline 3종

| Schema | 내용 |
|--------|------|
| `BreadcrumbList` | 홈 → 요금제 |
| `Product` | name + offers 2 (49900/89000) — `lib/pricing/plans.ts` 에서 read (하드코딩 금지) |
| `FAQPage` | 아래 5 Q&A |

루트 `layout.tsx` 의 `SoftwareApplication.offers` 와 별개 — 중복 신호 가능하나 Google penalty 없음, 페이지 자체 신호 강화.

### 4. FAQ 5건 (해요체)

1. **환불은 가능한가요?** — 시스템 오류·중복결제 100% 환불, 단순 변심은 불가 (약관 §10).
2. **결제 수단은 뭐가 있어요?** — 카카오·네이버·토스페이·카드 (포트원, 2026.Q4 결제 오픈).
3. **영수증·세금계산서 받을 수 있어요?** — 결제 후 자동 발행.
4. **구독은 언제부터 결제 가능해요?** — 2026.Q4. 지금 가입하면 출시 알림.
5. **결제 전에 결과 미리 볼 수 있어요?** — 무료 플랜으로 양도차익 미리보기 가능.

### 5. Metadata + 카피

```
title: '요금제 — Kontaxt'
description: '단일 연도 ₩49,900, 구독 ₩89,000/년 (2026.Q4). 결제 전 무료 미리보기. 시스템 오류·중복결제 100% 환불.'
H1: '상황에 맞게 골라 봐요.'   (홈 #pricing H2 와 일치 — 일관성)
revalidate = 86400
```

VOICE: 친밀(해요체) — FAQ·환불 본문 / 약관 인용 "§10" 만 격식. grep 3종 0건 필수.

## 파일 변경

| 파일 | 변경 |
|------|------|
| `app/(marketing)/pricing/page.tsx` | 신규 — server component, metadata, 3 JSON-LD, 5 섹션 |
| `app/sitemap.ts` | `/pricing` priority 0.8 추가 (홈 다음) |
| `nav.tsx` / `cta.tsx` | **변경 없음** |
| `lib/pricing/plans.ts` | **변경 없음** (read-only 참조) |

## 검증

- `npm run typecheck` + `npm test --run` (295 test) PASS — 신규 페이지만이라 회귀 0 기대.
- VOICE grep 3종 0건.
- prod 검증 (머지 후): `curl -I /pricing` 200 + 3 JSON-LD emit + sitemap 9 URL + nav `#pricing` 회귀 0.

## Out of scope (다음 PR 후보)

- 비교표 (PDF 횟수·과세연도·TLH 매트릭스).
- nav anchor → `/pricing` 이전 (측정 후 결정).
- 영문 버전.
