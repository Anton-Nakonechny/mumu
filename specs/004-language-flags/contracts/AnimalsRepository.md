# Contract: AnimalsRepository (updated)

**File**: `src/services/animalsRepository.ts`

## Updated interface

```ts
export interface AnimalsRepository {
  loadAnimals(): Promise<Animal[]>;                          // existing — returns English animals
  loadLocalizedAnimals(): Promise<LocalizedAnimalData[]>;   // new
}
```

The existing `loadAnimals()` is kept unchanged so existing tests compile without modification. Internally it delegates to `loadLocalizedAnimals()` and resolves with `'en'`.

## HttpAnimalsRepository — updated

```ts
export class HttpAnimalsRepository implements AnimalsRepository {
  constructor(private readonly url = 'assets/animals.json') {}

  async loadLocalizedAnimals(): Promise<LocalizedAnimalData[]> { … }
  async loadAnimals(): Promise<Animal[]> {
    const localized = await this.loadLocalizedAnimals();
    return resolveAnimals(localized, 'en');
  }
}
```

## New pure functions (exported for tests)

```ts
/** Validate and parse one entry from the new animals.json shape. Returns null if invalid. */
export function parseLocalizedAnimal(raw: unknown): LocalizedAnimalData | null

/** Validate and parse the full array. Drops invalid/duplicate entries (first id wins). */
export function parseLocalizedAnimals(rawList: unknown): LocalizedAnimalData[]

/** Resolve one localized animal to a runtime Animal for the given language.
 *  Falls back to 'en' if the requested language's translation is absent.
 *  Returns null if even the English fallback is invalid. */
export function resolveAnimal(data: LocalizedAnimalData, lang: Language): Animal | null

/** Map the full localized list to runtime Animals for a language. Drops nulls. */
export function resolveAnimals(data: LocalizedAnimalData[], lang: Language): Animal[]
```

## Backward compatibility

The existing `parseAnimal()` and `parseAnimals()` functions remain exported so existing unit tests in `tests/unit/animalsRepository.test.ts` continue to pass. They now delegate internally or are kept alongside the new functions.

## animals.json shape change

The JSON format changes from a flat array to a localized array (see [data-model.md](../data-model.md)). This is a **breaking change to the data file** — must be applied atomically with the code change.
