import * as React from 'react';
import { Section, Text, Link, Row, Column } from '@react-email/components';
import { EmailLayout } from './components/EmailLayout';
import { EmailButton } from './components/EmailButton';
import { BilingualHeading, BilingualText } from './components/BilingualBlock';
import { colors, type, fontStack } from './components/tokens';

export interface WelcomeEmailProps {
  /** 사용자 이름 또는 이메일 prefix (없으면 인사말 생략 가능) */
  userName?: string;
  /** 대시보드 진입 URL */
  dashboardUrl?: string;
  /** 2027.01.01까지 남은 D-day (서버에서 계산해서 전달) */
  daysUntilLaw?: number;
}

/**
 * 환영 메일 (이메일 인증 완료 후)
 *
 * 사용 시점: 이메일 인증 완료 직후, 또는 첫 로그인 직후
 * 핵심 메시지: 이미 가입은 끝났다. Kontaxt가 무엇을 해주는지, 3단계로 첫 결과까지.
 *
 * 톤: 인증 메일보다 살짝 따뜻하게. 단, 과한 환영 문구나 이모지는 금지.
 */
/**
 * Welcome 메일은 Supabase Auth 흐름이 아니라 인증 완료 후 자체 트리거.
 * 따라서 Supabase 변수가 아닌 실제 URL을 props로 받음.
 */
export default function WelcomeEmail({
  userName,
  dashboardUrl = 'https://kontaxt.kr/dashboard',
  daysUntilLaw = 237,
}: WelcomeEmailProps) {
  return (
    <EmailLayout preview="Kontaxt에 오신 것을 환영합니다. 2분이면 첫 결과가 나옵니다.">
      {/* Eyebrow */}
      <Text
        style={{
          ...type.eyebrow,
          margin: 0,
          marginBottom: '12px',
        }}
      >
        WELCOME TO KONTAXT
      </Text>

      {/* Heading */}
      <BilingualHeading
        ko={
          userName
            ? `${userName}님, Kontaxt에 오신 것을 환영합니다.`
            : 'Kontaxt에 오신 것을 환영합니다.'
        }
        en={userName ? `Welcome, ${userName}.` : 'Welcome to Kontaxt.'}
      />

      {/* Body */}
      <Section style={{ marginTop: '24px' }}>
        <BilingualText
          ko="복잡한 한국 가상자산 양도세를 정확히 계산해 드립니다. 거래소 파일을 올리면 손익 통산과 납부세액까지 한 번에."
          en="Kontaxt calculates Korean crypto capital-gains tax accurately. Upload your exchange files and get realized P&L and tax owed in one pass."
          marginBottom="24px"
        />
      </Section>

      {/* D-day callout */}
      <Section
        style={{
          marginTop: '8px',
          marginBottom: '28px',
          backgroundColor: colors.brandFaint,
          border: `1px solid ${colors.brandSoft}`,
          borderRadius: '12px',
          padding: '16px 20px',
        }}
      >
        <Row>
          <Column style={{ verticalAlign: 'middle' }}>
            <Text
              style={{
                fontSize: '11px',
                lineHeight: 1,
                letterSpacing: '0.16em',
                fontWeight: 700,
                color: colors.brand,
                textTransform: 'uppercase',
                margin: 0,
                marginBottom: '6px',
              }}
            >
              2027.01.01 시행
            </Text>
            <Text
              style={{
                fontSize: '15px',
                lineHeight: 1.5,
                color: colors.ink,
                fontWeight: 600,
                margin: 0,
              }}
            >
              가상자산 양도소득 과세까지 D-{daysUntilLaw}
            </Text>
            <Text
              style={{
                fontSize: '12px',
                lineHeight: 1.5,
                color: colors.muted,
                margin: '2px 0 0 0',
              }}
            >
              D-{daysUntilLaw} until Korea&apos;s crypto capital-gains tax takes effect.
            </Text>
          </Column>
        </Row>
      </Section>

      {/* 3 Steps */}
      <Section style={{ marginTop: '8px' }}>
        <Text
          style={{
            ...type.eyebrow,
            color: colors.muted,
            margin: 0,
            marginBottom: '16px',
            fontSize: '10px',
            letterSpacing: '0.14em',
          }}
        >
          시작하기 · GET STARTED
        </Text>

        <StepRow
          number="1"
          ko="거래소 파일 업로드"
          koSub="Upbit, Bithumb, Binance — PDF·XLS·CSV 그대로."
          en="Upload exchange files (Upbit, Bithumb, Binance) — PDF, XLS, CSV as-is."
        />
        <StepRow
          number="2"
          ko="자동 정규화 + FIFO 계산"
          koSub="환율·SWAP·수수료를 한국 세법에 맞춰 처리합니다."
          en="Auto-normalize FX, swaps, fees per Korean tax code. FIFO cost basis."
        />
        <StepRow
          number="3"
          ko="손익 대시보드 + 세무사용 PDF"
          koSub="250만원 공제·22% 세율 적용. 그대로 세무사에게 전달."
          en="Tax dashboard plus accountant-ready PDF. 2.5M KRW deduction · 22% rate."
        />
      </Section>

      {/* CTA */}
      <Section style={{ marginTop: '32px', marginBottom: '8px' }}>
        <EmailButton href={dashboardUrl}>
          대시보드 열기 · Open dashboard
        </EmailButton>
      </Section>

      <Section style={{ marginTop: '8px' }}>
        <Text
          style={{
            ...type.small,
            color: colors.muted2,
            margin: 0,
            fontSize: '12px',
          }}
        >
          신용카드 등록 없이 결제 전 미리보기 무료. · Free preview before any charge.
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

      {/* Help links */}
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
          도움이 필요하면 · NEED HELP?
        </Text>
        <Text
          style={{
            ...type.body,
            margin: 0,
            fontSize: '14px',
          }}
        >
          <Link
            href="https://kontaxt.kr/guide"
            style={{ color: colors.brand, textDecoration: 'none', fontWeight: 500 }}
          >
            사용 가이드
          </Link>
          <span style={{ color: colors.muted2 }}>{' · '}</span>
          <Link
            href="https://kontaxt.kr/faq"
            style={{ color: colors.brand, textDecoration: 'none', fontWeight: 500 }}
          >
            자주 묻는 질문
          </Link>
          <span style={{ color: colors.muted2 }}>{' · '}</span>
          <Link
            href="mailto:support@kontaxt.kr"
            style={{ color: colors.brand, textDecoration: 'none', fontWeight: 500 }}
          >
            support@kontaxt.kr
          </Link>
        </Text>
        <Text
          style={{
            ...type.small,
            color: colors.muted2,
            margin: '4px 0 0 0',
            fontSize: '11px',
          }}
        >
          User guide · FAQ · Direct support
        </Text>
      </Section>
    </EmailLayout>
  );
}

