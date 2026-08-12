import type { Animal } from '../domain/animal';

export interface AnimalsRepository {
  loadAnimals(): Promise<Animal[]>;
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

/** Loads and validates public/assets/animals.json. Returns a possibly-empty list. */
export class HttpAnimalsRepository implements AnimalsRepository {
  constructor(private readonly url = 'assets/animals.json') {}

  async loadAnimals(): Promise<Animal[]> {
    try {
      const res = await fetch(this.url);
      if (!res.ok) return [];
      const json: unknown = await res.json();
      return parseAnimals(json);
    } catch {
      return [];
    }
  }
}
