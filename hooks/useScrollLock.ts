import { useEffect, useRef } from 'react';

/**
 * Locks body scroll when active.
 * Uses body.scroll-locked class + saves/restores scroll position.
 */
export function useScrollLock(active: boolean) {
  const scrollY = useRef(0);

  useEffect(() => {
    if (!active) return;

    // Save current scroll position
    scrollY.current = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;

    // Apply lock
    document.body.classList.add('scroll-locked');
    document.body.style.top = `-${scrollY.current}px`;

    return () => {
      // Remove lock
      document.body.classList.remove('scroll-locked');
      document.body.style.top = '';

      // Restore scroll position
      window.scrollTo({ top: scrollY.current, behavior: 'instant' as ScrollBehavior });
    };
  }, [active]);
}
