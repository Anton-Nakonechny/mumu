import { describe, it, expect } from 'vitest';
import { CHEERS, AUTO_ADVANCE_DELAY_MS, nextCheer } from '../../src/domain/cheers';
import type { Language } from '../../src/domain/language';

const LANGS: Language[] = ['uk', 'es', 'en'];

describe('cheers (Quiz Cheer & Auto-Advance)', () => {
  it('exposes a non-empty set of short celebratory phrases for each language', () => {
    for (const lang of LANGS) {
      expect(CHEERS[lang].length).toBeGreaterThan(0);
      for (const phrase of CHEERS[lang]) {
        expect(phrase.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('uses a short post-cheer delay within the assumed 1.5–2.5s window', () => {
    expect(AUTO_ADVANCE_DELAY_MS).toBeGreaterThanOrEqual(1500);
    expect(AUTO_ADVANCE_DELAY_MS).toBeLessThanOrEqual(2500);
  });

  it('always returns a member of CHEERS[lang]', () => {
    for (const lang of LANGS) {
      for (let i = 0; i < 100; i++) {
        expect(CHEERS[lang]).toContain(nextCheer(lang));
      }
    }
  });

  it('never immediately repeats the previous cheer when more than one phrase exists', () => {
    for (const lang of LANGS) {
      expect(CHEERS[lang].length).toBeGreaterThan(1);
      let previous = nextCheer(lang);
      for (let i = 0; i < 200; i++) {
        const next = nextCheer(lang, previous);
        expect(next).not.toBe(previous);
        expect(CHEERS[lang]).toContain(next);
        previous = next;
      }
    }
  });

  it('returns a valid cheer when omitting previous', () => {
    for (const lang of LANGS) {
      expect(CHEERS[lang]).toContain(nextCheer(lang));
    }
  });
});
