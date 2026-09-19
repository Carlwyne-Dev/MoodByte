import { useEffect } from 'react';

// Silently warms the browser cache for a list of background image URLs a
// few seconds after mount, so theme switches feel instant later on.
export function useBackgroundPreloader(srcs) {
  useEffect(() => {
    const timer = setTimeout(() => {
      srcs.forEach(src => {
        const img = new Image();
        img.src = src;
      });
    }, 3000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
