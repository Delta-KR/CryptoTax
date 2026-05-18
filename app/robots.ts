import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/sample', '/login', '/signup', '/guide', '/legal/terms', '/legal/privacy'],
        // 인증 후 영역은 검색엔진에 노출하지 않음 (개인 데이터 페이지)
        disallow: [
          '/dashboard',
          '/transactions',
          '/tax',
          '/report',
          '/billing',
          '/settings',
          '/forgot-password',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
