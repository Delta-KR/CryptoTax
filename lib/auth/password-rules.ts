export interface PasswordRule {
  key: string;
  label: string;
  test: (pwd: string) => boolean;
}

export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    key: 'length',
    label: '10자 이상',
    test: (p) => p.length >= 10,
  },
  {
    key: 'lower',
    label: '영문 소문자 포함',
    test: (p) => /[a-z]/.test(p),
  },
  {
    key: 'upper',
    label: '영문 대문자 포함',
    test: (p) => /[A-Z]/.test(p),
  },
  {
    key: 'digit',
    label: '숫자 포함',
    test: (p) => /\d/.test(p),
  },
  {
    key: 'special',
    label: '특수문자 포함 (예: $, !, @, %, &)',
    test: (p) => /[^A-Za-z0-9]/.test(p),
  },
  {
    key: 'no-whitespace',
    label: '앞뒤 공백 없음',
    test: (p) => p.length > 0 && p === p.trim(),
  },
];

export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password));
}
