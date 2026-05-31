# Kontaxt Task Backlog

> 마지막 갱신: 2026-05-28 (D-218 to 2027.1.1 신고 시행)
> 출시 전 신뢰도 P0/P1 완료. 종합 감사 P2 11/12건 적용 + P2-rem 4건 + prod hotfix 4건. **2026-05-27**: /api/report incident 종결 (PR #89 ttf path swap). **2026-05-28**: P2 검증 Phase A·B·C·D 완료 (엔진 A− → A) + 세무사 외부 검증 패키지 v0.1 (PR #128) + **Vercel 빌드 fail incident P0 hotfix (PR #130 TS errors 4건)**. **사업자등록·법인설립은 2026-06 중순** (모두의 창업 1라운드 진출 후) — Kakao 비즈앱·포트원·LOI 페이지·세무사 검증 발송 모두 그 시점 잠금 ([[project_business_registration_timing]]). Phase 7 진입 전 P1 수동 검증 필요.
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

- [x] **Naver OAuth 통합 패턴 추출** — [PR #117](https://github.com/Delta-KR/kontaxt/pull/117) (`a053851`). `lib/auth/oauth-providers.ts` 에 `isProviderLinked(user, provider)` helper 신설 (4 source OR — identities + app_metadata.providers + app_metadata.provider + user_metadata.provider). Naver callback 의 inline 5줄 OR 체인 → 1줄 helper 호출. `hasEmailIdentity` 도 helper 위임으로 단순화. 카카오/구글 비즈앱 전환 후 custom callback 시 동일 helper 재사용. 11 신규 tests (23 → 34 PASS). Wave 1 routine: BLOCKING 0, MEDIUM 0, NIT 6
- [x] ~~**favicon SVG-only fallback 검토** — [PR #118](https://github.com/Delta-KR/kontaxt/pull/118) (`32ddb98`)~~ → **revert** ([PR #123](https://github.com/Delta-KR/kontaxt/pull/123) `9526152`, 2026-05-28). metadata.icons 가 명시한 `/icon` + `/apple-icon` URL 이 prod 에서 404 — Next.js file convention 의 실제 URL 은 `/icon.svg?<hash>` + `/apple-icon.png?<hash>` (확장자 + content hash) 라 확장자 없는 명시 URL resolve 실패. Brave 탭/북마크 default 지구 아이콘 노출. **학습**: head emit 확인 (link 4개 emit) ≠ URL resolve (curl 200) — 다음 시도 시 각 link URL `curl -I` 검증 필수. PNG fallback (구형 안드로이드/IE/RSS) 정공법 재시도 옵션: `public/favicon.ico` 추가 또는 명시 URL 에 hash 포함. ~~단기 deferred~~ → **2026-05-31 [PR #152](https://github.com/Delta-KR/kontaxt/pull/152) (`dcdb0ec`) `app/favicon.ico` 추가로 해소** — `app/icon.svg` 를 source 로 sharp 가 16/32/48px PNG 렌더 → ICO 컨테이너(Vista+ PNG-in-ICO) 임베드 (`npm run favicon:build` 재생성). Next file convention 라 #118 의 명시 URL hash mismatch 위험 없음. prod `/favicon.ico` 404→**200** (`image/vnd.microsoft.icon`) 검증
- [x] **Dashboard 한 사이클 검증** — [PR #119](https://github.com/Delta-KR/kontaxt/pull/119) (`72aabf9`). `docs/qa/dashboard-flow-checklist.md` 신설 (+185 LOC). 풀 플로우 7 단계 (로그인 → 업로드 → 대시보드 → 거래 내역 → 세금 → PDF → 회원관리) + 각 단계 sub-component 명세 + 회귀 체크 (PR 인용 14건) + 자동 회귀 검증 5 명령 + 자주 발견되는 회귀 패턴 5 + 사용자 체크포인트 요약 7 step (5분 사이클). 다음 페이지 분할·major bump PR 머지 직후 한 번 돌려 정착

### Quick Wins 후속 (별도 PR 후보 — Wave 1 sub-agent findings)

- [x] **`OAuthProvider` 동명 타입 cleanup** — [PR #121](https://github.com/Delta-KR/kontaxt/pull/121) (`902a383`). `lib/auth/index.ts` 의 `OAuthProvider` → `SupabaseNativeOAuthProvider` rename. `components/auth/SocialButtons.tsx` 의 import + ProviderConfig.id + cast 3곳 sync. `lib/auth/oauth-providers.ts` 주석 sync. typecheck PASS + 160 tests PASS. 3 파일 +16/-11
- [x] ~~**PR #118 prod 검증** — 4 link emit 확인 ✅~~ → **검증 부족 — emit 확인만 하고 URL resolve 미검증**. emit 된 link 4개 모두 prod `curl -I` 결과 404 (Brave 탭/북마크 default 아이콘 노출). 후속 [PR #123](https://github.com/Delta-KR/kontaxt/pull/123) revert. Wave 1 codex HIGH Q4 경고 ("/apple-icon path resolve 검증 필요") 정확히 적중했으나 머지 결정에 미반영. **다음 검증 routine 부터 head emit + `curl -I` 둘 다 필수**
- [x] **PR #117 prod Naver 로그인 사이클 1회 실측** — 2026-05-28 사용자 검증 PASS. Naver OAuth 정상 동작, `account-takeover blocked` false positive 부재 확인
- [ ] **user_metadata.provider race 영구 fix (정공법)** — Supabase admin REST `POST /auth/v1/admin/users/{id}/identities` 로 `identities` row 직접 insert. 성공 시 `isProviderLinked` 의 user_metadata source 제거 가능 → attacker-controlled source 무력화. 큰 작업 — 별도 의사결정. 단기 deferred (Naver lockout 깨짐 시나리오 이미 PR #83 + #101 으로 해결)

### Day 18 incident 후속 (PR #130 hotfix 학습)

- [x] **Vercel 빌드 fail incident P0 hotfix** — [PR #130](https://github.com/Delta-KR/kontaxt/pull/130) (`cd5aa30`, 2026-05-28). PR #128 머지 후 Vercel build 4 사이클 연속 fail (이메일 알람 4건 14:09·14:15·14:30·14:32 KST). 사용자 facing prod 는 Vercel 직전 success `05f79d9` (#127) 유지로 영향 0. root cause = `scripts/generate-legal-review-artifacts.ts` TS 에러 4건 (L262 `txTypeKr` 시그니처 / L330·L456 `React.createElement` → 함수 직접 호출 / L391 `unifiedToBinanceRow` SWAP 가드). fix 후 production deploy READY 14:42:41 KST (머지 후 2분). 메모리 [[feedback_typecheck_before_merge]] 신설
- [x] **CI/husky pre-push 에 `npm run typecheck` gate 추가** — [PR #143](https://github.com/Delta-KR/kontaxt/pull/143) (`dce6752`, 2026-05-30). 옵션 C 채택 (husky + GHA + branch protection 3중 차단). `.husky/pre-push` 가 `npm run typecheck && npm test` 강제 (~15초, 로컬 fail 시 push 차단) + `.github/workflows/typecheck.yml` 2 잡 (TypeScript + Vitest) 병렬 (원격 머지 차단) + `main` branch protection rule 에 `TypeScript` + `Vitest` required status checks 추가 (사용자 직접 설정 완료, 2026-05-30). 워크트리 `config.worktree` 가 `core.hooksPath` 를 절대 경로로 박은 충돌 발견·해결. graphify post-checkout/post-commit 도 `.husky/` 로 통합. 다음 PR 부터 두 job PASS 안 하면 머지 버튼 비활성화
- [x] **sub-agent verify 강제 패턴** — [PR #143](https://github.com/Delta-KR/kontaxt/pull/143) (`dce6752`, 2026-05-30). `memory/feedback_subagent_verify.md` 신설 + CLAUDE.md 작업 패턴 6) 추가. sub-agent "X건 발견 / 없음 / PASS" 보고는 받자마자 직접 같은 명령으로 cross-check 루틴 명문화

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

### P2 — 검증 절차 (2026-05-28 (c) P2 검증 Phase A·B·C·D 완료)

> 4 phase 완료 — 엔진 신뢰도 A− → **A** 진입. 잔여 2건 (세무사·베타) = 사용자 영역.

- [x] **시행령 §88 2025-02-28 개정 sync** ([PR #124](https://github.com/Delta-KR/kontaxt/pull/124) Phase A) — CLAUDE.md 첫 줄 + SimulatorForm hint + penalty.ts 주석 drift fix. 엔진 자체는 5/22 PR #12 이미 sync 완료 확인
- [x] **엔진 robust 검증 vitest 13 신규** ([PR #125](https://github.com/Delta-KR/kontaxt/pull/125) Phase B) — `total-average.test.ts` +530 LOC. 엣지 6 (Dust / 동일 timestamp / 의제+실가 mix / KST 경계 BUY/SELL / orphan 다거래소) + Property-based 2 (`totalGain - totalLoss === netPnL`, `holdingsAfter === Σ(BUY) − Σ(SELL)`) + 시나리오 5 (의제 50% 단일/혼합 / 다년 carry / 손실만 / 50건 perf)
- [x] **vault sources/ 법령 인덱싱** (Phase C) — 5 신규 source (소득세법-시행령-88조-가상자산 / 92조-평가법 / 183조-비거주자 / vaupl-summary / law-index-kontaxt). gbrain 29 → 35 pages, 469 → 480 chunks. wiki index.md 갱신
- [x] **법령 evidence 회귀 테스트 13 신규** ([PR #126](https://github.com/Delta-KR/kontaxt/pull/126) Phase D) — `legal-evidence.test.ts` +535 LOC. 8 법령 조항별 시나리오 (§37⑤ 의제 / §37⑥+§88⑤ 의제율 50% / §88①+§92②4호 거주자별 / §64의3② 산출세액+250만 / 지방세§93 2% / 시행일 부칙 / 손익 통산 / 다년 carry-over). 각 case 에 법령 조항 + 가이드 LOC 인용
- [x] **세무사 검증 패키지 v0.1 완성** (Phase E 준비) — [PR #128](https://github.com/Delta-KR/kontaxt/pull/128) (`a9d827f`, 2026-05-28). 시나리오 10건 (의제 50% / 다년 carry / 손익 통산 / 거주자·비거주자 / KST 경계 / 지방세 / 가산세 / 다거래소 / 부분 의제 / orphan SELL) + 부속 문서 5종 (법령 references, 거주자 판정 가이드, 의제취득가액 가이드, 검증 시나리오 인덱스, README) + vitest 12 self-check + zip 발송 준비 (`~/Desktop/Kontaxt 세무사 검증 패키지 v0.1.zip` 4.2MB). 사업자등록 후 갑 정보 기재 → 세무사 컨택 → 발송 절차 ([[project_legal_review_package_v01]])
- [ ] **세무사 검증** (Phase E) — 한국 가상자산 전문 세무사 1-2명한테 시나리오 5-10개 결과 검증 의뢰. 비용 30-50만원 예상. **사용자 영역**, 6월 중순 사업자등록 후 진행. 패키지 v0.1 발송 → 피드백 → v0.2 반영 사이클
- [ ] **베타 사용자 dry run** (Phase F) — 실제 거래내역으로 엔진 결과 → 엑셀 손계산 대조. **Phase 7 자체** (베타 모집 후)

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
- [ ] **`/api/report` getSourceInfo 사용** (reuse R#3) — **deferred (효과 미미)**:
  - 잠재 효과 = `/api/report` server action 에서 client wire 의 KRW 환산 값을 server 에서 rate provider 재조회로 cross-check → client JS tampered 환율로 PDF 만드는 시나리오 검출
  - 미미한 이유 — (1) client wire 의 KRW 값 source 가 `lib/engine/exchange-rate.ts` 의 daily_rates DB lookup (Upbit edge function feed) 라 server 재조회와 **같은 source** → 결과 100% 일치 (mismatch 검출 0). (2) 이미 [PR #73](https://github.com/Delta-KR/kontaxt/pull/73) PDF disclaimer ("self-declared worksheet · 거래 원본 미검증") 로 신뢰성 명시 mitigation 완료
  - 비용 — daily_rates DB lookup N회 (transactions 수) → lambda 응답 +50~100ms · 결과 항상 no-op
  - effective gain = 0 / cost > 0 → 별도 의사결정 안 함
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

> ~~Naver `auth.identities` row 직접 insert / Postgres trigger~~ — PR #83 (`user_metadata.provider` 검증) + [PR #101](https://github.com/Delta-KR/kontaxt/pull/101) (`oauth_tokens` token revoke 자동화) 으로 사용자 깨짐 시나리오 해결 → **할 일에서 제거** (2026-05-27).

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

## 📈 Phase 9 — 마케팅 콘텐츠 + SEO/GEO

### ✅ 완료 — SEO/GEO 인프라 (2026-05-29)

2026-05-29 SEO 감사 (기본 8/10) + GEO 도입 검토 → Quick Wins 9건 5 PR 머지. 자세한 일자별 기록은 vault `Daily/2026-05-29.md`.

- [x] **`/guide` FAQPage + HowTo×2 + BreadcrumbList JSON-LD** ([PR #136](https://github.com/Delta-KR/kontaxt/pull/136) `78fa3a7`) — FAQ 8건 + 업비트 6단계 + 바이낸스 7단계 schema.org structured data. ExchangeGuideCard alt 보강 (G1·G6a·G8 일부)
- [x] **`/sample` 자체 metadata + BreadcrumbList** ([PR #135](https://github.com/Delta-KR/kontaxt/pull/135) `73dc1aa`) — root title 상속 → 자체 title+desc+OG (G3·G6b)
- [x] **BreadcrumbList 컴포넌트 + simulator/legal 적용** ([PR #137](https://github.com/Delta-KR/kontaxt/pull/137) `1c31c2b`) — `components/seo/Breadcrumb.tsx` 재사용 컴포넌트 + 3 페이지 적용 (G6c·d·e)
- [x] **Root @graph schema (Organization+WebSite+SoftwareApplication) + AI 크롤러 정책** ([PR #138](https://github.com/Delta-KR/kontaxt/pull/138) `86fc968`) — 단일 SoftwareApplication → @graph 3 entity (`@id` cross-reference) + description 119→142자 + 학습 봇 9 disallow + 검색·RAG 봇 6 allow (G2·G5·G7·G10)
- [x] **이미지 alt 보강 + llms.txt 신규** ([PR #139](https://github.com/Delta-KR/kontaxt/pull/139) `0351cbc`) — hero/exchanges/problem alt "업비트" → "업비트 로고" + Jeremy Howard 표준 llms.txt 2.5KB (핵심 페이지·세법 기준·거래소·FAQ·운영) (G9·llms.txt)

### ✅ 완료 — 측정 인프라 + 성능 (2026-05-30)

2026-05-30 사용자 SEO 점검 후속. GSC·Naver 재크롤 (사용자 직접) + 분석 도입 + PageSpeed 진단 → LCP 최적화. 자세한 기록은 vault `Daily/2026-05-30.md`.

- [x] **Vercel Analytics + Speed Insights** ([PR #144](https://github.com/Delta-KR/kontaxt/pull/144) `fa3ccc9`) — GEO 효과 측정 prereq. Cookie 없음 → PIPA 동의 배너 불필요. Page views + UTM + Core Web Vitals 자동 측정. GA4 는 Phase 3 시점 재검토
- [x] **sitemap.ts /login·/signup 제거 + /simulator 추가** ([PR #145](https://github.com/Delta-KR/kontaxt/pull/145) `0c9391d`) — GSC URL 검사 진단. 인증 페이지는 SEO 가치 X (사이트맵 제거), /simulator 누락 보강. 7 URL → 6 URL
- [x] **P0 모바일 LCP — Pretendard dynamic subset** ([PR #146](https://github.com/Delta-KR/kontaxt/pull/146) `6de1d40`) — PageSpeed 모바일 LCP **11.9s** (데스크톱 100, 모바일 75) 진단. 원인 = PretendardVariable.woff2 단일 **2.0 MB**. globals.css `@import` dynamic subset (unicode-range 92 chunk) 으로 전환. 예상 LCP 11.9s → ~3-4s, 성능 75 → 88+
- [x] **P1 Nav Supabase dynamic import** ([PR #147](https://github.com/Delta-KR/kontaxt/pull/147) `259b353`) — nav.tsx (전 마케팅 페이지) 가 @supabase/ssr (~100KB+) top-level 동기 import → useEffect 내 dynamic import 로 분리. **Next 16 Turbopack 은 bundle-analyzer 미지원 + app-build-manifest 미생성** 으로 로컬 First Load 확증 불가 — prod PageSpeed 재측정으로 확인. 레거시 14KiB 는 browserslist Turbopack 존중 불확실로 skip
- [x] **GSC + Naver 재크롤** (사용자 직접, 2026-05-30) — 6 URL 색인 요청 + sitemap.xml 재제출 (GSC) + 사이트맵 + 6 URL 웹페이지 수집 (Naver). `/simulator` 내부 링크·BreadcrumbList 신호로 이미 색인 확인
- [x] **모바일 LCP P0 — Pretendard self-host 비동기** ([PR #148](https://github.com/Delta-KR/kontaxt/pull/148) `b9fe5cb`) — PageSpeed 모바일 LCP 11.9s 진단 (PretendardVariable 단일 2MB). dynamic subset @import → critical CSS 97.8KB 비대 → FCP 악화. self-host(`public/fonts/`, `npm run fonts:copy`) + bootScript 비동기 로드로 critical CSS 97.8→50.2KB. **재측정: 성능 78→85, FCP 3.5→2.1s, LCP 4.3→3.1s**
- [x] **CLS 회귀 P1 — size-adjust fallback** ([PR #149](https://github.com/Delta-KR/kontaxt/pull/149) `728c18e`) — PR #148 비동기 폰트 후 CLS 0→0.141 회귀 (Hero dashboard 카드 swap reflow). 로컬 Lighthouse 로 폰트 원인 확정 + 3가지 대안 측정(swap/optional/size-adjust). optional 은 성능 85→69 폭락으로 폐기. next/font capsize 값(ascent 93.76/size-adjust 101.55%)을 fallback @font-face 강제. **다운사이드 0** (override 는 fallback 에만). headless 측정 무효 → **prod 재측정 대기** (size-adjust 실기기 작동 여부)
- [x] **CLS 완전 해결 — line-height 명시** ([PR #150](https://github.com/Delta-KR/kontaxt/pull/150) `7c84912`) — PR #149 size-adjust 가 prod 모바일도 무효(CLS 0.141→0.153) 확정 → 폰트 metric **우회**. Hero 카드(.glass)에 `leading-[1.175]`(=Pretendard normal: ascent 93.76+descent 23.75) 명시 → swap 무관 줄높이 고정. localhost Lighthouse **CLS 0.153→0, 성능 85→94**. 무효 size-adjust 제거. 학습 [[reference_font_swap_cls]]: text-[Npx] 임의값=line-height:normal(폰트 의존) swap 취약, line-height 명시가 size-adjust보다 확실
- [ ] **(검증 대기) PR #150 prod 모바일 PageSpeed 재측정** — 사용자 영역. CLS 0 + 성능 90+ 최종 확인 (폰트 우회라 prod 확실 작동 기대). prod 측정 추세: 성능 92(#149) → 94 기대, LCP 11.9→1.6s, CLS 0.153→0

### ✅ 완료 — 인덱싱 모니터링 1차 + 검색엔진 청결 (2026-05-31)

2026-05-31 GEO 인덱싱 모니터링 1차 사이클. 어제 GSC·Naver 재크롤 결과 확인 + Analytics 첫 데이터 점검. 코드/prod 사전 점검 0건 → 발견 2건 fix → prod resolve 검증. 자세한 기록은 vault `Daily/2026-05-31.md`.

- [x] **인증 (auth) 그룹 noindex** ([PR #151](https://github.com/Delta-KR/kontaxt/pull/151) `a3982d3`) — login·signup·forgot·reset 4 client 라우트가 루트 `index:true` 상속 → GSC "발견됨-색인 안 됨" 큐 점유 (검색 가치 0). `(auth)/layout.tsx` 에 `robots:{index:false,follow:true}`. crawl 허용 유지(noindex 태그 노출) + 내부 링크 follow. **prod 검증**: `/login`·`/signup` → `noindex,follow` / 공개 페이지 `index,follow` 회귀 0
- [x] **`/favicon.ico` 404 → app/favicon.ico** ([PR #152](https://github.com/Delta-KR/kontaxt/pull/152) `dcdb0ec`) — Naver "접근 불가한 페이지" 1건. 레거시 클라이언트·Naver Yeti 가 `/favicon.ico` 하드코딩 요청 → 404. icon.svg → ICO(16/32/48px) 임베드. L36 deferred 처리. prod 404→200 검증
- [x] **외부 대시보드 4종 확인** — Vercel Analytics ✅작동(16 PV, 봇 위주·실사용자~0 베타전 정상) / Speed Insights No data(RUM 부족, 패키지 최신 정상) / GSC 5건 중 login·signup fix·나머지 3건 신규 크롤 지연 / Naver 색인 1
- 📌 **Naver 키워드 실수요 신호** — 노출 2건 `"업비트 매도 선입 선출"`·`"빗썸 엑셀파일 코인별"` → 미작성 콘텐츠 broad 매칭. S1 glossary("선입선출법") + Bithumb 가이드 수요 입증, 다음 우선순위 근거

### 🎯 다음 (GEO Strategic Investments)

> 사업자등록 (2026-06 중순) 전후 분리 결정. 블로그 운영 부담 + 법률 책임 동반.

- [ ] **인덱싱 모니터링** — Google Search Console + Naver Search Advisor 매주 체크. 새 schema/AI 정책/llms.txt 노출 확인. 인덱싱 안 되는 페이지 원인 파악. **1차 사이클 2026-05-31 완료 (PR #151·#152 — 위 섹션), 매주 반복**
- [ ] **S1 `/glossary/[term]` 동적 라우트** — 의제취득가액·총평균법·과세표준·필요경비·기본공제·기타소득·분리과세 15-20 term. GEO 인용 토대
- [ ] **S2 거래소·기능별 독립 가이드 페이지 4** — `/guides/upbit-pdf-download`, `/guides/binance-csv-export`, `/guides/swap-tax-handling`, `/guides/usdt-fx-conversion`
- [ ] **S3 `/blog/[slug]` + 분기당 6글** (long-tail 키워드 타깃):
  1. "업비트 PDF로 양도소득세 신고하는 법"
  2. "한국 거주자 가상자산 세금은 왜 총평균법인가 — 시행령 §88① 해설 (FIFO·이동평균이 적용되지 않는 이유)"
  3. "의제취득가액이란? 2027 가상자산 세금 계산법"
  4. "바이낸스 CSV로 한국 양도소득세 신고하기"
  5. "거래소 통합 데이터로 신고하는 이유 (수동 vs 자동)"
  6. "2028년 5월 가상자산 양도소득세 첫 확정신고 일정"
- [ ] **S4 `/exchanges/upbit`, `/exchanges/binance` 독립 페이지** — 거래소별 키워드 흡수
- [ ] **S5 `/pricing` 독립 페이지 + Product schema** — 현재 홈 #pricing anchor → 자체 페이지
- [ ] **S6 publishedDate / dateModified + Article schema** (S2-S3 의존) — GEO 14일 freshness decay 대응
- [ ] **S7 콘텐츠 갱신 7-14일 사이클 routine** — GEO citation decay 대응
- [ ] **랜딩 A/B 테스트** — Hero copy or 가격 카드 variant
- [ ] **사용자 후기 섹션** (베타 첫 5명 후기 모이면 랜딩에 추가)
- [ ] **GA4 / Plausible / Vercel Analytics 도입 결정** — GEO 효과 측정 prereq (Mention Rate · Citation Rate · UTM `utm_source=chatgpt|perplexity` 트래픽)

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
