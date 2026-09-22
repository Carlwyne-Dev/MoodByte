import { useState, useEffect } from 'react';

const ANON_ID_KEY = 'moodbyte_anon_id';

// Reads (or creates) a stable per-browser anonymous id, used only as a soft
// rate-limit/ownership token for the Community Wall — never displayed, not
// an account. Exported separately from the hook so it's testable with a
// plain mock storage object, same pattern as collectSyncPayload in
// src/utils/syncLogic.js.
export function getOrCreateAnonId(storage) {
  const existing = storage.getItem(ANON_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  storage.setItem(ANON_ID_KEY, id);
  return id;
}

// React wrapper: creates/reads the id once, after mount. Deliberately NOT a
// useState lazy initializer — writing to localStorage is a side effect and
// must not run during the render phase.
export function useAnonId() {
  const [anonId, setAnonId] = useState(null);

  useEffect(() => {
    setAnonId(getOrCreateAnonId(window.localStorage));
  }, []);

  return anonId;
}
