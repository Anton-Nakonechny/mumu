import type { Language } from './language';

export interface LocalizedTranslation {
  name: string;
  soundWord: string;
  acceptedAnswers: string[];
  learnPhrase?: string;
  quizPrompt?: string;
}

export interface LocalizedAnimalData {
  id: string;
  image: string;
  translations: Partial<Record<Language, LocalizedTranslation>>;
}

/**
 * Resolve a localized animal entry to a single-language Animal.
 * Falls back to 'en' if the requested language is absent. Returns null if
 * neither the requested language nor the English fallback is valid.
 */
export function resolveAnimal(data: LocalizedAnimalData, lang: Language): Animal | null {
  const translation = data.translations[lang] ?? data.translations['en'];
  if (!translation) return null;
  if (!translation.name || !translation.soundWord || !translation.acceptedAnswers?.length) return null;
  return {
    id: data.id,
    name: translation.name,
    image: data.image,
    soundWord: translation.soundWord,
    acceptedAnswers: translation.acceptedAnswers,
    ...(translation.learnPhrase ? { learnPhrase: translation.learnPhrase } : {}),
    ...(translation.quizPrompt ? { quizPrompt: translation.quizPrompt } : {}),
  };
}

/** Resolve all localized animals, dropping entries that produce null. */
export function resolveAnimals(data: LocalizedAnimalData[], lang: Language): Animal[] {
  const out: Animal[] = [];
  for (const entry of data) {
    const animal = resolveAnimal(entry, lang);
    if (animal) out.push(animal);
  }
  return out;
}

/** One playable animal (validated, normalized form used across the app). */
export interface Animal {
  id: string;
  name: string;
  image: string;
  soundWord: string;
  /** Lowercased accepted spoken answers used by the answer matcher. */
  acceptedAnswers: string[];
  learnPhrase?: string;
  quizPrompt?: string;
}

/** Sentence spoken in Learn mode, e.g. "The cow says muuuu". */
export function learnPhraseFor(animal: Animal): string {
  return animal.learnPhrase ?? `The ${animal.name} says ${animal.soundWord}`;
}

/** Question asked in Quiz mode, e.g. "What does the cow say?". */
export function quizPromptFor(animal: Animal): string {
  return animal.quizPrompt ?? `What does the ${animal.name} say?`;
}

/**
 * Ordered, looping set of animals for a session. Navigation wraps around so the
 * child never reaches a dead end (FR-015).
 */
export class AnimalCollection {
  private index: number;

  constructor(private readonly animals: Animal[], initialIndex = 0) {
    this.index = animals.length > 0 ? Math.min(Math.max(initialIndex, 0), animals.length - 1) : 0;
  }

  get isEmpty(): boolean {
    return this.animals.length === 0;
  }

  get size(): number {
    return this.animals.length;
  }

  get currentIndex(): number {
    return this.index;
  }

  /** Current animal, or undefined when the collection is empty. */
  current(): Animal | undefined {
    return this.animals[this.index];
  }

  /** Advance to the next animal, wrapping from the last back to the first. */
  next(): Animal | undefined {
    if (this.isEmpty) return undefined;
    this.index = (this.index + 1) % this.animals.length;
    return this.current();
  }

  /** Go to the previous animal, wrapping from the first back to the last. */
  prev(): Animal | undefined {
    if (this.isEmpty) return undefined;
    this.index = (this.index - 1 + this.animals.length) % this.animals.length;
    return this.current();
  }
}
