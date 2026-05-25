import * as React from 'react';
import { Text } from '@react-email/components';
import {
  EmailCtaButton,
  EmailHeader,
  EmailLayout,
} from './components/EmailLayout';
import { colors } from './components/tokens';
import { SUPPORT_EMAIL } from '@/lib/email/contact';

export interface WelcomeEmailProps {
  /** 사용자 이름 — Naver OAuth는 full_name 채워짐, 일반 signup은 비어있음. */
  userName?: string;
  /** 인증 완료 후 이동할 dashboard URL. */
  dashboardUrl?: string;
  /** 2027-01-01 시행까지 D-day. callback route에서 계산해 주입. */
  daysUntilLaw?: number;
}

export default function WelcomeEmail({
  userName,
  dashboardUrl = 'https://kontaxt.kr/dashboard',
  daysUntilLaw = 237,
}: WelcomeEmailProps = {}) {
  const greeting = userName
    ? `${userName}님, Kontaxt에 오신 것을 환영합니다.`
    : 'Kontaxt에 오신 것을 환영합니다.';

  return (
    <EmailLayout preview="Kontaxt에 오신 것을 환영합니다. 대시보드에서 결과를 미리 확인해 보세요.">
      <EmailHeader
        eyebrow="Welcome"
        title={greeting}
        subtitleEn="Welcome to Kontaxt."
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
        가상자산 양도소득 과세 시행까지 D-{daysUntilLaw}.
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
        거래소 자동 합산과 시뮬레이션으로 예상 세액 미리 확인해 보세요. 결제는 곧 출시돼요. 가입자에게 우선 알림이 가요.
      </Text>

      <EmailCtaButton href={dashboardUrl} label="대시보드로 이동" />
    </EmailLayout>
  );
}

// Plain-text 버전.
export const welcomePlainText = ({
  userName,
  dashboardUrl = 'https://kontaxt.kr/dashboard',
  daysUntilLaw = 237,
}: WelcomeEmailProps = {}): string => `${
  userName ? `${userName}님, ` : ''
}Kontaxt에 오신 것을 환영합니다.
Welcome to Kontaxt.

가상자산 양도소득 과세 시행까지 D-${daysUntilLaw}.
거래소 자동 합산과 시뮬레이션으로 예상 세액 미리 확인해 보세요.
결제는 곧 출시돼요. 가입자에게 우선 알림이 가요.

대시보드: ${dashboardUrl}

—
Kontaxt · 가상자산 양도세 정산 · 발신 전용
${SUPPORT_EMAIL}
`;
