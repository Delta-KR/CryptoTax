# Kontaxt — Claude Code Working Memory

Claude Code가 이 워크트리에서 작업할 때 먼저 읽는 파일. 프로젝트의 컨텍스트와 결정사항이 여기 모인다.

---

## 프로젝트 한 줄

**Kontaxt** — 한국 가상자산 양도소득세(2027.01.01 시행) 정산 플랫폼. Upbit / Bithumb / Binance CSV·PDF·XLS를 한국 세법(FIFO, 이동평균, 의제취득가액, 250만원 공제, 22%)에 맞춰 통합 계산.

## 핵심 문서

- `README.md` — 디자인 핸드오프, 토큰, 섹션 구조
- `DESIGN.md` — 시각 시스템·5대 원칙·시각 안티패턴 (이메일·UI 모두 적용)
- `VOICE.md` — 언어 시스템·종결어 표준·금지어 사전·컨텍스트별 톤 매트릭스 (모든 사용자-노출 텍스트). 미러: `.claude/brand-voice-guidelines.md` (brand-voice 스킬 자동 발견)
- `TASKS.md` — 현재 작업 목록·로드맵
- `docs/audit/` — 감사 보고서 (security·ux·logic·quality·perf)
- `.claude/claude-security-guidance.md` — security-guidance 플러그인이 모델 검토 시 로드하는 Kontaxt 보안 위협 모델 (RLS·OAuth·파일 파서·PII)
- `.claude/security-patterns.json` — 편집 직후 결정론적 매칭 패턴 22개 (NEXT_PUBLIC_ 시크릿·service role 오남용·localStorage 격리·sameSite=strict 등)

## 스택

Next.js 14 (App Router) · React 18 · Tailwind · Supabase (Auth + Postgres + RLS) · Resend (SMTP) · Pretendard / JetBrains Mono

---

## 탐색 — graphify (코드) + gbrain (문서) 우선

이 레포는 **두 knowledge base** 가 빌드돼 있다. 새 세션에서 탐색 시 grep/glob 보다 먼저 시도할 것 — 컨텍스트 점유가 작고 정확하다. **2026-05-26 결정**: 두 도구 역할 분리 (코드 = graphify / 문서 = gbrain). 중복 아님.

### 역할 매트릭스

| 탐색 대상 | 도구 | 이유 |
|----------|------|------|
| 코드 함수·심볼·관계 | **graphify** | AST 기반 (무료, 정확) |
| 마크다운 문서·노트·audit·plan·VOICE/DESIGN/CLAUDE.md | **gbrain** | tsvector keyword + RRF hybrid search |
| 거래소 파서·세법 엔진 같은 도메인 코드 | **graphify** | 심볼 정의·호출 관계 |
| "왜 총평균법?" 같은 결정 컨텍스트 | **gbrain** | 문서·노트 검색 |

### graphify 명령 (코드)

| 목적 | 명령 |
|------|------|
| 개념·기능 조회 | `graphify query "<질문>"` |
| 두 심볼/모듈 사이 관계 | `graphify path "<A>" "<B>"` |
| 개별 개념 설명 | `graphify explain "<concept>"` |
| 넓은 아키텍처 리뷰 | `graphify-out/GRAPH_REPORT.md` |

코드 변경 후: `graphify update .` (AST 기반, API 비용 없음).

### gbrain 명령 (문서)

| 목적 | 명령 |
|------|------|
| 키워드 검색 (BM25) | `gbrain search "<terms>"` |
| 자연어 질문 (hybrid RRF) | `gbrain query "<질문>"` 또는 `gbrain ask "<질문>"` |
| 페이지 읽기 | `gbrain get <slug>` |
| 전체 stats | `gbrain stats` |
| **MCP 호출** (새 세션부터) | `mcp__gbrain__*` 도구 자동 사용 가능 |

문서 변경 후: `gbrain sync --repo /Users/delta/Desktop/kontaxt` (incremental).

**Semantic vector search 는 OPENAI_API_KEY 또는 VOYAGE_API_KEY 추가 시 활성** (현재는 keyword search 만 동작 — 마크다운 검색엔 충분).

