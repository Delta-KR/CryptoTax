# Kontaxt Task Backlog

> 마지막 갱신: 2026-05-27 (D-219 to 2027.1.1 신고 시행)
> 출시 전 신뢰도 P0/P1 완료. 종합 감사 P2 11/12건 적용 + P2-rem 4건 + prod hotfix 4건. **2026-05-27**: /api/report incident 종결 (PR #89 ttf path swap). **사업자등록·법인설립은 2026-06 중순** (모두의 창업 1라운드 진출 후) — Kakao 비즈앱·포트원·LOI 페이지 모두 그 시점 잠금 ([[project_business_registration_timing]]). Phase 7 진입 전 P1 수동 검증 필요.
> 작업 패턴·함정 가이드는 `CLAUDE.md`. audit followups 메모리: `[[project-audit-2026-05-23-followups]]`.

---

## ✅ MVP 완성 — Phase 0~6 (5/11 ~ 5/19)

5/12 풀스택 스프린트로 MVP 코어 일단락. 자세한 일자별 기록은 Obsidian vault (`Daily/2026-05-12.md` 등) 참고.

### 코어
- **Phase 0 — Auth (Supabase)** — 기본 5/12 / Google·Kakao OAuth 5/12 / Naver OAuth 5/19 / 비번 재설정 5/18 / Apple 제거 5/19
- **Phase 1 — FIFO 엔진** (`src/engine/types.ts`, `fifo.ts`, vitest) — 5/12
- **Phase 2 — 거래소 파서**: Binance Spot CSV ✅, Upbit PDF ✅ — 5/12 (Bithumb은 Coming Soon으로 이동)
- **Phase 3 — 정규화 + 세법**: 환율 변환 + SWAP 분리 + 의제취득가액 + `tax-calculator` — 5/12
- **Phase 4 — E2E 테스트** (4 시나리오 + 풀 파이프라인) — 5/12
- **Phase 5 — UI 연결**: Server Action `uploadAndCalculate` + 대시보드 + mock 교체 — 5/12
- **Phase 6 — PDF 리포트** (react-pdf 한국 양도소득 신고용) — 5/12

### 부가 인프라
- 결제: ₩29,900 단일 + ₩19,900/년 구독 + `/billing` — 5/12
- 보안: Cloudflare Turnstile + open redirect 방어 + 보안 감사 후속 1~3 — 5/13, 5/15
- 마케팅 랜딩: 10섹션 + UX 휴리스틱 8건 + Mercury 톤 리디자인 — 5/12, 5/14, 5/15
- Kontaxt 리브랜딩 + 로고 자산 (헤더·풋터·favicon·OG) — 5/18, 5/19
- SEO: Google Search Console + Naver Search Advisor + 사이트맵 3개 — 5/18
- 페이지: `/guide` 사용 가이드 + 이용약관 + 개인정보처리방침 — 5/12
- 트랜잭셔널 이메일 3종 (verify / reset / welcome) — Resend + Supabase Custom SMTP — 5/19, 5/23

---

## 🔧 Quick Wins — 다음 작업 사이클 전 처리

- [ ] **Naver OAuth 통합 패턴 추출** — fragment 세션 처리 + provider 메타데이터(`app_metadata.provider`)를 공통 OAuth 모듈로. 카카오/구글에 동일 패턴 적용 가능한지 확인.
- [ ] **favicon SVG-only fallback 검토** — 구형 안드로이드/IE에서 PNG fallback 필요한지 GA/Search Console 데이터로 판단.
- [ ] **Dashboard 한 사이클 검증** — 로컬에서 파일 업로드 → 결과 화면 → PDF 다운로드 풀 플로우 실제로 돌려보기. 5/12 이후 직접 안 돌려본 상태일 가능성 있음.

---

## ✅ 출시 전 신뢰도 잠금 — 완료 (2026-05-19, 20)

> 2026-05-19 엔진 감사에서 발견한 P0/P1 10건. 베타 진입 전 필수 처리 항목 전부 ✅. 자세한 분석: `vault/Projects/engine-audit-2026-05-19.md`

### P0 — 즉시 처리
- [x] **옛 브랜드명 "크립토택스" / "CRYPTOTAX" 잔재 제거** — 21개 파일, ~46개 변경
- [x] **Dashboard "총 양도차익" 라벨 정정** — totalGain/totalLoss/netPnL 3개 분리
- [x] **이동평균법(MA) 옵션 구현** — `MAEngine` + dispatch + 19개 신규 테스트
- [x] **환율 데이터 일별 fetch + 출처 표시** — Supabase `daily_rates` + Edge function + DBExchangeRateProvider
- [x] **의제취득가액 시가** — `deemed_cost_snapshots` 테이블 + 자동 승격 함수

### P1 — Audit Trail (PR #4)
- [x] FIFO 매칭 표시 / 의제 배지 / 환율 출처 / 거래소별 분리 / holdingsAfter UI

### P1 머지 후 prod 검증 fix (PR #5~#8, 2026-05-20)
- [x] Binance Order History 친절 안내 / 에러 토스트 영구 / 중복 거래 dedupe / 무관 PDF 거절

### P2 — 검증 절차 (P0/P1 후, 진행 중)
- [ ] **국세청 공식 케이스 회귀 테스트** — NTS 가상자산 양도소득세 가이드라인의 예시 케이스 5-10개를 vitest에 추가.
- [ ] **세무사 검증** — 한국 가상자산 전문 세무사 1-2명한테 시나리오 5-10개 결과 검증 의뢰. 비용 30-50만원 예상.
- [ ] **엣지 케이스 테스트 추가**:
  - Dust 매도 (1e-9), 동일 timestamp 대량 거래, 부분 의제+실가 mix, 환율 fallback 한계, 시간대 경계 BUY/SELL
  - Property-based: `sum(consumedLots.costKRW) === costBasisKRW`, `totalGain+totalLoss === netPnL`
- [ ] **베타 사용자 dry run** — 실제 거래내역으로 엔진 결과 → 엑셀 손계산 대조.

---

## 💰 가격 전략 sync (★ Phase 7 진입 전 처리 ★)

> 2026-05-21 확정 가격 전략 (`pricing-strategy-summary.md` Section 6)이 코드에 반영 안 됨. 코드는 2026-05-12 결정한 mock 가격 (₩29,900/₩19,900) 그대로. 확정안은 원타임 ₩49,900 / 구독 ₩89,000/년 + 포트원 + MVP 원타임만. 출처: `pricing-strategy-summary.md`, Obsidian `Daily/2026-05-21.md` §7.

### ✅ P0 — 코드 가격 sync (2026-05-23 검증 완료)

- [x] **lib/mock/billing.ts → lib/pricing/plans.ts 단일 source 분리** — ✅ `lib/pricing/plans.ts` 존재 (₩49,900/₩89,000), mock 폴더에는 PaymentRecord/TaxProRequest 만 남음.
- [x] **JSON-LD + tax 페이지 PremiumBanner 카피 sync** — ✅ `app/layout.tsx` offers (49900/89000), `tax/page.tsx` (₩49,900), `legal/terms` (₩49,900/₩89,000) 모두 정확.
- [x] **랜딩 pricing.tsx 단일 source 참조** — ✅ `components/sections/pricing.tsx` 가 `getPlan()` 사용. 옛 비교 카피 "₩59,800 vs ₩19,900" 제거됨.
- [x] **MVP 노출 정책 결정 + 적용** — ✅ 옵션 (b) 채택: premium 카드에 `comingSoon: true` + "2026.Q4 출시 예정" 배지 + CTA "출시 알림 받기".
- [x] **포트원 placeholder 정리** — ✅ `app/(app)/billing/checkout/page.tsx` 에 "포트원(PortOne) 통합 진행 중" 명시.

**잔여 outdated**:
- [x] **README.md 디자인 핸드오프 옛 시안** — ✅ Section 8 (toggle / dark gradient / BEST VALUE pill 제거 + comingSoon 반영 + `lib/pricing/plans.ts` source 명시) + Section 9 (blob / gradient-clipped / 보라 #7C3AED / 정적 D-237 / TAM 1,550만 → 1,150~1,250만 / 세율 20→22% 정확화). DESIGN.md §8 안티패턴 회피 명시.
- [ ] docs/audit/* (5건) — Toss webhook 시그니처 등 audit 시점 보고서. 시간 freeze 라 손대지 않는 게 정석.

### P1 — 가치 노출 UX (sync 후 후속)

- [ ] **가치 앵커 3층 구조 첫 화면 노출** — 세무사 비용 + 가산세·추징 + 시간·정신 비용. 단일 앵커만으론 WTP가 ₩49,900에 못 미침 (전략 §6.2).
- [ ] **결제 페이지 동적 가치 표시** — 사용자 거래 데이터 기반 예상 절세액 + 가산세 회피액. 매몰비용 효과 (전략 §6.3).
- [ ] **paywall 위치 = PDF 다운로드 지점 일치 확인** — 현재 tax 페이지 maskForFree 패턴이 전략(PDF wall)과 정합한지 검증 (전략 §6.4).
- [ ] **구독 features 재정의** — 코드의 구독 features (PDF 무제한, 거래소 무제한 등)은 원타임과 차별 약함. 전략은 "연중 절세 도구" — TLH 알림, 상시 대시보드, 거래소 API 자동 연동. 구독 출시 시점에 재작성.

### P2 — 사전 예약(LOI) + 연중 hook

- [ ] **LOI 페이지** — 2026.07~12 운영, ₩39,900 (20% 얼리), 100명, 30일 환불 보증 (전략 §6.6)
- [x] **양도 시뮬레이터 무료 페이지** — ✅ `/simulator` 구현 (PR #47 · #48 · #49). 회원가입 없이 매수/매도/수량 입력 → 산출세액 + 가산세 시나리오. querystring 공유 URL (SNS hook) + Nav/Footer 진입 동선.
- [ ] **포트원 가입 + 결제 페이지 구현** — 카카오·네이버·토스페이 + 카드 일괄 (전략 §6.5). **6월 중순 사업자등록·법인설립 후 진행** ([[project_business_registration_timing]] — 모두의 창업 1라운드 진출 후 timing)
- [ ] **Kakao OAuth 비즈 앱 전환 + 재활성** — 6월 중순 사업자등록 후. 현재 [PR #81](https://github.com/Delta-KR/kontaxt/pull/81) (`ce990c9`) 으로 enabled:false 임시 비활성 ([KOE205 — account_email scope 가 비즈 전용](.claude/projects/.../reference_kakao_oauth_disabled.md))

---

## 🔒 종합 감사 2026-05-22 / 23 후속 (★ Phase 7 진입 전 처리 ★)

> 2026-05-22: P0 13건 hotfix → 5 subagent 병렬 → PR #28~#32 머지.
> 2026-05-23: 5 영역 종합 감사 (security/UX/logic/quality/perf) → 50+ fix → /code-review × 3 + 사용자 플로우 워크스루 → PR #33~#37 머지.
> 코드는 main 반영 완료. **prod DB / 수동 검증 / 큰 refactor 가 후속**.
> 5 감사 보고서: `docs/audit/{security,ux,logic-bugs,code-quality,perf}-2026-05-23.md`

### ✅ P0 — prod DB 동기 (2026-05-23 적용 완료)

- [x] **Supabase 마이그레이션 prod apply** — 5/23 적용 완료 (3 마이그). `mcp__supabase__list_migrations` 로 verify
  - `20260523010537_optimize_rls_initplan` ✅
  - `20260523010606_lockdown_profiles_and_cron_secret` ✅
  - `20260523010932_revoke_security_definer_exposure` ✅
  - `mcp__supabase__get_advisors performance` → `lints: []` (auth_rls_initplan 0건)
  - 2026-05-26 verify ([[feedback_tasks_verify_first]] 패턴 — TASKS.md stale 발견)

### P1 — 수동 검증 (30분 내)

코드 fix 검증. 한 사이클 워크스루로 처리.

- [x] **Naver 재로그인 lockout 해소** (PR #35) — 2026-05-27 사용자 검증 완료. PR #80 sameSite=lax + PR #83 user_metadata.provider 검증 효과. 단 회원탈퇴 후 재로그인 시 자동 로그인 issue 발견 → 별도 follow-up ([[project_naver_auto_relogin_followup]])
- [x] **changePassword brute-force RL** (PR #35) — 2026-05-27 사용자 검증 완료. 정상 작동
- [x] **/tax 재계산 race** (PR #36) — 2026-05-26 /qa 검증. `if (recalcing) return` ([app/(app)/tax/page.tsx:545](app/(app)/tax/page.tsx:545)) + `disabled={recalcing}` (L611) 2중 방어. 더블클릭 → "재계산 중…" + button disabled 즉시 노출
- [x] **/report year 동기** (PR #36) — 2026-05-27 검증 완료. incident ([[project_api_report_incident_2026_05_26]]) 종결 — [PR #89](https://github.com/Delta-KR/kontaxt/pull/89) (`480eab0`) ttf path swap 으로 해결. fontkit woff2 decompressor + Node 24 → ttf raw parser 사용. 사용자 PDF 다운로드 prod 검증 PASS. Wave 1 사후 routine (5 sub-agent) 머지 차단 finding 0건
- [x] **모바일 가로 스크롤** (PR #37) — 2026-05-27 사용자 검증 완료. 가로 스크롤 정상. 단 모바일 햄버거 메뉴 UI 깨짐 발견 → [PR #96](https://github.com/Delta-KR/kontaxt/pull/96) 으로 별도 fix (mobile-nav createPortal, [[feedback_backdrop_blur_containing_block]])
- [x] **theme toggle 깜빡임** (PR #37) — 2026-05-26 /qa 검증. bootScript ([app/layout.tsx:70](app/layout.tsx:70)) + getInitialTheme + visibility:hidden 3중 방어 정상 동작 확인. data-theme=dark reload 후 persist, head 6.4KB 안에 inline blocking script 2개
- [x] **404 페이지** — 2026-05-26 /qa 검증. `/nonexistent-page-qa-test` → "404 페이지를 찾을 수 없습니다 / 메인으로" 링크 (href="/") 정상

### P2 — 보류한 audit 후속 (별도 PR 후보)

- [x] **next@16 major bump** — 2026-05-26 [PR #70](https://github.com/Delta-KR/kontaxt/pull/70). React 18→19 + cookies async + middleware→proxy. 9 next advisory 해결. 잔여: postcss transitive (별도 PR), turbopack.root nit, forwardRef→ref-as-prop (별도 PR).
- [x] **`useCurrentUser` React Context 화** (perf P1-1) — 2026-05-26 [PR #71](https://github.com/Delta-KR/kontaxt/pull/71). UserContextProvider + AppShell 분할 + 5 child page 마이그 + Nav client 화 (P1-2 Best). 페이지당 supabase 4× → 1×. marketing 트리 fully static.
- [x] **marketing nav 정적화** (perf P1-2) — 2026-05-26 [PR #68](https://github.com/Delta-KR/kontaxt/pull/68) cheapest 옵션 적용. legal/sample/guide/simulator 4 페이지 + simulator 에 `revalidate=86400` 추가. Nav client 화 (Best 옵션) 는 useCurrentUser context 화 (P1-1) 와 같이 묶을 때 진행.
- [x] **`/auth/finish` nonce binding** (security P1-6) — 2026-05-26 [PR #72](https://github.com/Delta-KR/kontaxt/pull/72). httpOnly nonce cookie (Naver callback 발급) + server action consume (Next 16 RSC 제약 회피). phishing fragment 차단.
- [x] **`/api/report` self-declared worksheet disclaimer** (P0-4 mitigation) — 2026-05-26 [PR #73](https://github.com/Delta-KR/kontaxt/pull/73). PDF 첫 페이지 disclaimer 박스 + footer 4곳 카피 강화. 근본 fix (server transactions DB) 는 privacy 철학 충돌이라 미채택, defense-in-depth.
- [ ] **`/api/report` getSourceInfo 사용** (reuse R#3) — 별도 의사결정 (rate provider 재실행 효과 작음, transactions 이미 환산된 wire).
- [x] **deemedCostSource wire 객체 dedup** (reuse R#4) — 2026-05-26 [PR #74](https://github.com/Delta-KR/kontaxt/pull/74). `lib/engine/wire.ts buildDeemedCostWire()` helper 추출. calculate.ts + /api/report dedup.

### 2026-05-26 prod hotfix (P1 prod 실측 중 발견)

- [x] **Naver OAuth state cookie sameSite strict → lax** — [PR #80](https://github.com/Delta-KR/kontaxt/pull/80) (`b75ce61`). 5/23 PR #35 의 strict 도입 → 5/23~5/26 prod Naver 로그인 항상 broken (cross-site cookie 차단). investigate skill 으로 root cause 발견. [[reference_naver_oauth_state_cookie]]
- [x] **Kakao OAuth 일시 비활성** — [PR #81](https://github.com/Delta-KR/kontaxt/pull/81) (`ce990c9`). KOE205 (account_email scope 가 비즈 앱 전용) → enabled:false. 6월 중순 사업자등록 후 비즈앱 전환·복구. [[reference_kakao_oauth_disabled]]
- [x] **revert nonce binding (#72 + rem-C)** — [PR #79](https://github.com/Delta-KR/kontaxt/pull/79) (`30614d2`). nonce cookie 가 Supabase cross-site verify chain 에서 끊김 가설로 revert. (실제 root cause 는 Naver sameSite — PR #80 적용 후 nonce binding 재시도 가능)

### 2026-05-27 incident 종결 후속

- [x] **PDF Bold weight 시각 검증** — 2026-05-27 사용자 PDF (`Kontaxt_2027.pdf`) 시각 확인 PASS. variable ttf 의 `wght` axis 가 fontkit + @react-pdf/renderer 조합에서 정확히 작동 — H1·헤더·금액 강조·납부세액·섹션 라벨 모두 진짜 weight 700 글리프 렌더. synthetic bold fallback 아님. codex + regression 의심 = false alarm (의심은 정당, 시각 검증으로 확정)
- [x] **pretendard 패키지 version pin 틸드** — [PR #91](https://github.com/Delta-KR/kontaxt/pull/91). `^1.3.9` → `~1.3.9`. `dist/public/variable/` path 가 major bump 시 깨질 위험 차단
- [x] **`@react-pdf/renderer` 틸드 pin** — [PR #97](https://github.com/Delta-KR/kontaxt/pull/97). `^4.5.1` → `~4.5.1`. fontkit/pdfkit transitive 라 같은 incident 벡터 (Wave 1 codex finding)
- [ ] **(선택) woff2 + brotli polyfill 로 bundle size 회복** — ttf 6.74MB → woff2 2.06MB (-4.7MB). Node 24 + fontkit 호환 stabilize 시점 재검토

### 2026-05-27 P1 검증 중 신규 발견

- [x] **모바일 햄버거 메뉴 UI 깨짐** — [PR #96](https://github.com/Delta-KR/kontaxt/pull/96). nav 의 `backdrop-blur-[20px]` 가 CSS spec 상 fixed positioning containing block 만드는 문제. 자식 MobileNav 의 `fixed inset-0 z-[60]` dialog 가 viewport 가 아닌 nav 영역 안에 한정 → panel 이 본문 위로 안 올라감. `createPortal` 로 `document.body` 에 mount 우회. 메모리 [[feedback_backdrop_blur_containing_block]]
- [x] **🚨 Naver 회원탈퇴 후 자동 재로그인 incident — 3-layer 자동화 완료** ([[project_naver_auto_relogin_followup]]):
  - [x] **외부 link 안내 layer** — [PR #99](https://github.com/Delta-KR/kontaxt/pull/99). 회원탈퇴 모달에 OAuth 사용자 (Naver/Google) 한정 안내 박스 + 권한 해제 link
  - [x] **Naver token revoke 자동화** — [PR #101](https://github.com/Delta-KR/kontaxt/pull/101). Supabase `oauth_tokens` 테이블 (migration prod apply) + callback 에서 token upsert + deleteAccount 에서 revoke API best-effort 호출. 모달 카피 "자동 시도" 명시
  - [ ] **(영원히 불가능) Naver NID_AUT cookie 자체 무효화** — 사용자 다른 Naver 서비스 세션과 묶여서 우리 제어 밖
- [x] **모바일 UI/UX 추가 깨짐 — Hero dashboard strikethrough 효과 fix** — [PR #102](https://github.com/Delta-KR/kontaxt/pull/102). 사용자 모바일 (iPhone) prod 검증에서 stat value (₩411만 등) strikethrough 처럼 보이는 시각 효과 발견. 근본 원인: `tracking-tightish` letter-spacing 압축이 모바일 작은 viewport 에서 글자 stroke 가로로 합쳐 보임. fix: `tracking-normal sm:tracking-tightish` + 모바일 padding/text-size 축소

### P3 — code quality 폴리시

- [x] **`tax/page.tsx` 1056 → 582 LOC 분할** (code-quality P2) — [PR #103](https://github.com/Delta-KR/kontaxt/pull/103). 7 helper component 분리 (`_components/CalcRow + Divider + PremiumBanner + HoldingsAfterTable + ExchangeCoinMatrix + RealizedGainList + BlurOverlay` + `_lib/format.ts`). main TaxPage 만 page.tsx 에 유지. -45% LOC 축소
- [x] **README 갱신 — marketing-only → SaaS 전체** (code-quality P1) — [PR #94](https://github.com/Delta-KR/kontaxt/pull/94). +230/-238, Quick Start·Tech Stack·Architecture·Domain·거래소 파서·PDF/Email/DB 섹션 신설
- [x] `lib/mock/*` → `lib/client/*` rename — naming misleading (prod 경로에서 사용). 4 파일 + 13 import + `@vitest/coverage-v8` 설치 묶음 PR
- [x] ~~`@react-email/*` deprecated subpackage 18개 → `@react-email/components` 통합~~ — **2026-05-27 verify: 통합할 게 없음** ([PR #92](https://github.com/Delta-KR/kontaxt/pull/92)). 직접 의존 = `@react-email/components` + `@react-email/render` 둘뿐. 빌드 로그의 18개 deprecation warning 은 상류 (Resend) 가 1.x 라인 전체 deprecated 처리한 transitive — 우리 레포 차원 fix 불가
- [x] **doge.svg 압축 + mark.svg 인라인 SVG화** (perf P1-6 + reuse) — [PR #95](https://github.com/Delta-KR/kontaxt/pull/95). doge.svg 57KB → 26KB (-53.7% svgo). mark.svg 제거 + `components/ui/Mark.tsx` 컴포넌트 신설 (currentColor 적용, nav/footer 2 사용처 마이그)
- [x] **`error.tsx` `<Button>` 사용 (reuse R#10), login `Input.error` aria 복원 (R#14)** — [PR #93](https://github.com/Delta-KR/kontaxt/pull/93). `app/error.tsx` raw button → Button + Link, `app/(auth)/login` 빈 필드 시 Input error state + aria-invalid 정확 wire

### 직전 세션 핵심 참고

- 새 공통 헬퍼: `lib/auth/client-ip.ts`, `lib/auth/naver.ts`, `components/ui/FormErrorBanner.tsx`
- 새 페이지: `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx`, `app/(app)/loading.tsx`
- `lib/rate-limit.ts` parameterized — 새 limiter 1줄 (`makeLimit(prefix, count, window)`)
- `lib/engine/exchange-rate.ts`의 `kstYearOf` / `kstMonthOf` / `kstDayOf` — KST 단일 helper, 신규 코드는 이걸 사용
- `PremiumGuardOk.userName` — narrow된 타입으로 `/api/report` 등에서 `getUser` 중복 제거

---

## 🔥 Phase 7 — 사용자 확보 + 피드백 루프 (D-223)

신고 시행까지 7개월. 베타 사용자 모집해서 피드백 루프 만드는 게 우선.

- [ ] **베타 모집 채널 정하기** — 한국 크립토 커뮤니티 (Discord/X/Bitcoin Korea/디시 갤러리/네이버 카페) 중 어디서 시작할지
- [ ] **첫 50명 베타 모집** — 무료 사용 + 피드백 약속
- [ ] **온보딩 funnel 트래킹** — 가입 → 파일 업로드 → 결과 → 결제, 각 단계 drop-off 측정 도구 결정 (PostHog/Amplitude/GA4)
- [ ] **피드백 채널 결정** — 인앱 위젯(Userflow/Featurebase) vs 단톡방(Discord/Slack) vs 1:1 인터뷰
- [ ] **세션 리플레이 도입** — Microsoft Clarity (무료) or Hotjar — 첫 사용자가 어디서 막히는지 관찰

---

## 🏦 Phase 8 — 거래소 확장

랜딩에서 "Coming Soon" 표시한 거래소 차례로 구현. 사용자 수요 기반 우선순위 조정.
우선순위: 한국 사용자 비중 → 글로벌 인기도 → 데이터 포맷 난이도.

- [ ] **Bithumb XLS** — 한국 사용자 비중 큰데 Phase 2에서 빠짐. 최우선.
- [ ] **Coinone** — 한국 거래소
- [ ] **Bybit** (CSV)
- [ ] **Coinbase** (CSV) — 글로벌 대표
- [ ] **Gate.io** (CSV)
- [ ] **OKX** (CSV)
- [ ] **Bitget** (CSV)

각 거래소 추가 시:
1. 샘플 거래내역 파일 확보 (베타 사용자 협조 또는 본인 계정)
2. 파서 구현 (`src/parsers/{exchange}.parser.ts`)
3. vitest 케이스 추가 (정상 + 엣지 케이스 3-5개)
4. 랜딩 "Coming Soon" → "Live"로 이동

---

## 📈 Phase 9 — 마케팅 콘텐츠 + SEO

- [ ] **인덱싱 모니터링** — Google Search Console + Naver Search Advisor 매주 체크, 인덱싱 안 되는 페이지 원인 파악
- [ ] **블로그/가이드 콘텐츠 첫 5개** (long-tail 키워드 타깃):
  1. "업비트 PDF로 양도소득세 신고하는 법"
  2. "한국 거주자 가상자산 세금은 왜 총평균법인가 — 시행령 §88① 해설 (FIFO·이동평균이 적용되지 않는 이유)"
  3. "의제취득가액이란? 2027 가상자산 세금 계산법"
  4. "바이낸스 CSV로 한국 양도소득세 신고하기"
  5. "거래소 통합 데이터로 신고하는 이유 (수동 vs 자동)"
- [ ] **랜딩 A/B 테스트** — Hero copy or 가격 카드 variant
- [ ] **사용자 후기 섹션** (베타 첫 5명 후기 모이면 랜딩에 추가)

---

## 📑 Phase 10 — 신고 시즌 대비 (2027년 1-5월)

- [ ] **캐파 점검** — PDF 생성 부하 테스트 (동시 100/500/1000 요청). Vercel function 한도 점검.
- [ ] **세무사 협업 채널** — PDF 직접 전송 or 세무사 추천 디렉토리. 한국 가상자산 전문 세무사 5-10명 발굴.
- [ ] **고객 지원** — 신고 기간 FAQ 보강, 인앱 채팅(Crisp/Intercom) 또는 이메일 응대 SLA 정의.
- [ ] **회계연도 분리** — 2026/2027 분리 (재신고/수정신고 대응)
- [ ] **에러 모니터링** — Sentry/Vercel Analytics 도입 (있는지 확인 필요)

---

## ⚠️ 알려진 이슈 / 리스크

- **pdf-parse v1 의존성**: Vercel serverless의 DOMMatrix 미지원 때문에 v1 고정 (5/12 deploy 4번 돌려서 해결). 라이브러리 보안 업데이트 끊기면 자체 PDF 파싱 또는 외부 서비스로 마이그레이션 검토 필요.
- **Bithumb 파서 미구현**: 한국 사용자 중 빗썸 비중 큰데 데이터는 Coming Soon. Phase 8 1순위로 조기 처리.
- **테스트 커버리지 측정 안 됨**: vitest 셋업 + 50+ 케이스 있지만 `@vitest/coverage-v8` 패키지 미설치로 % 측정 안 됨. 추가 필요.
- **Dashboard 회귀 테스트 없음**: 5/12 이후 mock → 실제 엔진 교체된 후 풀 플로우 회귀 안 돈 듯. Quick Wins에서 검증.
- **next@16 advisories 14건 미처리**: DoS / XSS / cache poisoning / SSRF via WebSocket. breaking change라 별도 의사결정 PR 필요. audit 2026-05-23 후속 P2에 등록.
- **PDF route client 신뢰 문제 (partial fix)**: tolerance refine으로 trivial 공격은 막았지만 amount+price 동시 위조 여지 남음. audit 후속 P2에 근본 fix 등록.

### 해결된 이슈

- ~~**엔진 audit trail 부재**~~ — 2026-05-20 해결 (PR #4).
- ~~**환율 데이터 하드코딩**~~ — 2026-05-19 해결. Supabase DB + Upbit Edge function.
- ~~**의제취득가액 시가 10개 코인만**~~ — 2026-05-19 해결. DB 테이블 + 추정치 시드 + 실시가 자동 승격.
- ~~**이동평균법 거짓 옵션**~~ — 2026-05-19 해결. MAEngine 구현.
- ~~**옛 브랜드명 "크립토택스" 잔재**~~ — 2026-05-19 해결.
- ~~**localStorage 거래 데이터 user 격리 누락**~~ — 2026-05-23 PR #28 해결. 5-23 audit 발견 패턴 → `CLAUDE.md` 알려진 함정 섹션에 재발 방지 가이드.

---

## 🧭 의사결정 기록

큰 결정만 메모. 자세한 컨텍스트는 vault `Daily/` 참고.

- **2026-05-12**: pdf-parse v2 대신 v1 — Vercel serverless DOMMatrix 호환성.
- **2026-05-12**: 빗썸 파서 Phase 2에서 빼고 Coming Soon으로 — XLS 파싱 난이도 + 타임라인 압박.
- **2026-05-12**: 결제 모델 mock 가격 = 단일 연도 ₩29,900 + 구독 ₩19,900/년 (코드 prototype 용). ⚠ 2026-05-21 확정 가격으로 폐기 — 아래 참조.
- **2026-05-21**: 가격 전략 확정 — 원타임 ₩49,900 / 연간 구독 ₩89,000 (1.8× 갭) / 결제 = 포트원 / MVP는 원타임만 / paywall = PDF 다운로드 / LOI 2026.07~12 (`pricing-strategy-summary.md` Section 6, Obsidian Daily 2026-05-21 §7). 코드 sync는 2026-05-23 별도 PR에서 진행.
- **2026-05-15**: 마케팅 톤 — "AI" 색깔 빼고 Mercury·Obsidian·Rogo 같은 fintech/tooling 톤.
- **2026-05-18**: 브랜드명 = 크립토택스 → **Kontaxt**.
- **2026-05-19**: 작업 기록 = Obsidian vault. Daily/Weekly + Projects/kontaxt.md.
- **2026-05-19**: 엔진 신뢰도 감사 — 엔진 코어 A−, UI C, 환율데이터 D. P0 5건 + P1 5건 처리 후 베타 진입.
- **2026-05-20**: P1 audit trail 5건 + UX fix 4건 한 번에 머지 (PR #4~#8). 큰 PR 후 prod 검증 fix는 분당 1 PR 사이클로 빠르게 (`feedback-small-pr-cycles` 메모리).
- **2026-05-22**: P0 13건 fix를 5 subagent 병렬 worktree로 dispatch → 5 PR 분할 머지 (#28~#32). 새 패턴 검증 (`subagent-worktree-pattern` 메모리).
- **2026-05-23**: 5 영역 종합 감사 (security/UX/logic/quality/perf) — subagent 5개 병렬 + /code-review × 3 + 사용자 플로우 워크스루 → 50+ fix → 5 PR 머지 (#33~#37). 코드는 main, prod DB / 수동 검증 / 큰 refactor 후속.
- **2026-05-23**: 이메일 인프라 정착 — Resend (`kontaxt.kr`) + Supabase Custom SMTP. 로고는 단일 brand blue PNG (Apple Mail 호환). 다크모드 swap 4가지 시도 다 실패 — 반복 금지.
- **2026-05-23**: Working memory 현행화 — `CLAUDE.md`에 graphify 사용 강제 / 작업 패턴 / 함정 섹션 추가.

---

## 📂 참고 경로

- 코드: `/Users/delta/Desktop/kontaxt/`
- 작업 기록 vault: `/Users/delta/Documents/Obsidian Vault/kontaxt-vault/`
- 프로젝트 메인 페이지: `vault/Projects/kontaxt.md`
- 데일리 노트: `vault/Daily/YYYY-MM-DD.md`
- CLAUDE.md (코드 가이드라인): `/Users/delta/Desktop/kontaxt/CLAUDE.md`
- 디자인 핸드오프: `/Users/delta/Desktop/kontaxt/README.md`
- 감사 보고서: `/Users/delta/Desktop/kontaxt/docs/audit/`
- 지식 그래프: `/Users/delta/Desktop/kontaxt/graphify-out/`
