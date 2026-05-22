# Supabase + Resend 연동 예시

`lib/email/send.ts`에서 노출하는 함수를 어떻게 호출하는지 정리.

## 메인 패턴 — Supabase Custom SMTP via Resend

**Supabase가 verify/reset을 SMTP로 직접 발송. 우리 코드는 welcome 메일만 트리거**.

설정 단계는 `emails/README.md` 참고. 여기서는 **welcome 메일 트리거**만 다룬다.

### Welcome 메일 — 인증 완료 콜백에서

```ts
// app/auth/callback/route.ts
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendWelcomeEmail } from '@/lib/email/send';
import { daysUntil } from '@/lib/util/date';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error`);
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/auth/error`);
  }

  // 첫 인증 성공일 때만 환영 메일 발송
  // (created_at == last_sign_in_at 비교 — 최초 로그인 감지)
  const isFirstSignIn =
    data.user.created_at === data.user.last_sign_in_at;

  if (isFirstSignIn) {
    // fire-and-forget — 환영 메일 실패가 로그인을 막으면 안 됨
    sendWelcomeEmail({
      to: data.user.email!,
      userName: data.user.user_metadata?.full_name,
      dashboardUrl: `${origin}/dashboard`,
      daysUntilLaw: daysUntil('2027-01-01'),
    }).catch((err) => {
      console.error('Welcome email failed:', err);
    });
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
```

> Verify/reset 메일은 Supabase가 Resend SMTP로 보낸다 — 우리 코드에서 호출하지 않는다.
> Supabase Dashboard → Auth → Email Templates 에 빌드된 HTML이 들어가 있어야 함.

---

## 대안 1 — admin.generateLink + Resend SDK (현재 미사용)

모든 발송을 우리 코드에서 통제하고 싶을 때. Custom SMTP 대신 사용. `send.ts` 의 `sendVerifyEmail`/`sendResetPasswordEmail` 가 이 패턴용.

### 1-1. 이메일 인증

```ts
// app/actions/auth.ts
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { sendVerifyEmail } from '@/lib/email/send';

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = createServerClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });
  if (error) return { error: error.message };

  // admin.generateLink로 토큰 받아서 우리 메일에 첨부
  const { data: linkData, error: linkError } =
    await supabase.auth.admin.generateLink({
      type: 'signup',
      email,
      password,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
      },
    });
  if (linkError || !linkData?.properties?.action_link) {
    return { error: linkError?.message ?? '인증 링크 생성 실패' };
  }

  await sendVerifyEmail({
    to: email,
    confirmUrl: linkData.properties.action_link,
    expiresInMinutes: 60,
    email,
  });

  return { ok: true };
}
```

> **주의**: Custom SMTP를 켜둔 상태에서 이 패턴을 추가로 쓰면 사용자가 메일을 두 번 받는다. 대안 1을 쓰려면 Custom SMTP는 OFF, 또는 Supabase Auth → Email Templates 를 비워둘 것.

### 1-2. 비밀번호 재설정

```ts
// app/actions/auth.ts
'use server';

import { headers } from 'next/headers';
import { createServerClient } from '@/lib/supabase/server';
import { sendResetPasswordEmail } from '@/lib/email/send';

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string;
  const supabase = createServerClient();

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    },
  });

  if (error || !data?.properties?.action_link) {
    // 보안상 항상 성공 응답 — 이메일 존재 여부 노출 금지
    return { ok: true };
  }

  const ip =
    headers().get('x-forwarded-for')?.split(',')[0] ??
    headers().get('x-real-ip') ??
    undefined;

  await sendResetPasswordEmail({
    to: email,
    resetUrl: data.properties.action_link,
    expiresInMinutes: 30,
    requestedFromIp: ip,
  });

  return { ok: true };
}
```

---

## 대안 2 — Supabase Auth Email Hook (Pro 플랜 전용)

Pro 플랜에서 Auth Hook 활성화. Supabase가 메일 보내려고 할 때마다 우리 엔드포인트가 가로챔. **kontaxt는 현재 Free tier라 사용 불가** ([[reference-supabase-plan-limits]]).

```ts
// app/api/auth/email-hook/route.ts (예시 — 미사용)
import { NextResponse } from 'next/server';
import { Webhook } from 'standardwebhooks';
import { sendVerifyEmail, sendResetPasswordEmail } from '@/lib/email/send';

const hookSecret = process.env.SUPABASE_AUTH_HOOK_SECRET!;

export async function POST(req: Request) {
  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);

  const wh = new Webhook(hookSecret);
  const event = wh.verify(payload, headers) as {
    user: { email: string };
    email_data: {
      token: string;
      token_hash: string;
      redirect_to: string;
      email_action_type: 'signup' | 'recovery' | 'magiclink' | 'invite' | 'email_change';
      site_url: string;
    };
  };

  const { user, email_data } = event;
  const link = `${email_data.site_url}/auth/confirm?token_hash=${email_data.token_hash}&type=${email_data.email_action_type}&redirect_to=${email_data.redirect_to}`;

  switch (email_data.email_action_type) {
    case 'signup':
      await sendVerifyEmail({ to: user.email, confirmUrl: link, email: user.email });
      break;
    case 'recovery':
      await sendResetPasswordEmail({ to: user.email, resetUrl: link });
      break;
  }

  return NextResponse.json({ ok: true });
}
```

---

## 패턴 비교 요약

| 항목 | 메인: Custom SMTP | 대안 1: admin.generateLink | 대안 2: Auth Hook |
|------|------------------|--------------------------|------------------|
| 플랜 요구 | Free | Free | **Pro 필요** |
| 발송 호출처 | Supabase (자동) | 우리 server action | 우리 API route |
| 우리 코드 양 | Welcome만 | verify + reset + welcome 전부 | verify + reset + welcome 전부 |
| 디버깅 통일 | 두 곳 (Supabase + Welcome) | 한 곳 | 두 단계 (Supabase → Hook) |
| 도착률 | Resend SMTP | Resend API | Resend API |
| 적합도 | Phase 7 출시 빠름 (권장) | 모든 발송 통제 필요할 때 | 트래픽 커지면 |
