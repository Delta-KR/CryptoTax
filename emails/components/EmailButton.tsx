import * as React from 'react';
import { Button } from '@react-email/components';
import { colors, fontStack, radius } from './tokens';

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

/**
 * 이메일용 CTA 버튼.
 * - Primary: brand fill, 본문에 1개만 사용
 * - Secondary: outline, 보조 액션
 *
 * DESIGN.md의 라운드 10px, 풀-너비 540px 컨테이너 안에서 자연스러운 크기.
 */
export function EmailButton({
  href,
  children,
  variant = 'primary',
}: EmailButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Button
      href={href}
      style={{
        display: 'inline-block',
        backgroundColor: isPrimary ? colors.brand : colors.card,
        color: isPrimary ? '#FFFFFF' : colors.ink2,
        border: isPrimary ? 'none' : `1px solid ${colors.line}`,
        borderRadius: radius.button,
        padding: '14px 28px',
        fontFamily: fontStack,
        fontSize: '15px',
        fontWeight: 600,
        textDecoration: 'none',
        lineHeight: 1,
        letterSpacing: '-0.005em',
      }}
    >
      {children}
    </Button>
  );
}