---

## 작업 패턴 (검증된 워크플로우)

### 1) 작은 PR 사이클 — 큰 머지 직후 prod 검증 fix

큰 PR (예: 21파일 audit trail) 머지 후 prod 검증에서 UX·견고성 구멍이 줄줄이 발견되면, **각 fix를 별도 PR로 1건씩 분리해 빠르게 머지** (분당 1 PR 가능). 묶음 PR로 만들지 말 것.

- 검증된 사례: PR #5~#9 (2026-05-20), PR #33~#37 (2026-05-23)
- Squash merge, main 히스토리 PR당 1 커밋 유지
- 사용자 명시 동의(`ㄱㄱ`) 받은 후 머지 호출 — PR 생성 + 즉시 머지 같은 turn에 chain하면 auto-classifier가 막을 수 있음

### 2) 대규모 fix (10건+) — Subagent + worktree 병렬

1. **5개 배치로 분할** (충돌 가능성 기준 — 예: SQL / Marketing / PDF·Auth / Backend / Rate-limit·PIPA)
2. **subagent 병렬 dispatch** — `Agent({ isolation: "worktree" })`로 각 subagent가 독립 worktree에서 작업
3. **5개 별도 PR 생성** (작은 PR 사이클과 일치)
4. **머지 순서 신중** — 의존 base PR(공통 헬퍼 신설) 먼저, 같은 파일 수정 PR은 후순위
5. **충돌 resolve** — 두 변경 모두 보존 (import 양쪽 유지, 함수 분리) + typecheck 1차 검증 → `push --force-with-lease` → `gh pr merge`

5개 적정. subagent 6개 이상 동시 dispatch 시 API 529 위험.

### 3) 사용자 메시지 변수 ≥ 3개

에러·warning 메시지의 변수 수가 1~2개뿐이면 **사용자는 매크로/하드코딩으로 인식**한다. 데이터에 있는 컨텍스트(거래소·기간·총량·해결 액션 대상)를 의식적으로 풀어내라.

- 같은 데이터가 세션에 누적되면 변수 5개여도 또 매크로처럼 보임 → **출처/시점 메타 정보** 명시 ("이번 업로드 결과" vs "이전 세션 누적")
- 추정치는 출처(범위·시점)를 메시지에 포함해 "왜 추정인지" 즉시 이해 가능하게

### 4) Supabase prod 작업은 MCP로

CLI 미설치 환경에서 `mcp__supabase__*` 도구로 prod 직접 조작 가능:
- `apply_migration` / `deploy_edge_function` / `execute_sql` / `get_advisors` / `get_logs` / `list_tables`

prod 영향이라 사용자 명시 허락 후만. `apply_migration`은 reversible 어려움.

### 5) 사용자-노출 카피 작성·수정 — VOICE.md 강제 통과

마케팅·앱·이메일·에러·법률 등 사용자 눈에 보이는 모든 한국어 텍스트는 [VOICE.md](VOICE.md)가 단일 source. **Tier 3 톤 mix 가 Kontaxt 의 공식 브랜드 보이스로 확정** (2026-05-25). DESIGN.md = 시각 시스템 / VOICE.md = 언어 시스템 — 두 문서 모두 같은 5대 원칙 공유.

