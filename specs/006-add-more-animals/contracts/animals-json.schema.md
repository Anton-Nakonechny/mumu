# Contract: `animals.json` new-animal entry

The app's external content contract is the `public/assets/animals.json` file consumed by
`HttpAnimalsRepository`. This feature adds entries; it does not change the contract shape.
An entry is accepted iff it satisfies the rules below (mirrors `parseLocalizedAnimal` /
`parseTranslation` in `src/services/animalsRepository.ts` and `resolveAnimal` in
`src/domain/animal.ts`).

## Entry shape

```jsonc
{
  "id": "duck",                          // required, non-empty, unique across the file
  "image": "assets/animals/duck.webp",    // required, non-empty relative path
  "translations": {                      // required object; MUST contain a valid "en"
    "en": {
      "name": "duck",                    // required, non-empty
      "soundWord": "quack quack",        // required, non-empty
      "acceptedAnswers": ["quack", "quack quack"]  // required, >=1 non-empty; each >=2 chars
      // "learnPhrase" / "quizPrompt" optional
    },
    "uk": {
      "name": "качка",
      "soundWord": "кря кря",
      "acceptedAnswers": ["кря", "krya", "kra"],   // MUST include Latin sound-alikes
      "learnPhrase": "Качка каже... кря-кря!",
      "quizPrompt": "Що каже качка?"
    },
    "es": {
      "name": "pato",
      "soundWord": "cuac cuac",
      "acceptedAnswers": ["cuac", "cuac cuac"],
      "learnPhrase": "El pato hace... ¡cuac cuac!",
      "quizPrompt": "¿Qué hace el pato?"
    }
  }
}
```

## Acceptance rules (contract)

| # | Rule | Consequence if violated |
|---|------|-------------------------|
| C1 | `id` is a non-empty string, unique in the file | Entry dropped, or later duplicate dropped |
| C2 | `image` is a non-empty string path | Entry dropped |
| C3 | `translations` is an object with a **valid `en`** block | Entry dropped entirely |
| C4 | Each provided block has non-empty `name`, `soundWord`, and ≥1 non-empty `acceptedAnswers` | That block skipped → language falls back to `en` |
| C5 | Every `acceptedAnswers` string is ≥2 chars after normalization | 1-char answers never match (rejected by matcher) |
| C6 | Each `uk` block includes Latin sound-alike answers | Cyrillic-only ⇒ unmatchable by voice (safe reveal/skip only) |
| C7 | `learnPhrase` / `quizPrompt` optional; when omitted, default sentences are generated | — |

## Post-condition (all 7 new entries added)

- `HttpAnimalsRepository.loadLocalizedAnimals()` returns 9 entries.
- `resolveAnimals(data, 'en' | 'uk' | 'es')` returns 9 non-null `Animal`s for each language
  (no entry drops), with localized (non-fallback) `name`/`soundWord` per language (SC-007).
- The roster navigates cow → dog → duck → chicken → rooster → wolf → goat → sheep → turkey
  with wrap-around.

## Verification

Automated: extend `tests/unit/animalsRepository.test.ts` to assert the parsed roster count
and that each new `id` resolves with a localized `uk`/`es` name (not the English fallback).
Manual: see [quickstart.md](../quickstart.md).
