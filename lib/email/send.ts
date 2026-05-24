/**
 * Resend 발송 헬퍼.
 *
 * 각 함수는:
 *   1) React Email 컴포넌트를 HTML로 렌더링
 *   2) Plain text 버전과 함께 Resend API 호출
 *   3) 실패하면 throw — 호출부에서 try/catch로 핸들
 *
 * Server-only. Client에서 import 금지.
 *
 * 현재 사용 상태 (메인 패턴: Custom SMTP via Resend):
 *   - sendWelcomeEmail        : 메인 사용. app/auth/callback 에서 fire-and-forget.
 *   - sendVerifyEmail         : dormant. Supabase Custom SMTP가 발송하므로 미호출.
 *   - sendResetPasswordEmail  : dormant. 위와 동일.
 *
 * dormant 함수는 대안 1 (admin.generateLink) 전환 시를 위해 보존.
 * 자세한 내용은 lib/email/integration-examples.md 참고.
 */

import { Resend } from 'resend';
import { render } from '@react-email/render';

import { SUPPORT_EMAIL } from './contact';
import VerifyEmail, {
  verifyEmailPlainText,
  type VerifyEmailProps,
} from '@/emails/verify-email';
import ResetPasswordEmail, {
  resetPasswordPlainText,
  type ResetPasswordEmailProps,
} from '@/emails/reset-password';
import WelcomeEmail, {
  welcomePlainText,
  type WelcomeEmailProps,
} from '@/emails/welcome';

// ---------------------------------------------------------------------------
// Resend 클라이언트 — lazy init으로 API 키가 없을 때 dev 환경도 죽지 않도록
// ---------------------------------------------------------------------------

let _resend: Resend | null = null;

function getResend(): Resend {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      'RESEND_API_KEY is not set. Add it to .env.local before sending email.',
    );
  }
  _resend = new Resend(key);
  return _resend;
}

const FROM =
  process.env.RESEND_FROM_EMAIL ?? 'Kontaxt <noreply@kontaxt.kr>';
const REPLY_TO = SUPPORT_EMAIL;

// ---------------------------------------------------------------------------
// 공통 발송 래퍼
// ---------------------------------------------------------------------------

interface SendArgs {
  to: string;
  subject: string;
  react: React.ReactElement;
  plainText: string;
  /** 메일 그룹화용 헤더 — Gmail 등에서 같은 종류 묶을 때 사용 */
  tag?: string;
}

async function sendEmail({ to, subject, react, plainText, tag }: SendArgs) {
  const resend = getResend();
  const html = await render(react);

  const result = await resend.emails.send({
    from: FROM,
    to,
    replyTo: REPLY_TO,
    subject,
    html,
    text: plainText,
    tags: tag ? [{ name: 'category', value: tag }] : undefined,
  });

  if (result.error) {
    throw new Error(
      `Resend send failed (${tag ?? 'unknown'}): ${result.error.message}`,
    );
  }
  return result.data;
}

// ---------------------------------------------------------------------------
// 1. 이메일 인증
// ---------------------------------------------------------------------------

export async function sendVerifyEmail(
  args: VerifyEmailProps & { to: string },
) {
  return sendEmail({
    to: args.to,
    subject: 'Kontaxt — 이메일 주소를 확인해 주세요 · Verify your email',
    react: VerifyEmail(args),
    plainText: verifyEmailPlainText(args),
    tag: 'verify-email',
  });
}

// ---------------------------------------------------------------------------
// 2. 비밀번호 재설정
// ---------------------------------------------------------------------------

export async function sendResetPasswordEmail(
  args: ResetPasswordEmailProps & { to: string },
) {
  return sendEmail({
    to: args.to,
    subject: 'Kontaxt — 비밀번호 재설정 · Reset your password',
    react: ResetPasswordEmail(args),
    plainText: resetPasswordPlainText(args),
    tag: 'reset-password',
  });
}

// ---------------------------------------------------------------------------
// 3. 환영 메일
// ---------------------------------------------------------------------------

export async function sendWelcomeEmail(
  args: WelcomeEmailProps & { to: string },
) {
  return sendEmail({
    to: args.to,
    subject: 'Kontaxt에 오신 것을 환영합니다 · Welcome to Kontaxt',
    react: WelcomeEmail(args),
    plainText: welcomePlainText(args),
    tag: 'welcome',
  });
}
