# Kontaxt — 이메일 템플릿

Resend로 발송하는 트랜잭셔널 이메일. React Email 컴포넌트로 작성하고, 발송 시 `render()`로 HTML/Plain text 변환 후 Resend API에 전달.

---

## 설치

```bash
npm install @react-email/components @react-email/render resend
npm install -D react-email
```

`package.json` scripts에 추가 (미리보기용):

```json
{
  "scripts": {
    "email:dev": "email dev --dir emails --port 3001"
  }
}
```

`npm run email:dev` → http://localhost:3001 에서 실제 렌더링 확인.

---

## 디렉토리 구조

```
emails/
├── README.md                       # 이 문서
├── components/
│   ├── tokens.ts                   # 색상·폰트·간격 상수 (DESIGN.md 토큰을 인라인 hex로 변환)
│   ├── EmailLayout.tsx             # 헤더(로고) + 컨테이너 + 푸터
│   ├── EmailButton.tsx             # CTA 버튼 (Primary / Secondary)
│   └── BilingualBlock.tsx          # 한국어 + 영어 병기 블록
├── verify-email.tsx                # 이메일 인증 (회원가입)
├── reset-password.tsx              # 비밀번호 재설정
└── welcome.tsx                     # 환영 메일 (인증 완료 후)

lib/email/
├── send.ts                         # Resend 발송 헬퍼
└── render.ts                       # render() 래퍼 (HTML + Plain text 동시 생성)
```

---

## 환경변수

`.env.local`에 추가:

```bash
RESEND_API_KEY=re_xxx
RESEND_FROM_EMAIL="Kontaxt <noreply@kontaxt.kr>"   # 도메인 인증 필요
NEXT_PUBLIC_APP_URL=https://kontaxt.kr
```

Resend 대시보드에서 `kontaxt.kr` 도메인 인증 (SPF/DKIM/DMARC 레코드 추가) — 안 하면 스팸함 직행.

---

## Supabase 연동 — 메인: Custom SMTP via Resend

**메인 패턴 (Free tier 포함, 권장)**: Supabase가 Resend SMTP로 verify/reset을 발송하되, 우리 디자인의 HTML을 그대로 사용. Welcome 메일만 우리 코드에서 Resend SDK로 발송.

**적용 단계**:

1. `npm run email:build` — `emails/dist/{verify-email,reset-password,welcome}.{html,txt}` 생성
2. **Supabase Dashboard → Project Settings → Auth → SMTP Settings** — Resend SMTP 자격증명 입력:
   - Host: `smtp.resend.com`
   - Port: `465`
   - User: `resend`
   - Pass: Resend API key (`RESEND_API_KEY` 와 동일)
   - Sender email: `noreply@kontaxt.kr` (도메인 인증 필수)
3. **Supabase Dashboard → Auth → Email Templates** — 각 템플릿에 `dist/` 안의 HTML 붙여넣기:
   - "Confirm signup" ← `verify-email.html`
   - "Reset Password" ← `reset-password.html`
   - 변수 `{{ .ConfirmationURL }}` 가 그대로 살아있는지 확인 (빌드에서 보존됨)
4. **Welcome 메일** — Supabase 흐름 밖. `app/auth/callback/route.ts` 에서 `sendWelcomeEmail()` 호출 (fire-and-forget). `lib/email/integration-examples.md` 참고.

**대안 (현재 미사용)**:
- **대안 1: admin.generateLink + Resend SDK** — 모든 발송 우리 코드. `send.ts` 의 `sendVerifyEmail`/`sendResetPasswordEmail` 함수가 이 패턴용 (현재 dormant). [`integration-examples.md`](../lib/email/integration-examples.md) 1~3번 참고.
- **대안 2: Supabase Auth Email Hook** — Pro 플랜 필요. Supabase가 메일을 보내려고 할 때 우리 엔드포인트가 가로챔. [`integration-examples.md`](../lib/email/integration-examples.md) 4번 참고.

`send.ts` 함수: `sendWelcomeEmail` (메인 사용), `sendVerifyEmail`/`sendResetPasswordEmail` (대안 1용으로 보존).

---

## 디자인 원칙 (DESIGN.md 적용)

| 원칙 | 이메일에 적용한 방식 |
|------|----------------------|
| 에디토리얼 단문 헤드라인 | 모든 메일 H1은 마침표 있는 한 문장 |
| 큰 호흡 | 섹션 padding 24px, 컨테이너 max-width 560px |
| 콘텐츠가 곧 비주얼 | 그라디언트·블롭·이모지 0개. 텍스트와 1px border만 |
| 신뢰는 디자인으로 | 푸터에 PIPA / Cloudflare / RLS 보안 라인 |
| brand blue 단일 컬러 | `#2563EB` (`brand`)만 액센트. 그 외는 중립 그레이 |

### 이메일 클라이언트 호환성
- **CSS 변수 사용 안 함** — 모든 색상 인라인 hex
- **Pretendard는 폴백 필수** — `font-family`에 시스템 폰트 스택 포함
- **다크모드** — 이메일 클라이언트별로 다르게 처리. 우리는 라이트 기본, `@media (prefers-color-scheme: dark)`로 일부 톤 조정
- **레이아웃은 `<table>` 기반** — React Email 컴포넌트가 내부적으로 처리

---

## 한국어 + 영어 병기 정책

- 한국어를 시각적으로 우선 (큰 글씨 / 짙은 컬러)
- 영어는 한국어 바로 아래 한 단계 작은 글씨 + muted 컬러로 배치
- 본문/세부 안내는 한 블록으로 묶고 두 언어를 하나의 카드 안에 표시
- 영어 버전을 받고 싶은 사용자가 따로 있다면 추후 사용자 설정으로 분리 가능

---

## 발송 예시

```ts
// app/actions/auth.ts
import { sendVerifyEmail } from '@/lib/email/send';

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;

  // Supabase가 생성한 토큰으로 우리 디자인의 메일 발송
  await sendVerifyEmail({
    to: email,
    confirmUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth/confirm?token=${data.session?.access_token}`,
  });
}
```

---

## 변경 시 체크리스트

- [ ] `npm run email:dev`로 라이트/다크 모두 확인
- [ ] Gmail / Outlook / Apple Mail에서 실제 발송 테스트 (https://www.litmus.com 또는 Resend 자체 미리보기)
- [ ] 본문 텍스트가 화면 너비 좁아도 깨지지 않는지 (모바일)
- [ ] Plain text 버전이 비어있지 않은지 (스팸 점수 영향)
- [ ] DKIM/SPF/DMARC 통과 확인
