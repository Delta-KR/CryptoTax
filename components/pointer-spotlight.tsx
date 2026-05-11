'use client';
import { useEffect } from 'react';

// Writes --mx / --my CSS vars on the .hov element under the cursor.
// .hov::before reads them to draw a 220px brand-tinted spotlight.
export function PointerSpotlight() {
  useEffect(() => {
    let raf = 0;
    let lastEl: HTMLElement | null = null;
    let lastX = 0;
    let lastY = 0;

    function flush() {
      raf = 0;
      if (lastEl) {
        lastEl.style.setProperty('--mx', lastX + 'px');
        lastEl.style.setProperty('--my', lastY + 'px');
      }
    }

    function onMove(e: PointerEvent) {
      const target = e.target as Element | null;
      const el = target?.closest?.('.hov') as HTMLElement | null;
      if (!el) return;
      const r = el.getBoundingClientRect();
      lastEl = el;
      lastX = e.clientX - r.left;
      lastY = e.clientY - r.top;
      if (!raf) raf = requestAnimationFrame(flush);
    }

    document.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      document.removeEventListener('pointermove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
