import { describe, it, expect } from 'vitest';
import { LANGUAGES, DEFAULT_LANGUAGE, UI_STRINGS, type Language } from '../../src/domain/language';

describe('LANGUAGES array', () => {
  it('contains exactly three entries: uk, es, en in that order', () => {
    expect(LANGUAGES.map((l) => l.code)).toEqual(['uk', 'es', 'en']);
  });

  it('has the correct flag emojis', () => {
    const flags = Object.fromEntries(LANGUAGES.map((l) => [l.code, l.flag]));
    expect(flags.uk).toBe('🇺🇦');
    expect(flags.es).toBe('🇪🇸');
    expect(flags.en).toBe('🇺🇸');
  });

  it('has the correct BCP-47 ttsLang tags', () => {
    const tags = Object.fromEntries(LANGUAGES.map((l) => [l.code, l.ttsLang]));
    expect(tags.uk).toBe('uk-UA');
    expect(tags.es).toBe('es-ES');
    expect(tags.en).toBe('en-US');
  });

  it('has the correct BCP-47 speechLang tags', () => {
    const tags = Object.fromEntries(LANGUAGES.map((l) => [l.code, l.speechLang]));
    expect(tags.uk).toBe('uk-UA');
    expect(tags.es).toBe('es-ES');
    expect(tags.en).toBe('en-US');
  });

  it('has non-empty label for each language', () => {
    for (const lang of LANGUAGES)
      expect(lang.label.trim().length).toBeGreaterThan(0);
  });
});

describe('DEFAULT_LANGUAGE', () => {
  it('is uk', () => {
    expect(DEFAULT_LANGUAGE).toBe('uk');
  });
});

describe('UI_STRINGS', () => {
  const keys: (keyof (typeof UI_STRINGS)[Language])[] = [
    'learn', 'quiz', 'listen', 'loading', 'noAnimals',
    'sayItAgain', 'prevAnimal', 'nextAnimal', 'audioOff', 'micUnavailable',
  ];

  it('has identical keys across all three languages', () => {
    const enKeys = Object.keys(UI_STRINGS.en).sort();
    expect(Object.keys(UI_STRINGS.uk).sort()).toEqual(enKeys);
    expect(Object.keys(UI_STRINGS.es).sort()).toEqual(enKeys);
  });

  it('has all required string keys', () => {
    for (const key of keys) {
      expect(UI_STRINGS.en).toHaveProperty(key);
      expect(UI_STRINGS.uk).toHaveProperty(key);
      expect(UI_STRINGS.es).toHaveProperty(key);
    }
  });

  it('has non-empty values for every key in every language', () => {
    for (const lang of ['en', 'uk', 'es'] as Language[]) {
      for (const key of keys) {
        const val = UI_STRINGS[lang][key];
        expect(typeof val).toBe('string');
        expect((val as string).trim().length).toBeGreaterThan(0);
      }
    }
  });
});
