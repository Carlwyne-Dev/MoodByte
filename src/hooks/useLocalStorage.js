import { useState, useEffect, useRef } from 'react';

export function useLocalStorage(key, initialValue) {
  // Get from local storage then
  // parse stored json or return initialValue
  const readValue = () => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState(readValue);
  // Mirrors storedValue synchronously so setValue can compute "prev" itself
  // instead of doing it inside setStoredValue's updater — dispatching the
  // 'local-storage' event from in there re-enters this same hook's own
  // listener mid-update, which React's StrictMode double-invoke can turn
  // into a corrupted/stale computation for functional updates.
  const storedValueRef = useRef(storedValue);

  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore = value instanceof Function ? value(storedValueRef.current) : value;
      storedValueRef.current = valueToStore;
      setStoredValue(valueToStore);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        window.dispatchEvent(new CustomEvent('local-storage', { detail: { key, value: valueToStore } }));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  useEffect(() => {
    const initial = readValue();
    storedValueRef.current = initial;
    setStoredValue(initial);

    // Listen for custom event to sync state across same-window components
    const handleStorageChange = (e) => {
      if (e.detail && e.detail.key === key) {
        storedValueRef.current = e.detail.value;
        setStoredValue(e.detail.value);
      }
    };

    // Listen for standard storage event (cross-tab)
    const handleCrossTabChange = (e) => {
      if (e.key === key) {
        const next = readValue();
        storedValueRef.current = next;
        setStoredValue(next);
      }
    };

    window.addEventListener('local-storage', handleStorageChange);
    window.addEventListener('storage', handleCrossTabChange);

    return () => {
      window.removeEventListener('local-storage', handleStorageChange);
      window.removeEventListener('storage', handleCrossTabChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return [storedValue, setValue];
}