**친밀 영역** (해요체): 마케팅·CTA·Guide·FAQ·Sample·**(marketing)/simulator**·**(app)/* 인앱 UI**·**(auth)/* 인증**·Toast·Error·Empty state.
**격식 절대 유지** (-습니다, 6 영역): Security 카드 body·Footer 법적 disclaimer·Email H1·Legal·Report 법적 disclaimer·Example 법조항 인용.

새 카피·기존 카피 수정 시:

1. **작성 전** — VOICE.md §10 컨텍스트 매트릭스에서 해당 위치(Hero/Section Title/FAQ/Button/Email H1/Legal Clause 등) 표준 길이·종결어·**톤(친밀/격식)** 확인
2. **작성 중** — §3 종결어 컨텍스트별 mix (마케팅 해요체 / Security·Legal·Email 격식), §2 인칭 (Hero·Sample = "내·나의", 본문 = 무인칭, 보안 = "본인", **"당신" 0건**), §6 마침표 (SectionTitle도 마침표·물음표), §5 한·영 병기, §7 숫자 한국식, §8 금지어 회피
3. **작성 후 — grep 3종 필수 통과 (모두 0건)** — humanizer 신규 키워드 포함:
   ```bash
   # Soft 금지어 (§8 + humanizer puffing)
   grep -En "솔루션|스마트한|원스톱|초간단|초고속|혁신|차원이 다른|걱정 없이|고민 끝|꿀팁|꿀템|역사적 전환점|기념비적|큰 도약|밝은 미래|성장의 길" <file>
   # Hard 금지어 (§8 + humanizer 챗봇·아첨·signposting)
   grep -En "고객님|여러분|단 한 번의 클릭|이제 더 이상|~에 지치셨나요|!|도움이 되셨길|도움이 되길 바랍|필요하시면 알려|추가 질문 있으|좋은 질문|정말 좋은|이제 살펴|한번 알아|다음으로 넘어" <file>
   # AI 안티패턴 (§9 + humanizer copula·authority)
   grep -En "강력하고|정확하며|신뢰할 수 있는|완벽한|최고의|압도적|매우|굉장히|정말로|역할을 합니다|자리잡고 있|기능합니다|본질적으로|핵심은|정말 중요한|결국 중요한|단순한 .* 아니라|뿐만 아니라" <file>
   ```
4. **복잡한 카피·새 페이지/이메일 작성 시 — 스킬 호출 옵션 2가지**:
   - **한국어 카피** → `brand-voice:enforce-voice` (자동으로 `.claude/brand-voice-guidelines.md` 발견 → Kontaxt 컨텍스트 적용)
   - **영문 카피·문서 (README, business plan 등)** → `/humanizer` ([.claude/skills/humanizer/](.claude/skills/humanizer/SKILL.md) project-local vendor, Wikipedia "Signs of AI writing" 29 패턴)
5. **새 안티패턴·드리프트 발견 시** — VOICE.md §8/§9 보강 + §14 변경 이력 한 줄 + 미러 sync (`cp VOICE.md .claude/brand-voice-guidelines.md`)

**drift fix 완료**: [PR #57](https://github.com/Delta-KR/kontaxt/pull/57) (`f93e456`) — SectionTitle 마침표 12건 · 해요체 4건 · 이모지 1건 · Tax-Loss Harvesting 병기 · README 통계 sync.

---

## 알려진 함정 (반복 금지)

세션에서 같은 실수 반복하지 말 것. 자세한 컨텍스트는 auto-memory 참조.

- **이메일 로고 다크모드 swap** — base64 인라인 / CSS `filter` invert / `<picture>` `prefers-color-scheme` / inline `display:none` 분기 **4가지 모두 Apple Mail에서 실패**. 정답은 단일 brand blue PNG (`public/kontaxt-logo-brand.png`).
- **Supabase captcha protection** — captcha ON 상태에서 서버 액션 `signInWithPassword`는 `captchaToken` 없이는 400 reject. 에러를 "비번 불일치"로 매핑하면 무한 재시도 발생. `reauthError.message`에 `captcha` 포함 여부로 분기 필요.
- **Supabase Free tier — `auth_leaked_password_protection`** — Pro 전용. Security Advisor에 영구 warning으로 남음. **무시해야 정상**. "Dashboard에서 켜라" 안내 금지.
- **이메일 인프라 안내 반복** — Resend 가입/도메인 인증/환경변수/Custom SMTP/Email Templates **전부 완료된 상태**. "혹시 가입하셨나요?" 같은 재확인 금지.
- **client-side 데이터 격리** — localStorage / sessionStorage / IndexedDB / non-HttpOnly cookie에 user 데이터 저장 시 user_id별 키 분리 필수. 단일 키 = 격리 실패 → 같은 브라우저 A→B 계정 전환 시 누출. 보안 검사 시 server-side 위주 도구가 자주 놓침.

---

## 이메일 시스템

### 아키텍처 — Supabase Custom SMTP via Resend

```
[가입/재설정 트리거]
      ↓
Supabase Auth (토큰 생성 + 템플릿 머지)
      ↓ SMTP
Resend (실제 발송 + DKIM 서명, kontaxt.kr 도메인)
      ↓
사용자 받은편지함
```

| 책임 | 담당 |
|------|------|
| 토큰·매직링크 생성 | Supabase Auth |
| HTML 템플릿 저장 | Supabase Dashboard → Auth → Email Templates |
| SMTP 발송 | Resend (Supabase Custom SMTP 설정) |
| 도메인 인증 (SPF/DKIM/DMARC) | Resend 대시보드에서 `kontaxt.kr` |

**Welcome 메일은 예외** — Supabase Auth 흐름이 아니라 인증 콜백에서 자체 트리거. `lib/email/send.ts`의 `sendWelcomeEmail()` 호출.

### 파일 구조

```
emails/
├── README.md                    # 이메일 시스템 전반 가이드
├── components/
│   ├── tokens.ts                # 색상·폰트·간격 (DESIGN.md → inline hex)
│   ├── EmailLayout.tsx          # 헤더·카드·푸터·Trust strip
│   ├── EmailButton.tsx          # Primary / Secondary
│   ├── BilingualBlock.tsx       # 한국어 + 영어 병기 패턴
│   └── kontaxt-logo.ts          # 단일 brand blue PNG (Apple Mail 호환)
├── verify-email.tsx             # Supabase 변수 사용: {{ .ConfirmationURL }}, {{ .Email }}
├── reset-password.tsx           # Supabase 변수 사용: {{ .ConfirmationURL }}
├── welcome.tsx                  # 실제 URL (자체 발송용)
├── dist/                        # 빌드 결과 (gitignored, npm run email:build로 재생성)
│   ├── verify-email.html        ← Supabase 템플릿에 붙여넣을 최종 HTML
│   ├── reset-password.html      ← Supabase 템플릿에 붙여넣을 최종 HTML
│   └── welcome.html             ← Resend SDK로 자체 발송
└── preview/index.html           # 패키지 없이 브라우저로 열어 보는 정적 미리보기

lib/email/
├── send.ts                      # Resend SDK 래퍼 (welcome 등 자체 발송용)
└── integration-examples.md      # Supabase + Resend 연동 패턴 4가지

scripts/
└── build-emails.ts              # React Email → 정적 HTML 빌드
```

### 빌드 / 미리보기

```bash
npm run email:build       # emails/*.tsx → emails/dist/*.html
npm run email:dev         # http://localhost:3001 — 실시간 미리보기
```

### 카피 톤 규칙 (이메일에도 적용)

전체 언어 표준은 [VOICE.md](VOICE.md) 참조. 이메일은 다음 5가지가 핵심:
- 헤드라인은 마침표 있는 단문 한 문장 (VOICE.md §10 — Email H1)
- 한국어가 시각적으로 우선, 영어는 작고 muted (VOICE.md §5)
- 그라디언트·이모지·블롭 금지 (DESIGN.md 8장 시각 안티패턴)
- brand blue 단일 컬러 (`#2563EB`)
- 숫자는 `tabular-nums` 또는 `.num` 클래스 (VOICE.md §7)

### 향후 작업 시 주의

- React Email render() 결과의 `{{ .ConfirmationURL }}` 같은 Go template 변수가 escape되는 경우가 있어, `scripts/build-emails.ts`의 `restoreSupabaseVars()`에서 후처리. 새 Supabase 변수 추가 시 이 함수에도 패턴 추가 필요.
- Supabase 기본 발송이 이중으로 나가지 않도록, Custom SMTP 설정 후 기본 SMTP는 disable 확인.
- 새 이메일 함수는 `lib/email/send.ts`의 `sendEmail` 래퍼 + `tag` 분류 패턴 따를 것.

---

## 디자인 원칙 (요약 — 자세한 건 DESIGN.md)

1. 에디토리얼 단문 헤드라인 (마침표)
2. 큰 호흡 (section padding, column gap 넉넉히)
3. 콘텐츠가 곧 비주얼 (블롭·글로우·그라디언트 금지)
4. 신뢰는 디자인으로 (Trust strip, Security 섹션)
5. CTA 단계적 노출

**컬러**: `--brand: #2563EB` 단일 + 중립 그레이. 보라·시안·인디고 금지 (DESIGN.md 3장).

---

## 변경 이력

- **2026-05-27 (security-guidance 플러그인 셋업)** — Anthropic 공식 마켓플레이스의 `security-guidance@claude-plugins-official` 활성화 + Kontaxt 맞춤 보안 가이드·패턴 작성
  - 발단: Claude dev 가 X 에서 출시 발표. 코드 작성 중 자동 보안 검토 (편집당 패턴 매칭 무료 + 턴 끝 모델 diff 검토 + Claude 의 git commit/push 시 agent 검토)
  - 셋업: `.claude/settings.json` 에 `enabledPlugins` 등록 (저장소 clone 모든 협업자 + Claude Code on the web 세션에도 적용). 사용자 슬래시 명령 `/plugin install security-guidance@claude-plugins-official` + `/reload-plugins` 로 활성
  - 맞춤 규칙: `.claude/claude-security-guidance.md` (6.9KB / 8KB 상한) — RLS·멀티테넌트, client storage 격리, OAuth state cookie, Supabase captcha, 파일 파서, PII, fontkit 등 Kontaxt 도메인 14개 위협 클래스. CLAUDE.md 알려진 함정·과거 사고 PR 그대로 인용
  - `.claude/security-patterns.json` (8KB / 50개 상한 22개 사용) — `NEXT_PUBLIC_*SECRET`, `createServiceClient` 무필터, `sameSite=strict`, `localStorage.setItem('단일키'...)`, `dangerouslySetInnerHTML`, RRN 정규식 등. **JSON 사용 이유**: 시스템 python3 (3.9.6) 에 PyYAML 부재. JSON 은 의존성 0
  - 비용: 패턴 매칭 무료, 모델 검토는 기본 Opus 4.7 사용량 청구 (시간당 commit 검토 20개 제한). `SECURITY_REVIEW_MODEL` / `SG_AGENTIC_MODEL` env 로 모델 교체 가능
  - 제한: 어떤 계층도 쓰기·커밋을 차단하지 않음. 심층 방어의 한 계층. PR 시점 `/security-review` + `engineering:code-review` 와 계층화
- **2026-05-26 (gbrain + graphify 통합 활용)** — gbrain CLI 설치 + PGLite engine + Claude MCP 등록 + markdown 29개 인덱싱 + 탐색 섹션 재작성
  - 발단: graphify 1주 체크포인트 (D-4) 평가 — 5/23~5/26 실제 사용 1회만, [[feedback_tooling_preference]] 패턴 적중. gbrain 미설치 상태로 "중복" 우려한 전제도 잘못 — 둘 다 안 쓰던 상황
  - 사용자 결정: 두 도구 모두 적극 활용 세팅. `brew install bun` 대신 공식 install script → `gstack-gbrain-install` (v0.18.2) → `gbrain init --pglite` → `claude mcp add --scope user gbrain` 등록 → markdown 29개 인덱싱 (469 chunks)
  - 역할 분리 명시: **graphify = 코드** (AST, 무료, symbol-aware) / **gbrain = 문서·노트** (CLAUDE/VOICE/DESIGN/audit/business-plan markdown). 중복 아님
  - 제약: OpenAI/Voyage API key 없어 embedding 0개. **keyword search (tsvector) 동작 ✅** / semantic vector search 보류. key 추가 시 활성
  - 다음 세션부터 `mcp__gbrain__*` 도구 자동 사용 가능 (MCP는 세션 시작 시 로드)
- **2026-05-25 (Tier 3 톤 mix 전환)** — VOICE.md 광범위 재작성 + 카피 15+ 파일 친밀 톤 전환
  - 발단: `/humanizer /insights` 분석에서 토스·카카오뱅크 reference 대비 "soulless AI 톤" 인식 가능 발견 (sterile, voiceless writing — humanizer PERSONALITY AND SOUL 절). 광고 puffing 만 잡고 인간미 부재 사각지대 인지.
  - VOICE.md Q2 (a) 격식 통일 → **(c) 컨텍스트별 mix** / Q3 (d) 사용 금지 → **(e) "당신" 금지 + 사용자 1인칭 "내·나의" 허용**. §0·§1·§2·§3·§10·§11·§12·§13·§14 광범위 재작성 (562 → 658 줄).
  - 카피 fix: Hero "내 가상자산 양도세, 한 번에 정리해요." / Security "내 데이터는 어떻게 보호돼요?" / Problem·HowItWorks·Example·Exchanges·Features·Pricing·Roadmap·CTA·Footer·Guide·Sample·Email 전반 친밀 톤 (해요체)
  - 격식 유지: Security 카드 body · Footer 법적 disclaimer · Email H1 · Legal (Q6)
  - DESIGN.md §9 갱신, CLAUDE.md 작업 패턴 5) 갱신
- **2026-05-25 (humanizer 통합)** — [blader/humanizer](https://github.com/blader/humanizer) Claude Code 스킬 vendor + VOICE.md §9 한국어 통합 + grep 3종 보강
  - `.claude/skills/humanizer/` project-local vendor (4 파일, .git 제거). 호출 `/humanizer` — Wikipedia "Signs of AI writing" 기반 29 패턴
  - VOICE.md §9: 12 → 28 패턴 (9-A Kontaxt 한국어 특화 12 + 9-B humanizer 통합 16). 영어 위주 13 패턴(title case·hyphenated word pairs·curly quotes 등) 제외, 한국어 적용 가능 16 패턴을 한국어 Before/After 예시로 재작성
  - §12 grep 3종 보강 — Soft·Hard·AI 각각에 humanizer 신규 키워드 추가 (역사적 전환점/기념비적/자리잡고 있/도움이 되셨길/본질적으로/단순한 X가 아니라 등)
  - 작업 패턴 5) 업데이트 — 한국어 카피 → `brand-voice:enforce-voice`, 영문 카피 → `/humanizer` 라우팅 명시
- **2026-05-25** — 브랜드 보이스 가이드 분리 + 작업 패턴 5번 추가
  - 신규 `VOICE.md` 562줄 — 페르소나·종결어·문장 길이·한·영 혼용·구두점·숫자·금지어 사전·AI 12가지 언어 안티패턴·28개 컨텍스트 톤 매트릭스·We Are/We Are Not·작성 체크리스트·9개 정책 결정 (Q1~Q9)
  - 미러: `.claude/brand-voice-guidelines.md` (brand-voice 스킬 자동 발견 경로)
  - `DESIGN.md` §9 17줄 → 핵심 5개 + VOICE.md 링크로 축약
  - 작업 패턴 5) "사용자-노출 카피 작성·수정 — VOICE.md 강제 통과" 신설 — grep 3종 + brand-voice:enforce-voice 스킬 호출 패턴
  - 핵심 문서 섹션에 VOICE.md 추가
  - 카피 톤 규칙(이메일) VOICE.md 참조로 정합
  - drift fix 완료: [PR #57](https://github.com/Delta-KR/kontaxt/pull/57) (`f93e456`)
- **2026-05-23** — Working memory 현행화
  - 도메인 sync (`kontaxt.app` → `kontaxt.kr`)
  - graphify 사용 가이드 상단으로 이동·강조
  - 신규 섹션: 작업 패턴 (작은 PR 사이클·subagent 병렬·메시지 변수·Supabase MCP)
  - 신규 섹션: 알려진 함정 (이메일 로고 / Supabase captcha / Free tier / 안내 반복 / client 데이터 격리)
  - 이메일 로고 정착 반영 (단일 brand blue PNG)
- **2026-05-19** — 트랜잭셔널 이메일 3종 (verify-email / reset-password / welcome) 추가
  - React Email 컴포넌트 + Supabase Custom SMTP via Resend 아키텍처
  - 한국어+영어 병기, DESIGN.md 토큰 그대로 적용
  - 빌드 스크립트 `scripts/build-emails.ts` 추가
