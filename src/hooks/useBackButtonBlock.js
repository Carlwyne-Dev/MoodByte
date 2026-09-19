import { useEffect } from 'react';

// Pushes a dummy history entry on mount, then re-pushes on every popstate so
// the browser's back button never navigates away from the app.
export function useBackButtonBlock() {
  useEffect(() => {
    history.pushState({ moodbyte: true }, '');
    const handlePop = () => {
      history.pushState({ moodbyte: true }, '');
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);
}
