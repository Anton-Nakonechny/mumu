# Data Model: Multi-Language Flag Selector

**Phase 1 output for branch** `004-language-flags`

---

## Language (domain/language.ts — new file)

The canonical list of supported languages and all UI-visible strings.

```ts
export type Language = 'en' | 'uk' | 'es';

export interface LanguageConfig {
  code: Language;
  flag: string;        // emoji
  label: string;       // full English name (for aria-label)
  ttsLang: string;     // BCP-47 tag for SpeechSynthesisUtterance.lang
  speechLang: string;  // BCP-47 tag for SpeechRecognition.lang
}

export const LANGUAGES: readonly LanguageConfig[] = [
  { code: 'uk', flag: '🇺🇦', label: 'Ukrainian', ttsLang: 'uk-UA', speechLang: 'uk-UA' },
  { code: 'es', flag: '🇪🇸', label: 'Spanish',   ttsLang: 'es-ES', speechLang: 'es-ES' },
  { code: 'en', flag: '🇺🇸', label: 'English',   ttsLang: 'en-US', speechLang: 'en-US' },
];

export const DEFAULT_LANGUAGE: Language = 'uk';
```

### UI strings (UI_STRINGS)

Exhaustive per-language map of every visible UI string. TypeScript enforces the same keys exist in all three languages.

| Key              | en                         | uk                              | es                         |
|------------------|----------------------------|---------------------------------|----------------------------|
| `learn`          | Learn                      | Навчання                        | Aprender                   |
| `quiz`           | Quiz                       | Вікторина                       | Quiz                       |
| `listen`         | Listen                     | Слухати                         | Escuchar                   |
| `loading`        | Loading animals…           | Завантаження…                   | Cargando…                  |
| `noAnimals`      | No animals to play with yet. Add some pictures! | Немає тваринок. Додай картинки! | No hay animales. ¡Añade imágenes! |
| `sayItAgain`     | Say it again               | Ще раз                          | Otra vez                   |
| `prevAnimal`     | Previous animal            | Попередня тварина               | Animal anterior            |
| `nextAnimal`     | Next animal                | Наступна тварина                | Animal siguiente           |
| `audioOff`       | Audio is off — read it out loud! | Аудіо вимкнено — читайте вголос! | Audio desactivado — ¡léelo en voz alta! |
| `micUnavailable` | (existing Feedback copy)   | (UA equivalent)                 | (ES equivalent)            |

Full string values are defined in `src/domain/language.ts` (`UI_STRINGS` constant).

---

## LocalizedTranslation (domain/animal.ts — added type)

Per-language translation unit for one animal. Optional `learnPhrase` and `quizPrompt` allow override; if absent they are generated from `name` and `soundWord` using language-appropriate template strings.

```ts
export interface LocalizedTranslation {
  name: string;
  soundWord: string;
  acceptedAnswers: string[];   // lowercased, non-empty
  learnPhrase?: string;        // e.g., "Корова каже муу"
  quizPrompt?: string;         // e.g., "Що каже корова?"
}
```

---

## LocalizedAnimalData (domain/animal.ts — added type)

Raw shape of one animal entry in `public/assets/animals.json`. The `image` is shared across languages.

```ts
export interface LocalizedAnimalData {
  id: string;
  image: string;
  translations: Partial<Record<Language, LocalizedTranslation>>;
}
```

**Validation rules** (enforced by `parseLocalizedAnimal()` in `animalsRepository.ts`):
- `id` must be a non-empty string.
- `image` must be a non-empty string.
- `translations` must contain at least an `'en'` entry (English is the baseline; other languages fall back to English if missing).
- Each present translation must have non-empty `name`, `soundWord`, and at least one `acceptedAnswer`.

**Fallback rule**: If the active language's translation is absent, `resolveAnimal()` falls back to `'en'`. This prevents a crash if the JSON is partially translated.

---

## Animal (domain/animal.ts — unchanged runtime shape)

The existing `Animal` interface is the language-resolved view used by all components. No change to this type — it continues to represent a single animal in a single language.

```ts
// Existing — no modifications
export interface Animal {
  id: string;
  name: string;
  image: string;
  soundWord: string;
  acceptedAnswers: string[];
  learnPhrase?: string;
  quizPrompt?: string;
}
```

**Resolution**: `resolveAnimal(data: LocalizedAnimalData, lang: Language): Animal | null` is a pure function that picks the translation, applies fallback, and returns an `Animal` (or `null` if neither the requested language nor English translation is valid).

---

## LanguagePreference (services/languageStore.ts — new file)

Thin wrapper around `localStorage`. Not a domain entity — a service boundary.

| Attribute      | Value                          |
|----------------|-------------------------------|
| Storage        | `localStorage`                |
| Key            | `'mumu-language'`             |
| Value          | `Language` (`'en' \| 'uk' \| 'es'`) |
| Default        | `'uk'` (if absent or invalid) |

```ts
export interface LanguageStore {
  load(): Language;
  save(lang: Language): void;
}
```

---

## Cheers (domain/cheers.ts — extended)

`CHEERS` becomes a `Record<Language, readonly string[]>`. `nextCheer` gains a `lang` parameter.

```ts
export function nextCheer(lang: Language, previous?: string): string
```

Existing callers that omit `lang` are updated to pass the active language. The function's no-repeat guarantee is unchanged.

---

## Entity Relationships

```text
App (React component)
 ├── language: Language               ← initialized from LanguageStore
 ├── localizedAnimals: LocalizedAnimalData[]  ← loaded once from AnimalsRepository
 └── animals: Animal[]                ← derived: resolveAnimals(localizedAnimals, language)

LanguageConfig (lookup table)
 └── looked up via LANGUAGES.find(l => l.code === language)

Animal  (runtime, language-resolved)
 └── derived from LocalizedAnimalData + Language via resolveAnimal()
```

---

## animals.json restructured example

```json
[
  {
    "id": "cow",
    "image": "assets/animals/cow.webp",
    "translations": {
      "en": {
        "name": "cow",
        "soundWord": "moo",
        "acceptedAnswers": ["moo", "mooo", "muuu", "moooo", "mu"]
      },
      "uk": {
        "name": "корова",
        "soundWord": "муу",
        "acceptedAnswers": ["му", "муу", "мо", "муу"],
        "learnPhrase": "Корова каже... муу!",
        "quizPrompt": "Що каже корова?"
      },
      "es": {
        "name": "vaca",
        "soundWord": "mu",
        "acceptedAnswers": ["mu", "muu", "moo"],
        "learnPhrase": "La vaca hace... ¡mu!",
        "quizPrompt": "¿Qué hace la vaca?"
      }
    }
  },
  {
    "id": "dog",
    "image": "assets/animals/dog.png",
    "translations": {
      "en": {
        "name": "dog",
        "soundWord": "woof woof",
        "acceptedAnswers": ["woof", "woof woof", "bark", "bow wow", "ruff"]
      },
      "uk": {
        "name": "собака",
        "soundWord": "гав гав",
        "acceptedAnswers": ["гав", "гав гав", "ав"],
        "learnPhrase": "Собака каже... гав гав!",
        "quizPrompt": "Що каже собака?"
      },
      "es": {
        "name": "perro",
        "soundWord": "guau guau",
        "acceptedAnswers": ["guau", "guau guau", "au"],
        "learnPhrase": "El perro hace... ¡guau guau!",
        "quizPrompt": "¿Qué hace el perro?"
      }
    }
  }
]
```
