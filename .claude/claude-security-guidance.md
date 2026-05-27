# Kontaxt 보안 검토 지침

이 저장소는 한국 가상자산 양도소득세 정산 SaaS입니다. 사용자가 거래소 (Upbit, Bithumb, Binance) CSV/PDF/XLS 파일을 업로드하면 FIFO·이동평균·의제취득가액 규칙으로 세금을 계산합니다. 백엔드는 Next.js App Router + Supabase (Auth, Postgres, RLS) + Resend SMTP.

검토자는 다음 클래스를 우선해서 본다.

## 1. Supabase RLS / 멀티테넌트 격리

- **모든 Supabase 쿼리는 user-scoped 가 강제돼야 한다.** server action·API route·edge function 어디서든 RLS 가 켜진 테이블을 `service_role` 키로 우회해 읽는다면 명시적 `eq('user_id', userId)` 필터가 들어가 있어야 한다. service role + user_id 필터 누락 = cross-tenant 누출.
- `createServiceClient()` / `SUPABASE_SERVICE_ROLE_KEY` 사용처에서 반드시 직전에 인증된 user id 를 검증하고 그 id 로 필터링한다. 인증 없이 service role 호출은 admin 작업에만 허용.
- Postgres function (RPC) 호출도 동일. `auth.uid()` 가 함수 본문에서 비교에 쓰이는지 확인.
- 새 마이그레이션이 `enable row level security` 와 정책을 함께 추가하지 않으면 결함.

## 2. Client-side 데이터 격리 (다중 계정 함정)

CLAUDE.md 에 명시된 반복 함정. localStorage / sessionStorage / IndexedDB / non-HttpOnly cookie 에 user 데이터 저장 시 **반드시 user_id 가 키에 포함**돼야 한다. 단일 키 (`kontaxt:lastUpload` 같은 패턴) 는 같은 브라우저에서 A → B 계정 전환 시 누출 = 보안 결함. 로그아웃 핸들러가 user 별 키를 모두 지우는지도 확인.

## 3. OAuth state / cookie 보안

- Naver / Kakao OAuth state cookie 는 `sameSite=lax` 가 정답. `strict` 는 cross-site Naver callback 에서 끊겨 5/23~5/26 broken 사례 있음 ([[reference_naver_oauth_state_cookie]]).
- state cookie 는 `httpOnly` + `secure` (prod) + 짧은 만료 (5분 내).
- callback 에서 state 검증 누락 = CSRF.
- redirect_uri 가 attacker-controlled 호스트로 빠질 수 있는지 확인 (open redirect).
- Naver 토큰 revoke 누락 (회원탈퇴 시) — 보안보다 UX 이슈지만 follow-up 으로 표시 ([[project_naver_auto_relogin_followup]]).

## 4. Auth 액션 — Supabase captcha 대응

CLAUDE.md 알려진 함정. captcha ON 상태에서 server action 으로 `signInWithPassword` 호출 시 `captchaToken` 누락하면 400 reject. 에러를 "비밀번호 불일치" 로 매핑하면 무한 재시도 위험. `reauthError.message` 에 `captcha` 포함 여부로 분기해야 한다. password 시도 횟수 제한도 확인.

## 5. 파일 업로드 (CSV / PDF / XLS 파서)

- 사용자 업로드 파일은 신뢰 0. 파일명을 그대로 디스크 경로 / DB 컬럼에 쓰면 path traversal·SQL 위험.
- 사이즈 상한 (메모리 OOM) 과 row 수 상한 (서비스 abuse) 확인.
- XLS 파서가 `eval` / formula 평가를 활성화하지 않는지 (외부 reference, DDE 주입). PDF 는 외부 폰트·이미지 fetch off.
- CSV 인코딩 자동 감지 시 EUC-KR / UTF-16 모두 안전하게 — heap 폭발 사례 주의.
- archive (ZIP) 업로드면 ZIP bomb 방어 (압축비 상한).

## 6. 세금 계산 입력 검증

