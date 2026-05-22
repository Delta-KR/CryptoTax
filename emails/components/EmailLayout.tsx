import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';
import { colors, fontStack, spacing, type } from './tokens';

interface EmailLayoutProps {
  /** 받은편지함 미리보기 텍스트 (제목 옆 회색 문구) */
  preview: string;
  /** 라이트/다크 자동 처리는 클라이언트 의존. 기본은 라이트. */
  children: React.ReactNode;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://kontaxt.app';
const LOGO_URL = `${APP_URL}/logo.svg`;

/**
 * 모든 메일이 공유하는 레이아웃.
 * - 헤더: Kontaxt 로고만 (장식 없음)
 * - 컨테이너: 560px, white card
 * - 푸터: 보안 라인 + 회사 정보 + 수신 거부
 */
export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="ko">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: colors.bgSoft,
          fontFamily: fontStack,
          margin: 0,
          padding: 0,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
      >
        <Container
          style={{
            maxWidth: spacing.containerMaxWidth,
            margin: '0 auto',
            padding: '40px 20px',
          }}
        >
          {/* Header */}
          <Section style={{ paddingBottom: '24px' }}>
            <Link href={APP_URL} style={{ textDecoration: 'none' }}>
              <Img
                src={LOGO_URL}
                width="112"
                height="24"
                alt="Kontaxt"
                style={{ display: 'block', height: 'auto' }}
              />
            </Link>
          </Section>

          {/* Card */}
          <Section
            style={{
              backgroundColor: colors.card,
              border: `1px solid ${colors.line}`,
              borderRadius: '16px',
              padding: `${spacing.sectionPaddingY} ${spacing.sectionPaddingX}`,
            }}
          >
            {children}
          </Section>

          {/* Trust strip */}
          <Section style={{ paddingTop: '20px', paddingBottom: '12px' }}>
            <Text
              style={{
                ...type.small,
                color: colors.muted2,
                margin: 0,
                textAlign: 'center',
              }}
            >
              개인정보보호법(PIPA) 준수 · Cloudflare 보안 · 결제정보 비저장
            </Text>
            <Text
              style={{
                ...type.small,
                color: colors.muted2,
                margin: '4px 0 0 0',
                textAlign: 'center',
                fontSize: '11px',
              }}
            >
              PIPA compliant · Cloudflare security · No payment data stored
            </Text>
          </Section>

          <Hr
            style={{
              borderColor: colors.line2,
              margin: '16px 0',
            }}
          />

          {/* Footer */}
          <Section>
            <Text
              style={{
                ...type.small,
                color: colors.muted,
                margin: 0,
                textAlign: 'center',
              }}
            >
              <strong style={{ color: colors.ink2 }}>Kontaxt</strong> · 가상자산 양도세 정산
            </Text>
            <Text
              style={{
                ...type.small,
                color: colors.muted2,
                margin: '6px 0 0 0',
                textAlign: 'center',
                fontSize: '11px',
              }}
            >
              본 메일은 발신 전용입니다. 문의는{' '}
              <Link
                href={`mailto:support@kontaxt.app`}
                style={{ color: colors.brand, textDecoration: 'none' }}
              >
                support@kontaxt.app
              </Link>
            </Text>
            <Text
              style={{
                ...type.small,
                color: colors.muted2,
                margin: '4px 0 0 0',
                textAlign: 'center',
                fontSize: '11px',
              }}
            >
              This is a send-only address. Contact{' '}
              <Link
                href={`mailto:support@kontaxt.app`}
                style={{ color: colors.brand, textDecoration: 'none' }}
              >
                support@kontaxt.app
              </Link>{' '}
              for inquiries.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
