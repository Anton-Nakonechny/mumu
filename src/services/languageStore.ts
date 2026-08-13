import { DEFAULT_LANGUAGE, LANGUAGES, type Language } from '../domain/language';

// Derived from LANGUAGES so adding a language can't silently reset a stored choice.
const VALID_LANGUAGES = new Set<string>(LANGUAGES.map((l) => l.code));
const STORAGE_KEY = 'mumu-language';

export interface LanguageStore {
  load(): Language;
  save(lang: Language): void;
}

export class LocalStorageLanguageStore implements LanguageStore {
  load(): Language {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && VALID_LANGUAGES.has(stored)) return stored as Language;
    } catch {
      // Private browsing or storage blocked — fall through to default
    }
    return DEFAULT_LANGUAGE;
  }

  save(lang: Language): void {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Swallow silently — persistence is best-effort
    }
  }
}
