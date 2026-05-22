import * as React from 'react';
import { Text } from '@react-email/components';
import { Fragment } from 'react';
import {
  EmailCtaButton,
  EmailExpiry,
  EmailHeader,
  EmailLayout,
} from './components/EmailLayout';
import { colors } from './components/tokens';

export interface VerifyEmailProps {
  /** Supabase Custom SMTP에선 `{{ .ConfirmationURL }}` 그대로 들어감.
   * Resend SDK 직접 호출(대안 1) 시 실제 URL. */
  confirmUrl?: string;
  /** 수신자 이메일 (Supabase 변수면 `{{ .Email }}`). */
  email?: string;
  /** 만료 분. 기본 60분. */
  expiresInMinutes?: number;
}

export default function VerifyEmail({
  confirmUrl = '{{ .ConfirmationURL }}',
  email = '{{ .Email }}',
  expiresInMinutes = 60,
}: VerifyEmailProps = {}) {
  return (
    <EmailLayout preview="이메일 주소를 확인해 주세요. 60분 안에 인증해주세요.">
      <EmailHeader
        eyebrow="Email Verification"
        title="이메일 주소를 확인해 주세요."
        subtitleEn="Please verify your email."
      />

      <Text
        className="ink-2"
        style={{
          margin: '32px 0 0 0',
          fontSize: '15px',
          lineHeight: 1.7,
          color: colors.ink2,
        }}
      >
        Kontaxt 가입을 시작하셨습니다.
      </Text>
      <Text
        className="ink-2"
        style={{
          margin: '8px 0 0 0',
          fontSize: '15px',
          lineHeight: 1.7,
          color: colors.ink2,
        }}
      >
        아래 버튼을 눌러{' '}
        <span className="email-var ink">{email}</span>{' '}
        주소가 본인 것인지 확인해 주세요.
      </Text>

      <EmailCtaButton href={confirmUrl} label="이메일 인증하기" />

      <EmailExpiry minutes={expiresInMinutes} fallbackHref={confirmUrl} />
    </EmailLayout>
  );
}

// Plain-text 버전 — Resend send 시 동봉 (스팸 점수 감소).
export const verifyEmailPlainText = ({
  confirmUrl = '{{ .ConfirmationURL }}',
  email = '{{ .Email }}',
  expiresInMinutes = 60,
}: VerifyEmailProps = {}): string => `이메일 주소를 확인해 주세요.
Please verify your email.

Kontaxt 가입을 시작하셨습니다.
아래 링크를 눌러 ${email} 주소가 본인 것인지 확인해 주세요.

${confirmUrl}

이 링크는 ${expiresInMinutes}분 후 만료됩니다.

—
Kontaxt · 가상자산 양도세 정산 · 발신 전용
support@kontaxt.kr
`;
