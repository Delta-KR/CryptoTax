import { SITE_URL } from '@/lib/site';

interface Crumb {
  name: string;
  path: string;
}

/**
 * BreadcrumbList JSON-LD 컴포넌트.
 * Google rich result + AI 검색 site hierarchy 인식용.
 *
 * 사용 예:
 *   <BreadcrumbJsonLd items={[
 *     { name: 'Kontaxt', path: '' },
 *     { name: '양도소득세 시뮬레이터', path: '/simulator' },
 *   ]} />
 *
 * - `path` 는 SITE_URL 에 그대로 붙여 `item` URL 로 직렬화됨 (앞에 `/` 포함, 루트는 빈 문자열).
 * - `position` 은 배열 순서대로 1부터 자동 부여.
 */
export function BreadcrumbJsonLd({ items }: { items: Crumb[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: items.map((it, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: it.name,
            item: `${SITE_URL}${it.path}`,
          })),
        }),
      }}
    />
  );
}
