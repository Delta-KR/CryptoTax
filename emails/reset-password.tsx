import * as React from 'react';
import { Text } from '@react-email/components';
import {
  EmailCtaButton,
  EmailExpiry,
  EmailHeader,
  EmailLayout,
} from './components/EmailLayout';
import { colors } from './components/tokens';

export interface ResetPasswordEmailProps {
  /** Supabase Custom SMTP에선 `{{ .ConfirmationURL }}` 그대로 들어감. */
  resetUrl?: string;
  /** 만료 분. 기본 30분. */
  expiresInMinutes?: number;
  /** 요청 발신 IP (옵션) — 대안 1 패턴에서만 사용. Custom SMTP 패턴엔 무관. */
  requestedFromIp?: string;
  /** 수신자 이메일 (옵션). 메인 패턴에선 사용 안 함. */
  to?: string;
}

export default function ResetPasswordEmail({
  resetUrl = '{{ .ConfirmationURL }}',
  expiresInMinutes = 30,
}: ResetPasswordEmailProps = {}) {
  return (
    <EmailLayout preview="비밀번호 재설정 링크입니다. 30분 안에 새 비밀번호를 설정하세요.">
      <EmailHeader
        eyebrow="Password Reset"
        title="비밀번호를 재설정해 주세요."
        subtitleEn="Reset your password."
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
        아래 버튼을 눌러 새 비밀번호를 설정해 주세요.
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
        본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다. 현재 비밀번호는 그대로 유효합니다.
      </Text>

      <EmailCtaButton href={resetUrl} label="비밀번호 재설정" />

      <EmailExpiry minutes={expiresInMinutes} fallbackHref={resetUrl} />
    </EmailLayout>
  );
}

// Plain-text 버전.
export const resetPasswordPlainText = ({
  resetUrl = '{{ .ConfirmationURL }}',
  expiresInMinutes = 30,
}: ResetPasswordEmailProps = {}): string => `비밀번호를 재설정해 주세요.
Reset your password.

아래 링크를 눌러 새 비밀번호를 설정해 주세요.

${resetUrl}

본인이 요청하지 않았다면 이 메일을 무시하셔도 됩니다. 현재 비밀번호는 그대로 유효합니다.
이 링크는 ${expiresInMinutes}분 후 만료됩니다.

—
Kontaxt · 가상자산 양도세 정산 · 발신 전용
support@kontaxt.kr
`;
