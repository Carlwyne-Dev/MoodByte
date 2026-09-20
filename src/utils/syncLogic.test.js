import { describe, it, expect } from 'vitest';
import { isSyncableKey, shouldApplyCloudUpdate, resolveInitialPull, collectSyncPayload, SYNC_KEYS } from './syncLogic';

describe('isSyncableKey', () => {
  it('accepts every key in the known SYNC_KEYS list', () => {
    for (const key of SYNC_KEYS) {
      expect(isSyncableKey(key)).toBe(true);
    }
  });

  it('accepts any key prefixed with moodbyte_ even if not explicitly listed', () => {
    expect(isSyncableKey('moodbyte_some_new_feature_flag')).toBe(true);
  });

  it('rejects unrelated keys with no moodbyte_ prefix', () => {
    expect(isSyncableKey('some_random_key')).toBe(false);
    expect(isSyncableKey('vite-theme')).toBe(false);
  });

  // NOTE: this key isn't in SYNC_KEYS, but it does start with "moodbyte_",
  // so the prefix rule makes it syncable too — same as production today.
  // Worth a second look: it means the local-modified timestamp itself gets
  // pushed to (and could be overwritten by) the cloud.
  it('treats moodbyte_local_last_modified as syncable via the prefix rule', () => {
    expect(isSyncableKey('moodbyte_local_last_modified')).toBe(true);
  });
});

describe('shouldApplyCloudUpdate', () => {
  it('applies the cloud update when it is strictly newer', () => {
    expect(shouldApplyCloudUpdate(2000, 1000)).toBe(true);
  });

  it('rejects the cloud update when timestamps are equal (avoids re-applying our own echoed write)', () => {
    expect(shouldApplyCloudUpdate(1000, 1000)).toBe(false);
  });

  it('rejects the cloud update when local is newer', () => {
    expect(shouldApplyCloudUpdate(1000, 2000)).toBe(false);
  });
});

describe('resolveInitialPull', () => {
  it('applies cloud data when not restricted to "only if newer"', () => {
    expect(resolveInitialPull({ onlyIfNewer: false, localTs: 2000, cloudTs: 1000 })).toBe('apply');
  });

  it('applies cloud data when onlyIfNewer is set but cloud is newer', () => {
    expect(resolveInitialPull({ onlyIfNewer: true, localTs: 1000, cloudTs: 2000 })).toBe('apply');
  });

  it('applies cloud data when onlyIfNewer is set and timestamps are equal', () => {
    expect(resolveInitialPull({ onlyIfNewer: true, localTs: 1000, cloudTs: 1000 })).toBe('apply');
  });

  it('pushes local data instead when onlyIfNewer is set and local is strictly newer', () => {
    expect(resolveInitialPull({ onlyIfNewer: true, localTs: 2000, cloudTs: 1000 })).toBe('pushLocalInstead');
  });
});

function makeMockStorage(entries) {
  const keys = Object.keys(entries);
  return {
    length: keys.length,
    key: (i) => keys[i],
    getItem: (k) => entries[k],
  };
}

describe('collectSyncPayload', () => {
  it('parses JSON values for syncable keys', () => {
    const storage = makeMockStorage({
      tasks: JSON.stringify([{ id: 1, text: 'Write tests' }]),
      theme: JSON.stringify('night'),
    });
    expect(collectSyncPayload(storage)).toEqual({
      tasks: [{ id: 1, text: 'Write tests' }],
      theme: 'night',
    });
  });

  it('falls back to the raw string when a value is not valid JSON', () => {
    const storage = makeMockStorage({ theme: 'night' }); // not JSON-quoted
    expect(collectSyncPayload(storage)).toEqual({ theme: 'night' });
  });

  it('skips keys with no moodbyte_ prefix that are not in the explicit list', () => {
    const storage = makeMockStorage({
      tasks: JSON.stringify([]),
      unrelated_key: '"nope"',
    });
    expect(collectSyncPayload(storage)).toEqual({ tasks: [] });
  });

  it('includes moodbyte_-prefixed keys not in the explicit list', () => {
    const storage = makeMockStorage({ moodbyte_welcome_main: JSON.stringify(true) });
    expect(collectSyncPayload(storage)).toEqual({ moodbyte_welcome_main: true });
  });

  it('returns an empty object for empty storage', () => {
    expect(collectSyncPayload(makeMockStorage({}))).toEqual({});
  });
});
