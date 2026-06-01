# C-S2 거래소·기능 가이드 4종 — 설계

> 2026-06-01 · 브랜치 `claude/charming-swirles-2e55ec`
> TASKS.md Phase 9 GEO Strategic Investments S2. 어제 [PR #158](https://github.com/Delta-KR/kontaxt/pull/158)(/glossary) + [PR #161](https://github.com/Delta-KR/kontaxt/pull/161)(/pricing) 패턴 연장.

## 배경 / 동기

GEO Strategic Investments S2 — 거래소·기능별 독립 가이드 페이지로 long-tail 검색·LLM 인용을 토픽 단위로 흡수한다.

- **실수요 신호**: 2026-05-31 Naver Search Advisor 노출 2건 — `"업비트 매도 선입 선출"`, `"빗썸 엑셀파일 코인별"`. 우리가 아직 안 만든 콘텐츠에 broad 매칭. 가이드 페이지로 직접 흡수 후보.
- **현재 한계**: `/guide` 단일 페이지에 업비트 6단계 + 바이낸스 7단계 + FAQ 8건이 모두 모여 있어 GSC·Naver가 URL 하나만 색인. 토픽별 keyword density 분산, LLM citation도 anchor(`#exchanges`)로 잘림.
- **목표**: 토픽별 독립 URL → URL별 색인 + long-tail 키워드 직접 매칭 + LLM이 entity 단위(`/guides/upbit-pdf-download`)로 인용.

## 흡수 대상 키워드

| 가이드 | 카테고리 | 흡수 키워드(예상) |
|--------|----------|-------------------|
| `/guides/upbit-pdf-download` | 거래소 | "업비트 거래내역 PDF", "업비트 양도세 자료 받는법", "업비트 매도 선입선출"(Naver 신호) |
| `/guides/binance-csv-export` | 거래소 | "바이낸스 CSV 다운로드", "바이낸스 거래내역 추출" |
| `/guides/swap-tax-handling` | 기능 | "코인 스왑 세금", "토큰 교환 양도소득세" |
| `/guides/usdt-fx-conversion` | 기능 | "USDT 원화 환산", "테더 양도세 환율" |

## URL 구조

```
/guide                       ← 통합 entry point (기존 유지·축소)
├ Hero + How It Works (4단계)
├ 거래소 카드 2개 (요약 3-4줄 + "자세히 →" 링크)
├ 기능별 카드 2개 (SWAP·USDT 요약 + 링크)  ← 신설
├ FAQ (8건 → 7건 — SWAP·USDT FAQ는 별도 페이지로 이동, 1건은 "선물 지원?"처럼 유지)
└ CTA

/guides                      ← 인덱스 (glossary 인덱스 패턴, 신설)
└ 4 가이드 카드 (카테고리: 거래소 / 기능)

/guides/upbit-pdf-download   ← 독립 페이지
/guides/binance-csv-export   ← 독립 페이지
/guides/swap-tax-handling    ← 독립 페이지
/guides/usdt-fx-conversion   ← 독립 페이지
```

`/guide`(단수)는 entry point로 유지하고, 단계별 deep 콘텐츠는 `/guides/*`(복수)로 이동. `/guide`는 4 가이드로 분기하는 허브 역할.

## 콘텐츠 source 전략 — 하이브리드

| 단위 | 위치 | 역할 |
|------|------|------|
| 가이드 메타 | `lib/guides/index.ts` | slug·title·summary·category·related 단일 source. `/guides` 인덱스 + sitemap + cross-link 용 |
| 거래소 단계 데이터 | `lib/guides/exchange-steps.ts` | 업비트·바이낸스 단계 배열 추출. `/guide` 통합 카드 요약 + `/guides/*` 본문 둘 다 참조 → drift 0 |
| 각 가이드 본문 | `app/(marketing)/guides/<slug>/page.tsx` | 독립 페이지 컴포넌트. 단계·표·계산 예시 등 다양한 구조 자유롭게 작성. 동적 `[slug]` 라우트 안 씀 |

**근거**: glossary는 정의 텍스트만이라 `[slug]` 동적 라우트가 맞았지만, 가이드는 단계·경고박스·계산표가 섞여 표현이 다양하다. 메타만 데이터로 두고 본문은 페이지 컴포넌트로 두면 자유도와 인덱스/sitemap 일관성을 둘 다 얻는다.

## 4 가이드별 콘텐츠 스코프

### 거래소 2종 (기존 `/guide` 단계 재활용 + 확장)

**`/guides/upbit-pdf-download`**
- Hero (SectionEyebrow + h1 + 요약)
- 6단계 (`exchange-steps.ts` UPBIT_STEPS)
- "왜 PDF인가" 박스 (한 파일에 전체 거래 — 간편)
- 자주 막히는 곳 2-3건 (모바일 앱 출력 불가 / 기간 설정 / PC 권장)
- 관련 가이드·용어 cross-link
- CTA

**`/guides/binance-csv-export`**
- Hero
- 7단계 (`exchange-steps.ts` BINANCE_STEPS)
- Spot 전용 경고 박스 (선물 미지원 — 한국 세법상 파생상품 별도)
- 3개월 분할 다운로드 팁
- cross-link + CTA

### 기능 2종 (신규 작성, 중간 깊이 400-500단어, **계산 예시 1개씩 포함**)

**`/guides/swap-tax-handling`**
- Hero
- SWAP이란 (BTC→ETH 개념)
- 세법상 처리 — "BTC 매도 + ETH 매수" 2건 분해, 양쪽 총평균 단가 반영
- **실 계산 예시 1개** (세법 대조 필수)
- Kontaxt 자동 처리 방식
- 관련 용어(총평균법·과세표준) cross-link + CTA

**`/guides/usdt-fx-conversion`**
- Hero
- USDT 거래가 왜 환산되나
- 거래 시점 환율 적용 (BTC/USDT 예시) — daily_rates DB 출처
- **실 계산 예시 1개** (세법 대조 필수)
- 관련 용어 cross-link + CTA

## 공통 페이지 골격 (4종 동일)

1. `BreadcrumbJsonLd` (Kontaxt → 가이드 → {제목}) — `components/seo/Breadcrumb.tsx` 재사용
2. JSON-LD: `HowTo`(거래소 2종) / `Article`(기능 2종)
3. Hero
4. 본문 섹션
5. 관련 가이드·용어 cross-link (glossary related 패턴)
6. CTA (업로드 페이지로)
7. `export const revalidate = 86400` + 자체 metadata (canonical·OG)

## SEO 인프라

- **JSON-LD**:
  - 거래소 2종 → `HowTo` + `BreadcrumbList` (기존 `/guide`의 UPBIT_HOWTO·BINANCE_HOWTO 재활용)
  - 기능 2종 → `Article` + `BreadcrumbList` (단계 아닌 개념 설명이라 HowTo 부적합)
  - `/guides` 인덱스 → `BreadcrumbList` + `ItemList` (4 가이드 나열, 검색 노출 ↑)
- **sitemap**: `lib/guides/index.ts`의 `GUIDE_SLUGS` map → 인덱스 + 4 가이드. 현재 **9 → 14 URL**. glossary 패턴(`...GUIDE_SLUGS.map(...)`) 그대로.
- **robots**: `app/robots.ts`의 `PUBLIC_PATHS`에 `/guides` 한 줄 추가. (`allow`는 prefix 매칭이라 `/guide`로도 `/guides*`가 커버되지만, glossary처럼 의도 명확화 위해 명시. `/guides`만 추가하면 4 가이드 전부 prefix 커버.)

## 카피 / VOICE

- 전부 해요체 (VOICE.md §10 친밀 영역 — Guide).
- 단 SWAP·USDT **세법 근거 인용 줄**은 격식 가능 (Example 법조항 인용 영역).
- 각 PR에서 VOICE grep 3종(Soft·Hard·AI 안티패턴) 0건 통과.
- 인칭: 본문 무인칭, "당신" 0건.

## 세법 검증 (기능 2종 필수)

계산 예시 숫자·세법 조항을 `law/kontaxt_법률_가이드.md §10`(조문 검증 테이블) + `law/` PDF 대조 ([[reference_law_folder_verification]]).

- 본법(소득세법 §37)↔시행령(§88) 구분 주의 — 어제 glossary 조항 4건 정정 사고 방지.
- SWAP: 총평균법 §88①·§92②4호 / 과세표준·기본공제 §64의3②.
- USDT: 환산 시점·과세 기준. `과세개요.pdf`는 옛 정보(총평균법으로 정정) 주의.
- 계산 예시는 **숫자가 §250만 기본공제·22% 세율 등 실제 적용과 일치**해야 함.

## 검증 routine (PR마다)

1. `npm run typecheck` + `npm test` (husky pre-push 자동 — [[feedback_typecheck_before_merge]])
2. VOICE grep 3종 0건
3. `next build` → 4 가이드 + 인덱스 `○ Static` prerender 확인 + JSON-LD emit
4. prod 머지 후 `curl -I /guides/<slug>` 200 + `curl -s | grep`으로 JSON-LD·canonical emit ([[feedback_prod_url_resolve_verify]] — emit ≠ resolve 둘 다)
5. 세법 검증 (기능 2종): 위 §세법 검증

## PR 분할 (3 PR)

작은 PR 사이클 ([[feedback_small_pr_cycles]]) + 의존 base 먼저.

| PR | 내용 | 의존 | 검증 |
|----|------|------|------|
| **PR 1 (base)** | `lib/guides/index.ts` + `lib/guides/exchange-steps.ts` + `/guides` 인덱스 페이지 + sitemap 9→10 + robots `/guides` 추가 | 없음 | typecheck·test·build·prod curl |
| **PR 2 (거래소 2종)** | `/guides/upbit-pdf-download` + `/guides/binance-csv-export` + `/guide` 통합 페이지가 `exchange-steps.ts` 참조로 전환(drift 0) + 거래소 카드에 "자세히 →" 링크 + sitemap +2 | PR 1 | + curl 200·HowTo emit |
| **PR 3 (기능 2종)** | `/guides/swap-tax-handling` + `/guides/usdt-fx-conversion` (계산 예시 + **law/ 대조**) + `/guide` FAQ에서 SWAP·USDT 항목 이동·정리 + 기능 카드 신설 + sitemap +2 | PR 1 | + curl·Article emit + **세법 대조** |

**순서 근거**: PR 1이 공통 헬퍼·인덱스(base). PR 2-3은 같은 sitemap.ts·`/guides` 인덱스·`/guide` 페이지를 건드려 PR 1 머지 후 순차. 거래소(PR 2) 먼저 — 기존 데이터 재활용이라 빠름. 기능(PR 3) 나중 — 세법 검증으로 느림. 세법 검증 단위(기능 2종)가 한 PR로 묶여 깔끔.

## YAGNI / 스코프 제외

- 동적 `[slug]` 라우트 (가이드는 표현 다양 → 페이지 컴포넌트가 맞음)
- S3 블로그 / S4 거래소 독립 페이지 / S6 Article freshness — 별도 작업 (오늘 스코프 아님)
- Bithumb 가이드 — 파서 미구현이라 가이드만 먼저 만들면 "지원 안 함" 혼선. Phase 8 파서와 함께.
- 가이드 본문 i18n / 영문 — 한국 사용자 대상이라 불필요.

## 미해결 (구현 중 확정)

- SWAP·USDT 계산 예시의 **구체 숫자** — PR 3 구현 시 `law/` 대조하며 확정.
- 기능 카드 2개를 `/guide` 어느 위치에 둘지 (거래소 카드 다음 권장) — 구현 시 시각 확인.
