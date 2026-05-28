# Kontaxt

> 한국 가상자산 양도소득세(2027.01.01 시행) 정산 SaaS.
> Upbit / Binance / Bithumb 거래내역을 한국 세법(시행령 §88①·총평균법·의제취득가액·22%)에 맞춰 통합 계산.

[kontaxt.kr](https://kontaxt.kr) · D-219 to 2027.01.01 · Next.js 16 · React 19 · Supabase · Resend

---

## What is Kontaxt

거주자 가상자산 양도소득세는 2027.01.01 시행이다. 거래소마다 데이터 포맷이 다르고(PDF / CSV / XLS), 세법은 총평균법·의제취득가액·연간 250만원 공제·22% 단일세율을 요구한다. Kontaxt 는 거래내역을 업로드받아 세법에 맞춰 정산하고, 세무사 전달용 신고 PDF 까지 한 번에 만들어낸다.

대상은 한국 거주자 개인 투자자. 무료 양도 시뮬레이터로 결과를 미리 확인할 수 있고, 회원가입 후 거래내역 통합 계산·결과 검토·신고용 PDF 다운로드까지 진행한다.

---

## Quick Start

```bash
# clone & install
git clone https://github.com/Delta-KR/kontaxt.git
cd kontaxt
npm install

# 환경변수 — .env.local 에 작성. 자세한 키는 docs/env.md.
# 최소 필수:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#   NEXT_PUBLIC_TURNSTILE_SITE_KEY
#   TURNSTILE_SECRET_KEY

# dev server
npm run dev               # http://localhost:3000

# typecheck / tests
npm run typecheck
npm test                  # vitest (엔진·파서·검증 273 케이스)

# Playwright smoke (마케팅·인증 페이지 8건)
npm run e2e:install       # 최초 1회 chromium 다운로드 (~92MB)
npm run e2e               # 자동으로 dev 서버 띄우고 실행
npm run e2e:ui            # UI mode (디버깅용)

# 이메일 미리보기
npm run email:dev         # http://localhost:3001
npm run email:build       # emails/*.tsx → emails/dist/*.html
```

Node 20.x 필요(`package.json#engines`, fontkit + @react-pdf/renderer 호환).

---

## Tech Stack

| 영역 | 선택 |
|---|---|
| Framework | Next.js 16 (App Router · RSC) · React 19 |
| Styling | Tailwind 3.4 · CSS variables (light/dark) · Pretendard · JetBrains Mono |
| Auth | Supabase Auth (이메일·Google·Naver OAuth) · Cloudflare Turnstile |
| DB | Supabase Postgres + Row Level Security |
| 이메일 | Resend (Custom SMTP) + React Email |
| PDF | `@react-pdf/renderer` + Pretendard variable ttf |
| Validation | Zod |
| Rate limit | Upstash Redis (sliding window) |
| Test | Vitest (273 케이스 · 엔진·파서·검증) · Playwright smoke (마케팅·인증) |
| Host | Vercel (Node 20.x runtime) |
| Domain | kontaxt.kr (Cloudflare DNS · 도메인 등록 가비아) |

---

## Architecture Overview

4-layer 구조. 모든 인앱·API 경로는 Supabase Auth 세션을 요구하며, server action·route handler 에서 `requirePremium` / RLS 로 권한 확인한다.

```
┌─ Marketing (public · 정적) ─────────────────────────────────┐
│  app/(marketing)/        Hero·Pricing·FAQ·Guide·Sample      │
│  app/(marketing)/simulator/   회원가입 없이 양도세 추정       │
└─────────────────────────────────────────────────────────────┘
                          │ 가입·로그인
                          ▼
┌─ Auth ───────────────────────────────────────────────────────┐
│  app/(auth)/             signup · login · reset-password    │
│  app/api/auth/naver/     state cookie sameSite=lax          │
│  emails/                 verify · reset · welcome 트랜잭셔널 │
└─────────────────────────────────────────────────────────────┘
                          │ 로그인 세션
                          ▼
┌─ In-app SaaS (인증 필수) ────────────────────────────────────┐
│  app/(app)/dashboard/    온보딩 + 거래소 업로드 진입         │
│  app/(app)/transactions/ 업로드 + 통합 거래내역 테이블        │
│  app/(app)/tax/          엔진 결과 + 재계산 + 옵션 토글       │
│  app/(app)/report/       신고용 PDF 다운로드 (premium gate)   │
│  app/(app)/billing/      포트원 결제(통합 진행 중)            │
│  app/(app)/settings/     의제취득가액 override · 계정         │
└─────────────────────────────────────────────────────────────┘
                          │ server action / API
                          ▼
┌─ Engine & Infra ─────────────────────────────────────────────┐
│  lib/parsers/   Upbit PDF · Binance CSV → ParsedTransaction │
│  lib/engine/    normalizer → 총평균/FIFO/MA → tax-calculator │
│  lib/engine/    deemed-cost · exchange-rate · penalty       │
│  lib/report/    react-pdf 신고서 + Pretendard ttf            │
│  app/api/report/  PDF 생성 (Node 20.x, fontkit raw ttf)     │
│  supabase/      profiles · daily_rates · deemed_cost_*       │
│                 + Edge function (Upbit 일별 환율 cron)       │
└─────────────────────────────────────────────────────────────┘
```

자세한 트리:

```
app/
  (marketing)/       랜딩 + 게스트 페이지 (정적 ISR · revalidate=86400)
    page.tsx         Hero · Problem · HowItWorks · Example · Exchanges
                     Features · Pricing · CTA · Footer
    simulator/       회원가입 없이 querystring 공유 가능한 양도세 추정
    guide/ sample/   가이드 · 샘플 결과
    legal/           이용약관 · 개인정보처리방침
  (auth)/            signup · login · forgot-password · reset-password
  (app)/             인증 필수 — AppShell 안에서 useCurrentUser context
    dashboard/       랜딩 진입점
    transactions/    업로드 + 통합 거래 테이블
    tax/             세금 결과 + 재계산 + 엔진 옵션
    report/          PDF 다운로드 (premium)
    billing/         결제 (포트원 통합 진행 중)
    settings/        deemed-cost override · 계정
  api/
    report/          PDF 생성 (POST · rate-limited · premium)
    auth/naver/      OAuth start + callback (state cookie lax)

lib/
  parsers/           각 거래소 → ParsedTransaction
  engine/            normalizer · FIFO · MA · total-average ·
                     deemed-cost · exchange-rate · penalty · tax-calculator
  pricing/plans.ts   단일 source — ₩49,900 원타임 / ₩89,000/년 구독
  report/            @react-pdf/renderer 컴포넌트 + font-config
  email/             Resend SDK 래퍼 (welcome 등 자체 발송)
  auth/              client-ip · naver helper · finish-nonce
  supabase/          server/client 분리 + admin
  rate-limit.ts      makeLimit(prefix, count, window)

components/
  sections/          marketing 섹션 컴포넌트
  app-chrome/        Nav · Footer · UserContextProvider
  ui/                Button · Input · FormErrorBanner 등

supabase/migrations/ 13 마이그레이션 (profiles · daily_rates ·
                     deemed_cost_snapshots · rls_initplan 최적화 등)
emails/              verify-email · reset-password · welcome (React Email)
public/              로고 · 거래소 SVG · OG 이미지
docs/                business-plan · tax-law-compliance · env · audit/
```

---

## Domain — 한국 가상자산 양도소득세

거주자(개인) 양도소득세는 2027.01.01 시행. 핵심 규정:

- **취득가액 산정** — 시행령 §88①·§92②4호 → **총평균법 단일 적용**(연간 평균 단가). FIFO·이동평균은 비거주자 모드(§183⑥) 또는 참고용 시나리오로만 사용. `lib/engine/total-average.ts` 가 디폴트 경로.
- **의제취득가액** — 2027.01.01 이전 취득분은 (실제 취득가액 vs 2026.12.31 시가) 중 큰 값 적용. `lib/engine/deemed-cost.ts` + Supabase `deemed_cost_snapshots` 테이블 + 사용자 override(`settings/deemed-cost`).
- **기본공제** — 연 250만원.
- **세율** — 22%(소득세 20% + 지방세 2%) 단일세율.
- **환율 변환** — 해외 거래소(Binance) 거래의 USDT·USD 표시 금액은 거래일 KST 기준 환율로 KRW 환산. `lib/engine/exchange-rate.ts` + Supabase `daily_rates`(Upbit Edge function 일별 cron).
- **가산세** — 무신고 20% · 부정 40% · 납부지연 일 0.022%. `lib/engine/penalty.ts`.

전체 시행령 매핑·예시 케이스는 [`docs/tax-law-compliance.md`](docs/tax-law-compliance.md) 참조. 산식 검증용 vitest 케이스는 `lib/engine/__tests__/`.

---

## 거래소 파서

| 거래소 | 포맷 | 상태 |
|---|---|---|
| Upbit | PDF (거래내역) | Live · `lib/parsers/upbit.parser.ts` |
| Binance | CSV (Spot Trade History) | Live · `lib/parsers/binance-spot.parser.ts` |
| Bithumb | XLS | Coming Soon (Phase 8 1순위) |
| Coinone / Bybit / OKX / Bitget / Coinbase | 거래소별 | Coming Soon |

각 파서는 `ParserInterface` 를 implements 해서 `lib/parsers/registry.ts` 에 등록. 신규 파서는 5단계:

1. 샘플 거래내역 파일 확보(베타 사용자 협조 또는 본인 계정).
2. `lib/parsers/{exchange}.parser.ts` 구현 — `parse(file)` 이 `ParsedTransaction[]` 반환.
3. `registry.ts` 에 등록.
4. `lib/parsers/__tests__/{exchange}.test.ts` 정상 + 엣지케이스 3~5개.
5. 랜딩 `components/sections/exchanges.tsx` 의 Coming Soon → Live 이동.

Upbit PDF 파싱은 `pdf-parse@1` 고정(Vercel serverless DOMMatrix 미지원). v2 마이그레이션은 보안 업데이트 끊기는 시점에 재검토.

---

## PDF 신고용 리포트

`app/api/report/route.ts` 가 `@react-pdf/renderer` + `lib/report/tax-report.tsx` 컴포넌트로 신고서 PDF 를 생성한다. premium 사용자만 다운로드 가능(`requirePremium`), rate limit 적용, 첫 페이지에 self-declared worksheet disclaimer 박스.

**Node 20.x 런타임 고정 학습**:
- `package.json#engines.node = "20.x"`(PR #88).
- Pretendard 는 **variable ttf**(`PretendardVariable.ttf`)를 사용. woff2 는 fontkit 의 decompressor 가 Node 24 DataView 환경에서 `Offset is outside the bounds of the DataView` 로 깨진다(PR #89 ttf path swap 으로 해결).
- ttf 는 압축이 없어 fontkit decompressor 경로를 건드리지 않음. variable 1 파일로 모든 weight 자동 처리 — Bold 까지 실제 weight 700 글리프로 렌더(PR #90 시각 검증 PASS).
- `next.config.mjs` 의 `outputFileTracingIncludes` 가 lambda bundle 에 ttf 포함.

자세한 incident 기록은 `TASKS.md` `/api/report incident 2026-05-26` 절.

---

## 이메일

**Architecture** — Supabase Custom SMTP via Resend.

```
[가입/재설정 트리거]
      ↓
Supabase Auth (토큰 생성 + 템플릿 머지)
      ↓ SMTP
Resend (kontaxt.kr SPF/DKIM/DMARC 인증)
      ↓
사용자 받은편지함
```

- 토큰·매직링크 생성 — Supabase Auth.
- HTML 템플릿 저장 — Supabase Dashboard → Auth → Email Templates(`{{ .ConfirmationURL }}` 같은 Go 변수 그대로).
- SMTP 발송 — Resend (`kontaxt.kr` 도메인 인증 완료).
- Welcome 메일만 예외 — 인증 콜백에서 `lib/email/send.ts#sendWelcomeEmail()` 로 자체 발송.

빌드:

```bash
npm run email:build       # emails/*.tsx → emails/dist/*.html
                          # → Supabase 템플릿에 붙여넣을 최종 HTML
```

로고는 단일 brand blue PNG(`public/kontaxt-logo-brand.png`) — Apple Mail 다크모드 swap 4가지 시도(base64 / CSS filter / picture / inline display:none)가 전부 실패해서 단색 PNG 로 정착. **반복 금지**(CLAUDE.md "알려진 함정").

---

## Design & Voice

코드와 UI 의 시각·언어 표준은 두 단일 source 로 분리되어 있다.

- [`DESIGN.md`](DESIGN.md) — 시각 시스템: 5대 디자인 원칙 · 컬러 토큰 · 타이포 스케일 · 간격 · 시각 안티패턴(블롭·그라디언트·이모지 금지).
- [`VOICE.md`](VOICE.md) — 언어 시스템: 컨텍스트별 종결어(친밀 해요체 vs 격식 합니다체) · 한·영 병기 패턴 · 금지어 사전 · AI 안티패턴 28개. 미러: `.claude/brand-voice-guidelines.md`(brand-voice 스킬 자동 발견).

새 카피·이메일·페이지 작성 시 두 문서를 모두 통과해야 한다. 자세한 grep 3종(soft 금지어·hard 금지어·AI 안티패턴)과 워크플로우는 [`CLAUDE.md`](CLAUDE.md) "작업 패턴 5)" 절 참조.

---

## Database (Supabase)

13 마이그레이션(2026-05-18 ~ 2026-05-23):

- `profiles` — 사용자 메타데이터 · premium 상태 · RLS 격리.
- `daily_rates` — Upbit USDT/KRW 일별 환율(Edge function cron).
- `deemed_cost_snapshots` — 2026.12.31 시가 스냅샷 + 자동 승격 함수.
- `user_deemed_cost_overrides` · `user_imputed_expense_coins` — 사용자 override.
- 보안 잠금 — `lockdown_profiles_and_cron_secret` · `revoke_security_definer_exposure` · `optimize_rls_initplan`(advisor 0 finding).

prod 작업은 Claude Code 의 `mcp__supabase__*` MCP 도구로 직접 조작(advisors / migrations / edge function 배포 / logs / tables).

---

## Project Structure

세부 트리는 위 Architecture Overview 다이어그램 참조. 핵심 진입점:

- `app/(marketing)/page.tsx` — 랜딩(10 섹션).
- `app/(app)/tax/page.tsx` — 세금 결과 페이지(엔진 결과 + 재계산 + 옵션 토글, 1056 LOC, 분할 예정).
- `lib/engine/tax-calculator.ts` — 엔진 dispatch 진입점.
- `lib/engine/total-average.ts` — 거주자 기본 경로(시행령 §88①).
- `lib/parsers/registry.ts` — 거래소 파서 레지스트리.
- `lib/pricing/plans.ts` — 가격 단일 source(₩49,900 원타임 / ₩89,000/년 구독, Phase 2).
- `app/api/report/route.ts` — PDF 생성 route(`maxDuration=60`, premium gate).

이전 마케팅 디자인 핸드오프(섹션·토큰·인터랙션 세부 명세)는 디자인 시스템이 `DESIGN.md` 로 단일화되면서 제거됨. 옛 디자인 정적 프로토타입은 `design/` 폴더에 그대로 남아 있다.

---

## Contributing

이 repo 는 1인 메인테이너 + Claude Code 페어 작업 패턴이다. 외부 PR 은 받지 않지만 코드 참고와 이슈 제기는 환영.

- 작업 흐름·결정사항은 [`CLAUDE.md`](CLAUDE.md)(코드 가이드라인 + 알려진 함정).
- 작업 목록은 [`TASKS.md`](TASKS.md).
- 디자인·언어 표준은 [`DESIGN.md`](DESIGN.md) · [`VOICE.md`](VOICE.md).
- 감사 보고서는 [`docs/audit/`](docs/audit/) (security / ux / logic / quality / perf · 2026-05-23).

코드 변경 후 필수: `npm run typecheck && npm test`. 사용자-노출 카피 변경 시 VOICE.md grep 3종 통과 필수.

---

## License

Proprietary. © 2026 Kontaxt.