/** 3단계 행. table-row로 안정적인 정렬. */
function StepRow({
  number,
  ko,
  koSub,
  en,
}: {
  number: string;
  ko: string;
  koSub: string;
  en: string;
}) {
  return (
    <Row style={{ marginBottom: '14px' }}>
      <Column
        style={{
          width: '36px',
          verticalAlign: 'top',
          paddingTop: '2px',
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '999px',
            backgroundColor: colors.brandSoft,
            color: colors.brand,
            fontFamily: fontStack,
            fontSize: '13px',
            fontWeight: 700,
            lineHeight: '28px',
            textAlign: 'center',
          }}
        >
          {number}
        </div>
      </Column>
      <Column style={{ verticalAlign: 'top' }}>
        <Text
          style={{
            fontSize: '15px',
            lineHeight: 1.45,
            color: colors.ink,
            fontWeight: 600,
            margin: 0,
          }}
        >
          {ko}
        </Text>
        <Text
          style={{
            fontSize: '13px',
            lineHeight: 1.5,
            color: colors.muted,
            margin: '2px 0 0 0',
          }}
        >
          {koSub}
        </Text>
        <Text
          style={{
            fontSize: '12px',
            lineHeight: 1.5,
            color: colors.muted2,
            margin: '2px 0 0 0',
          }}
        >
          {en}
        </Text>
      </Column>
    </Row>
  );
}

export const welcomePlainText = (props: WelcomeEmailProps) => `
Kontaxt에 오신 것을 환영합니다.
Welcome to Kontaxt.

복잡한 한국 가상자산 양도세를 정확히 계산해 드립니다.
거래소 파일을 올리면 손익 통산과 납부세액까지 한 번에.

Kontaxt calculates Korean crypto capital-gains tax accurately.
Upload your exchange files for realized P&L and tax owed in one pass.

2027.01.01 시행 — 가상자산 양도소득 과세까지 D-${props.daysUntilLaw ?? 237}
D-${props.daysUntilLaw ?? 237} until the law takes effect.

시작하기 · Get started
1. 거래소 파일 업로드 (Upbit, Bithumb, Binance)
2. 자동 정규화 + FIFO 계산
3. 손익 대시보드 + 세무사용 PDF

대시보드: ${props.dashboardUrl ?? 'https://kontaxt.kr/dashboard'}

도움이 필요하면 · Need help?
사용 가이드: https://kontaxt.kr/guide
자주 묻는 질문: https://kontaxt.kr/faq
문의: support@kontaxt.kr

—
Kontaxt · 가상자산 양도세 정산
`.trim();
