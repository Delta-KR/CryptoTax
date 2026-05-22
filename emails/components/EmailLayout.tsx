/* eslint-disable react/no-unknown-property */
import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { Fragment, type ReactNode } from 'react';
import { colors, fontStack, layout } from './tokens';
import {
  KONTAXT_LOGO_LIGHT_URL,
  KONTAXT_LOGO_DARK_URL,
  KONTAXT_LOGO_HEIGHT,
  KONTAXT_LOGO_WIDTH,
} from './kontaxt-logo';

export interface EmailLayoutProps {
  preview: string;
  children: ReactNode;
}

// CSS — color-scheme, prefers-color-scheme 다크모드, 한국어 줄바꿈,
// 모바일 풀-너비 CTA. inline으론 처리 불가하므로 <Head> 안에 <style>로.
const headStyles = `
  body, table, td, a, p { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
  a { text-decoration: none; }

  /* 한국어 줄바꿈: 음절 분리 금지 */
  p, a, span, td {
    word-break: keep-all;
    overflow-wrap: break-word;
    -webkit-hyphens: none;
    hyphens: none;
  }

  body { background-color: ${colors.bg}; }
  .page-bg { background-color: ${colors.bg}; }
  .card { background-color: ${colors.cardBg}; border: 1px solid ${colors.cardBorder}; }
  .ink { color: ${colors.ink}; }
  .ink-2 { color: ${colors.ink2}; }
  .muted { color: ${colors.muted}; }
  .muted-2 { color: ${colors.muted2}; }
  .fallback-link { color: ${colors.brand}; }
  .footer-link { color: ${colors.muted2}; }
  .email-var {
    font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-weight: 500;
    color: ${colors.ink};
    white-space: nowrap;
    word-break: keep-all;
    overflow-wrap: normal;
  }

  @media (prefers-color-scheme: dark) {
    body, .page-bg { background-color: ${colors.darkBg} !important; }
    .card { background-color: ${colors.darkCardBg} !important; border-color: ${colors.darkCardBorder} !important; }
    .ink { color: ${colors.darkInk} !important; }
    .ink-2 { color: ${colors.darkInk2} !important; }
    .muted { color: ${colors.darkMuted} !important; }
    .muted-2 { color: ${colors.darkMuted2} !important; }
    .fallback-link { color: ${colors.brandDark} !important; }
    .email-var { color: ${colors.darkInk} !important; }
  }

  @media only screen and (max-width: 560px) {
    .card-pad { padding: 32px 24px !important; }
    .h1 { font-size: 22px !important; }
    .btn-link { width: 100% !important; display: block !important; box-sizing: border-box !important; text-align: center; }
  }
`;

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html lang="ko" dir="ltr">
      <Head>
        <meta name="x-apple-disable-message-reformatting" />
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>{headStyles}</style>
      </Head>
      <Preview>{preview}</Preview>
      <Body
        className="page-bg"
        style={{
          backgroundColor: colors.bg,
          margin: 0,
          padding: 0,
          fontFamily: fontStack,
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        <Container
          style={{
            maxWidth: `${layout.containerMaxWidth}px`,
            width: '100%',
            margin: '0 auto',
          }}
        >
          {/* Logo — <picture> 태그로 다크모드 swap.
              미디어쿼리 + CSS display 분기는 Apple Mail 에서 inline style
              specificity 이슈로 안 먹는 경우 있음. <picture>/<source media>
              패턴은 HTML 레벨에서 처리되어 클라이언트 호환성 더 높음. */}
          <Section style={{ padding: '48px 24px 24px 24px' }}>
            <Link
              href="https://kontaxt.kr"
              style={{ textDecoration: 'none', lineHeight: 0, display: 'inline-block' }}
            >
              <picture>
                <source
                  srcSet={KONTAXT_LOGO_DARK_URL}
                  media="(prefers-color-scheme: dark)"
                />
                <img
                  src={KONTAXT_LOGO_LIGHT_URL}
                  alt="kontaxt."
                  width={KONTAXT_LOGO_WIDTH}
                  height={KONTAXT_LOGO_HEIGHT}
                  style={{
                    display: 'block',
                    border: 0,
                    outline: 'none',
                    height: 'auto',
                    width: `${KONTAXT_LOGO_WIDTH}px`,
                  }}
                />
              </picture>
            </Link>
          </Section>

          {/* Card */}
          <Section style={{ padding: '0 24px' }}>
            <Section
              className="card"
              style={{
                backgroundColor: colors.cardBg,
                border: `1px solid ${colors.cardBorder}`,
                borderRadius: `${layout.cardRadius}px`,
              }}
            >
              <Section className="card-pad" style={{ padding: '40px 40px 36px 40px' }}>
                {children}
              </Section>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={{ padding: '28px 24px 48px 24px', textAlign: 'center' }}>
            <Text
              className="muted-2"
              style={{
                margin: 0,
                fontSize: '11px',
                lineHeight: 1.7,
                color: colors.muted2,
              }}
            >
              Kontaxt · 가상자산 양도세 정산 · 발신 전용
            </Text>
            <Text
              className="muted-2"
              style={{
                margin: '6px 0 0 0',
                fontSize: '11px',
                lineHeight: 1.7,
                color: colors.muted2,
              }}
            >
              <Link
                href="mailto:support@kontaxt.kr"
                className="footer-link"
                style={{ color: colors.muted2, textDecoration: 'none' }}
              >
                support@kontaxt.kr
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Eyebrow + H1 + subtitle EN 묶음 — 모든 메일에서 동일 패턴.
export function EmailHeader({
  eyebrow,
  title,
  subtitleEn,
}: {
  eyebrow: string;
  title: string;
  subtitleEn?: string;
}) {
  return (
    <Fragment>
      <Text
        style={{
          margin: '0 0 14px 0',
          fontSize: '11px',
          lineHeight: 1,
          letterSpacing: '0.18em',
          fontWeight: 700,
          color: colors.brand,
          textTransform: 'uppercase',
        }}
      >
        {eyebrow}
      </Text>
      <Text
        className="h1 ink"
        style={{
          margin: 0,
          fontSize: '26px',
          lineHeight: 1.35,
          letterSpacing: '-0.03em',
          fontWeight: 800,
          color: colors.ink,
        }}
      >
        {title}
      </Text>
      {subtitleEn && (
        <Text
          className="muted"
          style={{
            margin: '10px 0 0 0',
            fontSize: '14px',
            lineHeight: 1.5,
            letterSpacing: '-0.005em',
            color: colors.muted,
          }}
        >
          {subtitleEn}
        </Text>
      )}
    </Fragment>
  );
}

// 큰 CTA 버튼 — Outlook VML 폴백 포함, 모바일 풀-너비.
export function EmailCtaButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Section style={{ marginTop: '32px' }}>
      {/* eslint-disable-next-line react/no-danger */}
      <div
        dangerouslySetInnerHTML={{
          __html: `
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${href}" style="height:48px;v-text-anchor:middle;width:280px;" arcsize="21%" stroke="f" fillcolor="${colors.brand}">
              <w:anchorlock/>
              <center style="color:#FFFFFF;font-family:sans-serif;font-size:15px;font-weight:600;">${label}</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-- -->
            <a href="${href}" target="_blank" class="btn-link" style="display:inline-block;background-color:${colors.brand};color:#FFFFFF;font-family:'Pretendard',-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;letter-spacing:-0.005em;line-height:1;text-decoration:none;border-radius:${layout.buttonRadius}px;padding:16px 28px;mso-padding-alt:0;">
              ${label}
            </a>
            <!--<![endif]-->
          `,
        }}
      />
    </Section>
  );
}

// 만료 안내 + 폴백 링크 (한 줄씩) — 카드 하단 공통.
export function EmailExpiry({
  minutes,
  fallbackHref,
}: {
  minutes: number;
  fallbackHref: string;
}) {
  return (
    <Fragment>
      <Text
        className="muted-2"
        style={{
          margin: '28px 0 0 0',
          fontSize: '12px',
          lineHeight: 1.65,
          color: colors.muted2,
        }}
      >
        이 링크는 {minutes}분 후 만료됩니다.
      </Text>
      <Text
        className="muted-2"
        style={{
          margin: '2px 0 0 0',
          fontSize: '12px',
          lineHeight: 1.65,
          color: colors.muted2,
        }}
      >
        버튼이 열리지 않으면{' '}
        <Link
          href={fallbackHref}
          className="fallback-link"
          style={{ color: colors.brand, textDecoration: 'underline' }}
        >
          이 링크
        </Link>
        를 직접 눌러주세요.
      </Text>
    </Fragment>
  );
}
