import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailButton } from './components/EmailButton';
import { BilingualHeading, BilingualText } from './components/BilingualBlock';
import { colors, type } from './components/tokens';

export interface ResetPasswordEmailProps {
  /** 재설정 링크 — Supabase ConfirmationURL 또는 자체 생성 토큰 URL.
   *  Supabase 템플릿 빌드 시 비워두면 {{ .ConfirmationURL }} 자동 주입. */
  resetUrl?: string;
  /** 만료 시간 (분 단위, 기본 30분 — 인증 메일보다 짧게) */
  expiresInMinutes?: number;
  /** 요청자 IP / 접속 위치 — 보안 알림 (선택, 있으면 표시) */
  requestedFromIp?: string;
  requestedFromLocation?: string;
}

/**
 * 비밀번호 재설정
 *
 * 사용 시점: resetPasswordForEmail() 직후
 * 핵심 메시지: 본인이 아니라면 즉시 알려라 — 다른 보안 조치를 안내
 *
 * 인증 메일보다 더 강한 보안 톤. 단, 위협적이지 않게 차분히.
 */
/**
 * 기본값은 Supabase Auth Email Template 변수.
 * - {{ .ConfirmationURL }} : Supabase가 발급한 재설정 링크
 */
export default function ResetPasswordEmail({
  resetUrl = '{{ .ConfirmationURL }}',
  expiresInMinutes = 30,
  requestedFromIp,
  requestedFromLocation,
}: ResetPasswordEmailProps) {
  return (
    <EmailLayout preview="비밀번호 재설정 링크를 보내드립니다.">
      {/* Eyebrow */}
      <Text
        style={{
          ...type.eyebrow,
          margin: 0,
          marginBottom: '12px',
        }}
      >
        PASSWORD RESET
      </Text>

      {/* Heading */}
      <BilingualHeading
        ko="비밀번호 재설정 요청을 받았습니다."
        en="We received a password reset request."
      />

      {/* Body */}
      <Section style={{ marginTop: '24px' }}>
        <BilingualText
          ko="아래 버튼을 눌러 새 비밀번호를 설정해 주세요. 본인이 요청한 게 맞다면 이 한 단계로 끝납니다."
          en="Click the button below to set a new password. If you requested this, you're one step away."
          marginBottom="24px"
        />
      </Section>

      {/* CTA */}
      <Section style={{ marginTop: '8px', marginBottom: '24px' }}>
        <EmailButton href={resetUrl}>비밀번호 재설정 · Reset password</EmailButton>
      </Section>

      {/* Link fallback */}
      <Section style={{ marginTop: '24px' }}>
        <Text
          style={{
            ...type.small,
            color: colors.muted,
            margin: 0,
          }}
        >
          버튼이 작동하지 않으면 아래 주소를 브라우저에 직접 붙여넣어 주세요.
        </Text>
        <Text
          style={{
            ...type.small,
            color: colors.muted2,
            margin: '2px 0 0 0',
            fontSize: '11px',
          }}
        >
          If the button doesn&apos;t work, paste this URL into your browser.
        </Text>
        <Text
          style={{
            fontSize: '12px',
            lineHeight: 1.5,
            color: colors.brand,
            margin: '8px 0 0 0',
            wordBreak: 'break-all',
          }}
        >
          <Link
            href={resetUrl}
            style={{ color: colors.brand, textDecoration: 'underline' }}
          >
            {resetUrl}
          </Link>
        </Text>
      </Section>

      {/* Request metadata (선택) */}
      {(requestedFromIp || requestedFromLocation) && (
        <Section
          style={{
            marginTop: '24px',
            backgroundColor: colors.bgTint,
            border: `1px solid ${colors.line2}`,
            borderRadius: '10px',
            padding: '14px 16px',
          }}
        >
          <Text
            style={{
              ...type.eyebrow,
              color: colors.muted,
              margin: 0,
              marginBottom: '6px',
              fontSize: '10px',
              letterSpacing: '0.14em',
            }}
          >
            요청 정보 · REQUEST DETAILS
          </Text>
          {requestedFromIp && (
            <Text
              style={{
                fontSize: '13px',
                lineHeight: 1.5,
                color: colors.ink2,
                margin: 0,
              }}
            >
              IP: {requestedFromIp}
            </Text>
          )}
          {requestedFromLocation && (
            <Text
              style={{
                fontSize: '13px',
                lineHeight: 1.5,
                color: colors.ink2,
                margin: 0,
              }}
            >
              위치 · Location: {requestedFromLocation}
            </Text>
          )}
        </Section>
      )}

      {/* Divider */}
      <Section
        style={{
          marginTop: '28px',
          marginBottom: '20px',
          borderTop: `1px solid ${colors.line2}`,
        }}
      />

      {/* Security warning — 비밀번호 재설정은 보안 강조가 핵심 */}
      <Section>
        <Text
          style={{
            ...type.eyebrow,
            color: colors.bad,
            margin: 0,
            marginBottom: '8px',
            fontSize: '10px',
            letterSpacing: '0.14em',
          }}
        >
          본인이 요청하지 않았다면 · NOT YOU?
        </Text>
        <BilingualText
          ko="이 요청을 본인이 한 게 아니라면 비밀번호를 변경하지 마시고, 이 메일을 무시해 주세요. 현재 비밀번호는 그대로 유효합니다."
          en="If you didn't request this, ignore this email — your current password stays unchanged."
          marginBottom="12px"
        />
        <BilingualText
          ko="다만 같은 요청이 반복되거나 모르는 기기에서 로그인이 의심된다면, 비밀번호를 즉시 변경하고 support@kontaxt.app으로 알려주세요."
          en="If these requests keep happening or you suspect access from an unknown device, change your password right away and email support@kontaxt.app."
          marginBottom="16px"
        />
        <Text
          style={{
            ...type.small,
            color: colors.muted2,
            margin: 0,
            fontSize: '11px',
          }}
        >
          이 링크는 {expiresInMinutes}분 후 만료됩니다. · This link expires in{' '}
          {expiresInMinutes} minutes.
        </Text>
      </Section>
    </EmailLayout>
  );
}

export const resetPasswordPlainText = (props: ResetPasswordEmailProps) => `
Kontaxt — 비밀번호 재설정
PASSWORD RESET

비밀번호 재설정 요청을 받았습니다.
We received a password reset request.

아래 링크를 눌러 새 비밀번호를 설정해 주세요.
Open the link below to set a new password.

${props.resetUrl}

이 링크는 ${props.expiresInMinutes ?? 30}분 후 만료됩니다.
This link expires in ${props.expiresInMinutes ?? 30} minutes.

본인이 요청하지 않았다면 이 메일을 무시해 주세요. 현재 비밀번호는
그대로 유효합니다.

If you didn't request this, ignore this email. Your password stays the same.

—
Kontaxt · 가상자산 양도세 정산
support@kontaxt.app
`.trim();
