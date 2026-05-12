// 2027년 1월 1일 0시 (KST) 한국 가상자산 양도소득세 시행 D-day 카운트다운.
// server component에서 호출 시 Date.now()로 인해 페이지가 dynamic이 되므로,
// 호출하는 페이지는 `export const revalidate = N`로 ISR 주기를 명시할 것.

const TAX_START_KST_MS = new Date('2027-01-01T00:00:00+09:00').getTime();
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export function getDaysUntilTaxStart(): number {
  const diff = TAX_START_KST_MS - Date.now();
  return Math.max(0, Math.ceil(diff / MS_PER_DAY));
}
