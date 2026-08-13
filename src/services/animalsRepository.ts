import type { Animal } from '../domain/animal';
import { type LocalizedAnimalData, resolveAnimals } from '../domain/animal';
import { LANGUAGES, type Language } from '../domain/language';

export interface AnimalsRepository {
  loadAnimals(): Promise<Animal[]>;
  loadLocalizedAnimals(): Promise<LocalizedAnimalData[]>;
}

interface RawAnimal {
  id?: unknown;
  name?: unknown;
  image?: unknown;
  soundWord?: unknown;
  acceptedAnswers?: unknown;
  learnPhrase?: unknown;
  quizPrompt?: unknown;
}

interface RawTranslation {
  name?: unknown;
  soundWord?: unknown;
  acceptedAnswers?: unknown;
  learnPhrase?: unknown;
  quizPrompt?: unknown;
}

interface RawLocalizedAnimal {
  id?: unknown;
  image?: unknown;
  translations?: unknown;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

/** Validate + normalize one raw metadata entry; returns null if invalid (skipped). */
export function parseAnimal(raw: RawAnimal): Animal | null {
  if (!isNonEmptyString(raw.id)) return null;
  if (!isNonEmptyString(raw.name)) return null;
  if (!isNonEmptyString(raw.image)) return null;
  if (!isNonEmptyString(raw.soundWord)) return null;
  if (!Array.isArray(raw.acceptedAnswers)) return null;
  const acceptedAnswers = raw.acceptedAnswers
    .filter(isNonEmptyString)
    .map((a) => a.toLowerCase().trim());
  if (acceptedAnswers.length === 0) return null;

  return {
    id: raw.id,
    name: raw.name,
    image: raw.image,
    soundWord: raw.soundWord,
    acceptedAnswers,
    ...(isNonEmptyString(raw.learnPhrase) ? { learnPhrase: raw.learnPhrase } : {}),
    ...(isNonEmptyString(raw.quizPrompt) ? { quizPrompt: raw.quizPrompt } : {}),
  };
}

/** Filter to valid animals, dropping duplicates by id (first wins). */
export function parseAnimals(rawList: unknown): Animal[] {
  if (!Array.isArray(rawList)) return [];
  const seen = new Set<string>();
  const out: Animal[] = [];
  for (const raw of rawList) {
    const animal = parseAnimal(raw as RawAnimal);
    if (!animal || seen.has(animal.id)) continue;
    seen.add(animal.id);
    out.push(animal);
  }
  return out;
}

function parseTranslation(raw: unknown): import('../domain/animal').LocalizedTranslation | null {
  const r = raw as RawTranslation;
  if (!isNonEmptyString(r.name)) return null;
  if (!isNonEmptyString(r.soundWord)) return null;
  if (!Array.isArray(r.acceptedAnswers)) return null;
  const acceptedAnswers = (r.acceptedAnswers as unknown[])
    .filter(isNonEmptyString)
    .map((a) => a.toLowerCase().trim());
  if (acceptedAnswers.length === 0) return null;
  return {
    name: r.name,
    soundWord: r.soundWord,
    acceptedAnswers,
    ...(isNonEmptyString(r.learnPhrase) ? { learnPhrase: r.learnPhrase } : {}),
    ...(isNonEmptyString(r.quizPrompt) ? { quizPrompt: r.quizPrompt } : {}),
  };
}

/** Validate and parse one localized animal entry; returns null if invalid. */
export function parseLocalizedAnimal(raw: unknown): LocalizedAnimalData | null {
  const r = raw as RawLocalizedAnimal;
  if (!isNonEmptyString(r.id)) return null;
  if (!isNonEmptyString(r.image)) return null;
  if (typeof r.translations !== 'object' || r.translations === null) return null;
  const rawTrans = r.translations as Record<string, unknown>;
  if (!rawTrans['en']) return null;
  const enTranslation = parseTranslation(rawTrans['en']);
  if (!enTranslation) return null;

  const translations: Partial<Record<Language, import('../domain/animal').LocalizedTranslation>> = {
    en: enTranslation,
  };
  // Derived from LANGUAGES (minus the required 'en' handled above) so a newly added
  // language's translations are never silently dropped by a stale hand-written list.
  for (const { code } of LANGUAGES) {
    if (code === 'en') continue;
    if (rawTrans[code]) {
      const t = parseTranslation(rawTrans[code]);
      if (t) translations[code] = t;
    }
  }

  return { id: r.id, image: r.image, translations };
}

/** Filter to valid localized animals, dropping duplicates by id (first wins). */
export function parseLocalizedAnimals(rawList: unknown): LocalizedAnimalData[] {
  if (!Array.isArray(rawList)) return [];
  const seen = new Set<string>();
  const out: LocalizedAnimalData[] = [];
  for (const raw of rawList) {
    const animal = parseLocalizedAnimal(raw);
    if (!animal || seen.has(animal.id)) continue;
    seen.add(animal.id);
    out.push(animal);
  }
  return out;
}

/** Loads and validates public/assets/animals.json. Returns a possibly-empty list. */
export class HttpAnimalsRepository implements AnimalsRepository {
  constructor(private readonly url = 'assets/animals.json') {}

  async loadLocalizedAnimals(): Promise<LocalizedAnimalData[]> {
    try {
      const res = await fetch(this.url);
      if (!res.ok) return [];
      const json: unknown = await res.json();
      return parseLocalizedAnimals(json);
    } catch {
      return [];
    }
  }

  async loadAnimals(): Promise<Animal[]> {
    const localized = await this.loadLocalizedAnimals();
    return resolveAnimals(localized, 'en');
  }
}
