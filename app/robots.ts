import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

const PUBLIC_PATHS = ['/', '/sample', '/login', '/signup', '/guide', '/simulator', '/legal/terms', '/legal/privacy'];
const AUTH_PATHS = [
  '/dashboard',
  '/transactions',
  '/tax',
  '/report',
  '/billing',
  '/settings',
  '/forgot-password',
  '/reset-password',
];

// 학습용 크롤러 — 콘텐츠 disallow.
// Kontaxt 콘텐츠가 LLM 학습 corpus 에 기여하는 zero 보상 회피.
const TRAINING_BOTS = [
  'GPTBot',         // OpenAI 학습용
  'anthropic-ai',   // Anthropic 학습용 (legacy)
  'ClaudeBot',      // Anthropic 학습용
  'CCBot',          // Common Crawl (LLM 학습 corpus 의 주요 source)
  'Google-Extended', // Google AI 학습용 (Gemini 등)
  'Bytespider',     // ByteDance 학습용
  'FacebookBot',    // Meta 학습용
  'Diffbot',        // 데이터 추출/판매
  'omgili',         // 학습 corpus
];

// 검색·RAG 크롤러 — allow.
// 사용자가 ChatGPT/Perplexity/Claude 에서 질문 시 실시간 fetch → 답변 안에 Kontaxt 인용.
const SEARCH_RAG_BOTS = [
  'ChatGPT-User',     // OpenAI ChatGPT user-triggered fetch
  'OAI-SearchBot',    // OpenAI ChatGPT Search
  'PerplexityBot',    // Perplexity search index
  'Perplexity-User',  // Perplexity user-triggered
  'Claude-Web',       // Anthropic user-triggered fetch
  'cohere-ai',        // Cohere search
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 일반 크롤러 (Googlebot, Bingbot, Naver Yeti 등) — 기존 정책
      {
        userAgent: '*',
        allow: PUBLIC_PATHS,
        // 인증 후 영역은 검색엔진에 노출하지 않음 (개인 데이터 페이지)
        disallow: AUTH_PATHS,
      },
      // 학습용 봇 — 전체 disallow
      {
        userAgent: TRAINING_BOTS,
        disallow: ['/'],
      },
      // 검색·RAG 봇 — 일반 정책과 동일하게 allow/disallow
      {
        userAgent: SEARCH_RAG_BOTS,
        allow: PUBLIC_PATHS,
        disallow: AUTH_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
