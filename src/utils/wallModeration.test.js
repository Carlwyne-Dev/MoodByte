import { describe, it, expect } from 'vitest';
import { isTooLong, containsBlockedWord, MAX_NOTE_LENGTH } from './wallModeration';

describe('isTooLong', () => {
  it('is false for text at exactly the limit', () => {
    expect(isTooLong('a'.repeat(MAX_NOTE_LENGTH))).toBe(false);
  });

  it('is true for text one character over the limit', () => {
    expect(isTooLong('a'.repeat(MAX_NOTE_LENGTH + 1))).toBe(true);
  });

  it('is false for an empty string', () => {
    expect(isTooLong('')).toBe(false);
  });
});

describe('containsBlockedWord', () => {
  it('is true when the text contains a blocked word', () => {
    expect(containsBlockedWord('this is a badword1 here')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(containsBlockedWord('BADWORD1')).toBe(true);
  });

  it('respects word boundaries and does not flag substrings', () => {
    expect(containsBlockedWord('badword1extra')).toBe(false);
  });

  it('is false for clean text', () => {
    expect(containsBlockedWord('have a wonderful day')).toBe(false);
  });
});
