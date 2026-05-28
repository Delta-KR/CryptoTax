# Dashboard 풀 플로우 검증 체크리스트

> Quick Win — TASKS.md `## 🔧 Quick Wins` "Dashboard 한 사이클 검증". 2026-05-12 이후 직접 풀 플로우 검증 사이클 부재. 2026-05-27 페이지 분할 5 PR (#103·#113·#114·#115·#116, **2233 → 727 LOC -67%**) 후 회귀 가능성 ↑ → 한 번 풀 사이클 후 정착.

## 적용 시점

- 페이지 분할·refactor 큰 PR 묶음 머지 직후 (예: 2026-05-27 4 페이지 분할)
- next/react major bump 후 (예: PR #70 next 14→16)
- engine·parser 수정 후 (예: 의제취득가액 함수 변경)
- 결제·paywall 정책 변경 후
- 각 PR 의 typecheck/vitest 가 catch 못 하는 시각·UX 회귀 검출이 목표

자동화 e2e 가 아닌 **사용자 실측 가이드** — 코드 grep / typecheck / unit test 가 못 잡는 시각·tactile 검증.

## 풀 플로우 단계

### 1. 로그인 / 인증

- `/login` 접속 — Email/Naver/Google/Kakao 4 옵션 확인
- 이메일 로그인 → 비번 입력 → 대시보드 redirect
- 또는 Naver OAuth → callback → `/auth/finish` → 대시보드
- **회귀 체크**:
  - Email 빈 필드 + 제출 시 `Input.error` aria + 인라인 메시지 (reuse R#14, [PR #93](https://github.com/Delta-KR/kontaxt/pull/93))
  - Naver callback → state cookie 정리 (cross-site cookie 끊김 회피, [PR #80](https://github.com/Delta-KR/kontaxt/pull/80))
  - Kakao 클릭 시 → "Coming Soon" 안내 ([PR #81](https://github.com/Delta-KR/kontaxt/pull/81) `enabled:false`, 6월 비즈앱 전환 후 해제)

### 2. 파일 업로드 — `/transactions/upload`

- 거래소 선택 (Upbit / Binance / 향후 Bithumb)
- 파일 형식별 거래내역 업로드:
  - **Upbit**: 다운로드 PDF (한국어 양식)
  - **Binance**: Spot Trade History CSV
  - **(미구현) Bithumb**: XLS — Phase 8 1순위
- 업로드 진행 표시 → 거래소별 파서 호출 → 엔진 계산 → redirect `/dashboard` 또는 `/tax`
- **회귀 체크**:
  - 무관 PDF 거절 (Binance Order History / 영문 Upbit Order History — [PR #5](https://github.com/Delta-KR/kontaxt/pull/5)·#7 fix 케이스)
  - 중복 거래 dedupe ([PR #6](https://github.com/Delta-KR/kontaxt/pull/6))
  - 에러 토스트 영구 표시 ([PR #8](https://github.com/Delta-KR/kontaxt/pull/8))
  - 첫 가입자 = 빈 상태 UI 렌더 (이전 user 데이터 누출 X — localStorage user_id 별 키 격리 [PR #28](https://github.com/Delta-KR/kontaxt/pull/28))

### 3. 대시보드 결과 — `/dashboard`

2026-05-27 PR #116 분할 결과 — 4 sub-component:

- **DashboardStatCards** — 4 StatCard (총 매수·매도·실현손익·납부세액)
- **DashboardCoinChart** — BarChart Card (코인별 손익)
- **DashboardRecentTransactions** — 최근 거래 Table
- **DashboardQuickActions** — 3-card grid (네비 단축)

검증:
- 4 StatCard 가 0/원/한국식 천단위 separator 정확
- 예상 납부세액 = paywall masked (무료) / 실제 값 (premium)
- BarChart 코인 정렬 (실현손익 내림차순)
- 최근 거래 = 시간 역순 5 건
- **회귀 체크** ([PR #116](https://github.com/Delta-KR/kontaxt/pull/116) 분할 후):
  - 무료 사용자 paywall BlurOverlay 가 stat 위에 정확히 덮음
  - PageHeader inline 유지 (app-chrome PageHeader 와 markup 다름)
  - DashboardCoinChart 의 BarChart bar 색상 = brand `#2563EB` 단일

### 4. 거래 내역 — `/transactions`

2026-05-27 PR #114 분할 — 4 sub-component:

- **TransactionFilters** — 4-input (거래소/코인/매수매도/검색)
- **TransactionsTable** — table + pagination + TxRateDetail
- **TxRateDetail** — 환율·통화 출처 audit trail
- **DataBackupCard** — JSON 백업·복원 (own state)

검증:
- 4 필터 동작 (각각 적용 + 조합)
- pagination 페이지 이동
- TxRateDetail 클릭 시 audit row 펼침 — 환율 출처 (Daily Rate · KRW 변환 · BTC 단가 등) 노출
- DataBackupCard — JSON export → import 복구 round-trip
- **회귀 체크** ([PR #114](https://github.com/Delta-KR/kontaxt/pull/114) 분할 후):
  - 모바일 가로 스크롤 정상 ([PR #37](https://github.com/Delta-KR/kontaxt/pull/37) fix 보존)
  - 가장 큰 sub-component (TransactionsTable 175 LOC) state 의존 props 정확 전달
  - filters → table 데이터 흐름 (props drilling) 끊김 없음

### 5. 세금 계산 결과 — `/tax`

2026-05-27 PR #103 + #113 두 차례 분할 — **1056 → 388 LOC (-63%)**, 10 sub-component:

- **TaxStatsRow** (44) — 4 StatCard + BlurOverlay × 2
- **TaxCalcFlowCard** (93) — 계산 흐름 + 납부세액 brand box
- **TaxPerCoinCard** (120) — 코인별 손익 table + paywall
- **CalcRow + Divider** (50) — 계산식 한 줄
- **PremiumBanner** (30) — 결제 유도
- **HoldingsAfterTable** (104) — 이월 보유 자산
- **ExchangeCoinMatrix** (75) — 거래소별 손익 매트릭스
- **RealizedGainList** (181) — 실현손익 + FIFO/MA lot 명세
- **BlurOverlay** (26) — paywall blur
- `_lib/format.ts` — formatShortDate + formatAmount

검증:
- 4 StatCard 정확 (총 매수·매도·실현손익·납부세액)
- 계산 흐름 (양도가액 → 취득가액 → 양도차익 → 기본공제 ₩250만 → 과세표준 → 세율 22% → 산출세액)
- 코인별 손익 매트릭스 (거래소 × 코인) 정확
- FIFO / MA 옵션 토글 시 계산 재실행
- **회귀 체크** ([PR #103](https://github.com/Delta-KR/kontaxt/pull/103) + [PR #113](https://github.com/Delta-KR/kontaxt/pull/113) 분할 후):
  - 재계산 race ([PR #36](https://github.com/Delta-KR/kontaxt/pull/36) `if (recalcing) return` + `disabled={recalcing}` 2중 방어)
  - 의제취득가액 (2026-12-31 시가) 자동 적용 + UI 표시
  - paywall blur 가 무료 사용자의 모든 결과 정확히 덮음
  - props drilling 끊김 없음 (state 의존 강함)

### 6. PDF 다운로드 — `/api/report`

- premium 사용자만 — 무료는 paywall
- "PDF 다운로드" 버튼 → server side `lib/report/tax-report.tsx` 렌더 → @react-pdf/renderer
- 다운로드 파일명 = `Kontaxt_YYYY.pdf` (선택 year)
- **회귀 체크** ([PR #89](https://github.com/Delta-KR/kontaxt/pull/89) ttf path swap 후):
  - PDF 빈 파일 / 500 응답 X (fontkit + Node 24 호환 — 2026-05-27 15시간 hidden broken 종결)
  - Bold weight 진짜 굵음 (헤더·금액·합계 — synthetic bold 아닌 진짜 wght 700 글리프 — 2026-05-27 사용자 시각 검증 PASS)
  - 한국어 글리프 모두 렌더 (Pretendard variable ttf)
  - 4 페이지 구성 (요약 → 손익명세 → 매도명세 → disclaimer)
  - 첫 페이지 disclaimer 박스 ([PR #73](https://github.com/Delta-KR/kontaxt/pull/73) self-declared worksheet)
  - 년도 동기 (`/tax?year=2027` → PDF 도 2027)

### 7. 회원 / 프로필 — `/settings/profile`

2026-05-27 PR #115 분할 — **354 → 72 LOC (-80%)**, 3 self-contained form:

- **DisplayNameForm** (73) — 이름 변경 + refreshSession
- **PasswordChangeForm** (163) — 비번 변경 + captcha + 인라인 에러
- **DangerZoneCard** (108) — 회원탈퇴 Card + Modal + OAuth 권한 해제 안내

검증:
- 이름 변경 → 헤더 표시 즉시 sync (refreshSession)
- 비번 변경 → OAuth-only 사용자 (Naver/Google) 차단 + email 사용자만 진행 ([PR #107](https://github.com/Delta-KR/kontaxt/pull/107) silent enumeration 차단)
- 비번 변경 rate limit (brute-force 차단)
- 회원탈퇴 모달:
  - OAuth 사용자 → 권한 해제 외부 link (Naver/Google) 표시 ([PR #99](https://github.com/Delta-KR/kontaxt/pull/99))
  - Naver 사용자 → token revoke 자동 시도 + 모달 카피 "자동 시도" 명시 ([PR #101](https://github.com/Delta-KR/kontaxt/pull/101))
  - 탈퇴 후 `auth.users` row 삭제 + oauth_tokens row 삭제 (CASCADE)
- **회귀 체크** ([PR #115](https://github.com/Delta-KR/kontaxt/pull/115) 분할 후):
  - 3 form 각각 own state (props drilling 없음 — self-contained 패턴)
  - PasswordChangeForm captcha 가 captcha ON 환경에서 정상 동작 ([reference_supabase_captcha_protection](../../../../Documents/Obsidian%20Vault/kontaxt-vault/Projects/) 회피)

## 자동 회귀 검증 (claude 처리 가능)

다음은 사용자 실측 전 self-check 항목 — 다음 페이지 분할 PR 머지 직후 자동 실행:

```bash
# 1. typecheck PASS
npm run typecheck

# 2. unit test PASS
npx vitest run

# 3. 분할된 sub-component import 끊김 grep
grep -rn "from './_components/" app/\(app\)/ | wc -l   # 분할 후 import 갯수 변화 확인

# 4. unused import 검출
npx eslint app/\(app\)/ --rule 'no-unused-vars: error' 2>&1 | grep "is defined but never used"

# 5. prod head 검증 (디플로이 후)
curl -s https://kontaxt.kr/dashboard | grep -E '<link rel="(icon|apple-touch-icon)"'
```

## 자주 발견되는 회귀 패턴 (history 기반)

- **모바일 viewport** — Chrome MCP browser_batch 로 1440px·375px 시각 audit. 코드 grep 으로 못 잡는 시각 깨짐 (orphan word, strikethrough 효과, backdrop-filter containing block 등 — [PR #61](https://github.com/Delta-KR/kontaxt/pull/61)·#62·#96·#102 사례)
- **OAuth callback** — sameSite=strict 가 cross-site Naver callback 에서 cookie 끊김. lax 필수 ([PR #80](https://github.com/Delta-KR/kontaxt/pull/80) 사례)
- **client storage 격리** — user_id 별 키 분리 — 같은 브라우저 A→B 계정 전환 시 누출 위험 ([PR #28](https://github.com/Delta-KR/kontaxt/pull/28) 사례)
- **PDF 렌더링** — fontkit + Node 24 호환 — variable ttf 만 (woff2 decompressor 깨짐). bundle 6.74MB ([PR #89](https://github.com/Delta-KR/kontaxt/pull/89) 사례)
- **재계산 race** — 동일 ID 함수 동시 호출 = `if (recalcing) return` + `disabled` 2중 방어 ([PR #36](https://github.com/Delta-KR/kontaxt/pull/36) 사례)

## 사용자 체크포인트 요약 — 한 번 풀 사이클 (5분)

> 다음 PR 가 머지된 직후 한 번 돌려보면 됨. 각 단계 시각 확인 1초.

1. ✅ 로그인 (email 또는 Naver) → 대시보드 도착
2. ✅ `/transactions/upload` → 샘플 거래내역 1개 업로드 → 대시보드 결과 노출
3. ✅ `/dashboard` → 4 StatCard 값 정확 + paywall 위치 (무료) / 실제 값 (premium)
4. ✅ `/transactions` → 필터 1개 적용 → table 결과 변경
5. ✅ `/tax` → 계산 흐름 카드 + 코인별 손익 매트릭스
6. ✅ `/api/report` PDF 다운로드 → 4 페이지 + Bold weight + 한국어 정상
7. ✅ `/settings/profile` → 이름 변경 즉시 sync

회귀 발견 시 → `feedback_*` 메모리 신설 + TASKS.md `## ⚠️ 알려진 이슈 / 리스크` 등록 + 사후 PR.

---

## 변경 이력

- **2026-05-28** — 신설. 2026-05-27 4 페이지 분할 (#103·#113·#114·#115·#116) 직후 풀 플로우 검증 가이드 정착.
