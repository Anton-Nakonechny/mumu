import { describe, it, expect } from 'vitest';
import { UI_STRINGS } from '../../src/domain/language';
import type { Language } from '../../src/domain/language';

const LANGUAGES: Language[] = ['en', 'uk', 'es'];

const EN_HARD_CODED = {
  quizListening: '👂 Listening…',
  quizCorrect: "🎉 Yay! That's right!",
  quizTryAgain: '🙂 Good try — say it again!',
  quizRevealed: 'It says "{sound}". Great trying! Tap ▶ for the next animal.',
};

describe('UI_STRINGS — new quiz feedback fields (FR-009)', () => {
  for (const lang of LANGUAGES) {
    it(`${lang}: all four new fields are non-empty strings`, () => {
      const s = UI_STRINGS[lang];
      expect(typeof s.quizListening).toBe('string');
      expect(s.quizListening.length).toBeGreaterThan(0);
      expect(typeof s.quizCorrect).toBe('string');
      expect(s.quizCorrect.length).toBeGreaterThan(0);
      expect(typeof s.quizTryAgain).toBe('string');
      expect(s.quizTryAgain.length).toBeGreaterThan(0);
      expect(typeof s.quizRevealed).toBe('string');
      expect(s.quizRevealed.length).toBeGreaterThan(0);
    });

    it(`${lang}: quizRevealed contains exactly one {sound} token`, () => {
      const s = UI_STRINGS[lang];
      const matches = s.quizRevealed.match(/\{sound\}/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBe(1);
    });

    it(`${lang}: quizRevealed contains no fixed English scaffolding (no "It says" etc.)`, () => {
      if (lang === 'en') return; // English is the source of truth
      const s = UI_STRINGS[lang];
      expect(s.quizRevealed).not.toContain('It says');
      expect(s.quizRevealed).not.toContain('Great trying');
    });
  }

  it('en: values equal the current hard-coded strings verbatim (FR-009)', () => {
    const s = UI_STRINGS['en'];
    expect(s.quizListening).toBe(EN_HARD_CODED.quizListening);
    expect(s.quizCorrect).toBe(EN_HARD_CODED.quizCorrect);
    expect(s.quizTryAgain).toBe(EN_HARD_CODED.quizTryAgain);
    expect(s.quizRevealed).toBe(EN_HARD_CODED.quizRevealed);
  });
});
