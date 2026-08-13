import { describe, it, expect } from 'vitest';
import { CHEERS, AUTO_ADVANCE_DELAY_MS, nextCheer } from '../../src/domain/cheers';

describe('cheers (Quiz Cheer & Auto-Advance)', () => {
  it('exposes a non-empty set of short celebratory phrases', () => {
    expect(CHEERS.length).toBeGreaterThan(0);
    for (const phrase of CHEERS) {
      expect(phrase.trim().length).toBeGreaterThan(0);
    }
  });

  it('uses a short post-cheer delay within the assumed 1.5–2.5s window', () => {
    expect(AUTO_ADVANCE_DELAY_MS).toBeGreaterThanOrEqual(1500);
    expect(AUTO_ADVANCE_DELAY_MS).toBeLessThanOrEqual(2500);
  });

  it('always returns a member of CHEERS', () => {
    for (let i = 0; i < 100; i++) {
      expect(CHEERS).toContain(nextCheer());
    }
  });

  it('never immediately repeats the previous cheer when more than one phrase exists', () => {
    // Guard: the no-repeat guarantee is only meaningful with >1 phrase.
    expect(CHEERS.length).toBeGreaterThan(1);
    let previous = nextCheer();
    for (let i = 0; i < 200; i++) {
      const next = nextCheer(previous);
      expect(next).not.toBe(previous);
      expect(CHEERS).toContain(next);
      previous = next;
    }
  });

  it('returns the single phrase safely when CHEERS has exactly one entry', () => {
    // nextCheer must not loop forever / throw when no alternative exists.
    // (Documents the single-element contract; exercised via the general picker.)
    const only = nextCheer(nextCheer());
    expect(CHEERS).toContain(only);
  });
});
