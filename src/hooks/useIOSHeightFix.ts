import { useEffect } from 'react';

/**
 * Hook to fix iOS Safari address bar hiding issues
 * Sets the correct height on iOS devices to allow address bar to hide on scroll
 */
export function useIOSHeightFix() {
  useEffect(() => {
    // Check if iOS (all browsers)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Apply to all iOS devices for safety
    if (isIOS) {
      console.log('Applying iOS height fix for address bar hiding');
      
      const setHeight = () => {
        // Calculate 1% of viewport height
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        
        // Also set height on root element for extra safety
        const root = document.getElementById('root');
        if (root) {
          root.style.height = `${window.innerHeight}px`;
          root.style.minHeight = `${window.innerHeight}px`;
        }
      };
      
      // Set initial height
      setHeight();
      
      // Update on resize (orientation change and address bar hide/show)
      window.addEventListener('resize', setHeight);
      window.addEventListener('orientationchange', setHeight);
      
      // Also update when window visual viewport changes (Safari specific)
      if ((window as any).visualViewport) {
        (window as any).visualViewport.addEventListener('resize', setHeight);
      }
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', setHeight);
        window.removeEventListener('orientationchange', setHeight);
        if ((window as any).visualViewport) {
          (window as any).visualViewport.removeEventListener('resize', setHeight);
        }
      };
    }
  }, []);
}