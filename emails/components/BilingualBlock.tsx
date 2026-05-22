import * as React from 'react';
import { Text } from '@react-email/components';
import { colors, type } from './tokens';

interface BilingualTextProps {
  ko: string;
  en: string;
  /** 단락 위/아래 간격 */
  marginTop?: string;
  marginBottom?: string;
}

/**
 * 한국어 + 영어 병기 본문 블록.
 * - 한국어가 위, 더 큰 사이즈
 * - 영어는 아래, 작고 muted
 *
 * 디자인 의도: 한국 사용자가 주력이지만 일부 영어 사용자도 같은 메일을 읽음.
 * 영어를 별도 메일로 발송하지 않고 한 메일에 묶어 발송 빈도 최소화.
 */
export function BilingualText({
  ko,
  en,
  marginTop = '0',
  marginBottom = '0',
}: BilingualTextProps) {
  return (
    <>
      <Text
        style={{
          ...type.body,
          margin: 0,
          marginTop,
        }}
      >
        {ko}
      </Text>
      <Text
        style={{
          ...type.bodyEn,
          margin: 0,
          marginTop: '4px',
          marginBottom,
        }}
      >
        {en}
      </Text>
    </>
  );
}

interface BilingualHeadingProps {
  ko: string;
  en: string;
}

/**
 * 한국어 헤드라인 + 영어 서브헤드라인.
 * 메일당 1개만 사용.
 */
export function BilingualHeading({ ko, en }: BilingualHeadingProps) {
  return (
    <>
      <Text
        style={{
          ...type.h1,
          margin: 0,
        }}
      >
        {ko}
      </Text>
      <Text
        style={{
          fontSize: '15px',
          lineHeight: '1.5',
          color: colors.muted,
          margin: '6px 0 0 0',
          fontWeight: 400,
          letterSpacing: '-0.01em',
        }}
      >
        {en}
      </Text>
    </>
  );
}
