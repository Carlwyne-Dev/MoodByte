import { describe, it, expect } from 'vitest';
import { getOrCreateAnonId } from './useAnonId';

function makeMockStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = v; },
  };
}

describe('getOrCreateAnonId', () => {
  it('creates and persists a new id when none exists', () => {
    const storage = makeMockStorage();
    const id = getOrCreateAnonId(storage);
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(storage.getItem('moodbyte_anon_id')).toBe(id);
  });

  it('returns the same id on a second call', () => {
    const storage = makeMockStorage();
    const first = getOrCreateAnonId(storage);
    const second = getOrCreateAnonId(storage);
    expect(second).toBe(first);
  });

  it('returns an existing stored id without creating a new one', () => {
    const storage = makeMockStorage({ moodbyte_anon_id: 'existing-id-123' });
    expect(getOrCreateAnonId(storage)).toBe('existing-id-123');
  });
});
