import * as React from 'react';
import { Section, Text, Link } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailButton } from './components/EmailButton';
import { BilingualHeading, BilingualText } from './components/BilingualBlock';
import { colors, type } from './components/tokens';

export interface VerifyEmailProps {
  /** 인증 링크 — Supabase ConfirmationURL 또는 자체 생성 토큰 URL.
   *  Supabase 템플릿 빌드 시 비워두면 {{ .ConfirmationURL }} 자동 주입. */
  confirmUrl?: string;
  /** 만료 시간 (분 단위, 기본 60분) */
  expiresInMinutes?: number;
  /** 사용자가 제출한 이메일 — 본문 안내용 (선택) */
  email?: string;
}

/**
 * 이메일 인증 (회원가입)
 *
 * 사용 시점: signUp() 직후
 * 핵심 메시지: 이 한 단계를 끝내야 Kontaxt를 쓸 수 있다 — 단, 위협 톤이 아닌 차분한 안내
 */
/**
 * 기본값은 Supabase Auth Email Template 변수.
 * - {{ .ConfirmationURL }} : Supabase가 발급한 인증 링크
 * - {{ .Email }}            : 가입 이메일
 * Resend/별도 발송 패턴에서 사용할 땐 props로 덮어쓰면 됨.
 */
export default function VerifyEmail({
  confirmUrl = '{{ .ConfirmationURL }}',
  expiresInMinutes = 60,
  email = '{{ .Email }}',
}: VerifyEmailProps) {
  return (
    <EmailLayout preview="이메일 주소를 한 번만 확인해 주세요.">
      {/* Eyebrow */}
      <Text
        style={{
          ...type.eyebrow,
          margin: 0,
          marginBottom: '12px',
        }}
      >
        EMAIL VERIFICATION
      </Text>

      {/* Heading */}
      <BilingualHeading
        ko="이메일 주소를 확인해 주세요."
        en="Please verify your email."
      />

      {/* Body */}
      <Section style={{ marginTop: '24px' }}>
        <BilingualText
          ko={
            email
              ? `Kontaxt 가입을 시작하셨습니다. 아래 버튼을 눌러 ${email} 주소가 본인 것인지 확인해 주세요.`
              : `Kontaxt 가입을 시작하셨습니다. 아래 버튼을 눌러 이 이메일 주소가 본인 것인지 확인해 주세요.`
          }
          en={
            email
              ? `You started signing up for Kontaxt. Click the button below to confirm ${email} is yours.`
              : `You started signing up for Kontaxt. Click the button below to confirm this email is yours.`
          }
          marginBottom="24px"
        />
      </Section>

      {/* CTA */}
      <Section style={{ marginTop: '8px', marginBottom: '24px' }}>
        <EmailButton href={confirmUrl}>이메일 인증하기 · Verify email</EmailButton>
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
            href={confirmUrl}
            style={{ color: colors.brand, textDecoration: 'underline' }}
          >
            {confirmUrl}
          </Link>
        </Text>
      </Section>

      {/* Divider */}
      <Section
        style={{
          marginTop: '28px',
          marginBottom: '20px',
          borderTop: `1px solid ${colors.line2}`,
        }}
      />

      {/* Security note */}
      <Section>
        <Text
          style={{
            ...type.eyebrow,
            color: colors.muted,
            margin: 0,
            marginBottom: '8px',
            fontSize: '10px',
            letterSpacing: '0.14em',
          }}
        >
          보안 안내 · SECURITY NOTE
        </Text>
        <BilingualText
          ko={`이 링크는 ${expiresInMinutes}분 후 만료됩니다. 만료된 후 다시 인증이 필요하다면 가입 화면에서 인증 메일을 다시 받을 수 있습니다.`}
          en={`This link expires in ${expiresInMinutes} minutes. If it expires, request a new one from the signup screen.`}
          marginBottom="12px"
        />
        <BilingualText
          ko="본인이 Kontaxt에 가입한 적이 없다면 이 메일을 무시해 주세요. 누군가가 실수로 본인의 이메일 주소를 입력했을 가능성이 있습니다."
          en="If you didn't sign up for Kontaxt, you can safely ignore this email. Someone may have entered your address by mistake."
        />
      </Section>
    </EmailLayout>
  );
}

/**
 * Plain text 버전 — 스팸 점수 개선 + 텍스트 클라이언트 대응.
 * render() 호출 시 자동 생성도 가능하지만, 한국어가 깔끔하게 빠지지 않아 수동 작성.
 */
export const verifyEmailPlainText = (props: VerifyEmailProps) => `
Kontaxt — 이메일 인증
EMAIL VERIFICATION

이메일 주소를 확인해 주세요.
Please verify your email.

Kontaxt 가입을 시작하셨습니다. 아래 링크를 눌러 이 이메일 주소가
본인 것인지 확인해 주세요.

You started signing up for Kontaxt. Open the link below to confirm this
email is yours.

${props.confirmUrl}

이 링크는 ${props.expiresInMinutes ?? 60}분 후 만료됩니다.
This link expires in ${props.expiresInMinutes ?? 60} minutes.

본인이 가입한 적이 없다면 이 메일을 무시해 주세요.
If you didn't sign up, ignore this email.

—
Kontaxt · 가상자산 양도세 정산
support@kontaxt.kr
`.trim();