`lib/engine/` 의 계산기는 financial. 사용자 입력으로 `Number(value)` 한 결과를 그대로 계산식에 넣으면 `NaN` / `Infinity` 가 전파돼 잘못된 세액이 나온다. 거래 정렬·코인 정규화 단계에서 timestamp · symbol 정규화 검증. precision: 원·KRW 는 정수 round, 가상자산 amount 는 decimal 라이브러리 (`Number` 부동소수 누적 금지).

## 7. PII / 민감정보 로깅

- 거래 내역, 지갑 주소, 사용자 이메일, 거래소 API key 는 **로그에 평문 출력 금지**.
- Sentry / Datadog / `console.log` 에 request body 통째로 흘리는 패턴 위험.
- Supabase audit 로그에 PII 가 들어가도 위험. 로그 표시는 마지막 4자리 마스킹.
- 주민번호는 처리·저장·로그 모두 금지 (현재 받지 않지만 회원가입 폼·문의 등에서 우발 입력 가능 → 정규식 마스킹).

## 8. 시크릿 / 환경변수 노출

- `NEXT_PUBLIC_*` 접두어가 붙은 변수에 service role key / SMTP password / API secret 이 들어가면 즉시 결함.
- `.env*` 파일이 커밋되거나 `git add -A` 패턴에 잡히는지.
- 클라이언트 번들에 `process.env.SUPABASE_SERVICE_ROLE_KEY` 가 string 으로 박혀 있으면 결함.
- Resend API key, Supabase service role, OAuth client secret 은 모두 server-only.

## 9. Rate limit / abuse 방어

- 업로드 / report 생성 / OAuth callback / 인증 메일 발송 엔드포인트는 모두 rate limit 가 있어야 한다.
- IP 기반 rate limit 만이면 IPv6 prefix 단위로도 묶어야 한다.
- `X-Forwarded-For` 헤더는 첫 번째 값을 신뢰하면 spoof 가능. 프록시 신뢰 경계 확인.
- 인증 메일 / 비밀번호 재설정 메일 발송은 email 단위 + IP 단위 dual limit.

## 10. Server actions / API routes — 인증 게이트

- `app/actions/*.ts` 모든 함수 첫 줄에 `getUser()` 같은 인증 확인이 있는지.
- public action 이라면 명시적으로 주석에 표시.
- mutation 액션에서 입력 zod schema 검증 누락 = injection 표면 확장.
- service role 사용처는 admin gate 동반 (`profile.role === 'admin'` 등) 필수.

## 11. 이메일 발송 — 토큰 / 매직링크

- 비밀번호 재설정 토큰은 단발성·짧은 만료 (1시간 이내)·DB 에서 사용 후 invalidate.
- 토큰을 URL fragment 가 아닌 query 로 받으면 referer 로 누출 가능. fragment 우선.
- 이메일 인증 후 자동 로그인 시 redirect 가 attacker-controlled 가 아닌지 (open redirect).
- Welcome 메일은 인증 콜백에서 자체 트리거 — 인증 안 된 이메일로 발송되지 않게.

## 12. fontkit / PDF 생성

`/api/report` 의 fontkit + Node 24 호환성 사고 ([[project_api_report_incident_2026_05_26]]). 새 폰트 추가 시 woff2 대신 ttf 경로로. 사용자 입력이 PDF 텍스트에 들어가는 경로면 PDF injection (필드명·메타 escape) 확인.

## 13. SSRF / 외부 HTTP

- 환율 / 거래소 가격 fetch 시 URL 가 사용자 입력에서 파생되면 SSRF. allowlist 필수.
- redirect 따라가는 fetch 는 사내망 (`169.254.169.254`, `localhost`, `10.0.0.0/8`) 차단.
- timeout / max body size 설정 없으면 slowloris·메모리 폭발.

## 14. 검토자 출력 규칙

- 발견 사항은 파일:라인 + 한 줄 영향 + 한 줄 수정 제안으로 짧게.
- "강력하고", "정확하며", "신뢰할 수 있는" 같은 puffing 단어 금지 (VOICE.md §8).
- 추측이면 추측이라고 명시. 거짓 양성 줄이는 게 우선.
- 같은 클래스 결함이 여러 파일에서 반복되면 묶어서 한 번에 보고.
