'use client';

import { useEffect, useState } from 'react';

/**
 * Custom hook to detect user's prefers-reduced-motion OS preference.
 * Used to disable or soften map flyTo transitions for accessibility.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQueryList = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQueryList.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange);
    } else {
      // Legacy Safari fallback
      mediaQueryList.addListener(handleChange);
    }

    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handleChange);
      } else {
        // Legacy Safari fallback
        mediaQueryList.removeListener(handleChange);
      }
    };
  }, []);

  return prefersReducedMotion;
}
