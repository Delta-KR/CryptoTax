import { describe, it, expect } from 'vitest';
import { GUIDES, getGuide, GUIDE_SLUGS } from '../index';
import { GLOSSARY_SLUGS } from '@/lib/glossary/terms';

describe('guides 메타 무결성', () => {
  it('slug가 유니크하다', () => {
    const slugs = GUIDES.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('slug는 URL-safe kebab-case다', () => {
    for (const g of GUIDES) {
      expect(g.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('category는 exchange 또는 feature다', () => {
    for (const g of GUIDES) {
      expect(['exchange', 'feature']).toContain(g.category);
    }
  });

  it('related는 모두 실재하는 glossary term이다 (dangling cross-link 방지)', () => {
    for (const g of GUIDES) {
      for (const r of g.related) {
        expect(GLOSSARY_SLUGS).toContain(r);
      }
    }
  });

  it('title·summary는 비어 있지 않다', () => {
    for (const g of GUIDES) {
      expect(g.title.length).toBeGreaterThan(0);
      expect(g.summary.length).toBeGreaterThan(0);
    }
  });

  it('getGuide는 slug로 조회된다', () => {
    expect(getGuide('upbit-pdf-download')?.category).toBe('exchange');
    expect(getGuide('nonexistent')).toBeUndefined();
  });

  it('GUIDE_SLUGS는 published만 포함한다', () => {
    for (const slug of GUIDE_SLUGS) {
      expect(getGuide(slug)?.published).toBe(true);
    }
  });
});
