# Research: Multi-Language Flag Selector

**Phase 0 output for branch** `004-language-flags`

## Decision 1 — Multilingual animal data format

**Decision**: Single `public/assets/animals.json` with a `translations` map nested inside each animal entry. The image path stays at the top level (shared across languages); all language-specific fields live under `translations.<langCode>`.

```json
[{
  "id": "cow",
  "image": "assets/animals/cow.avif",
  "translations": {
    "en": { "name": "cow", "soundWord": "moo", "acceptedAnswers": ["moo", "mooo", "muuu"] },
    "uk": { "name": "корова", "soundWord": "му", "acceptedAnswers": ["му", "муу", "муу", "мо"] },
    "es": { "name": "vaca", "soundWord": "mu", "acceptedAnswers": ["mu", "muu", "moo"] }
  }
}]
```

**Rationale**: One HTTP fetch loads all languages. Translations are co-located with their animal — easy to audit, easy to extend. No cache invalidation problem from multiple language-keyed files.

**Alternatives considered**:
- Separate `animals.en.json`, `animals.uk.json`, `animals.es.json`: requires a fetch per language switch or eager pre-fetch of all three. Adds request overhead and branch complexity in the repository.
- Flat fields (`name_uk`, `name_es`): unstructured, breaks existing `parseAnimal` typing, harder to add a fourth language.

---

## Decision 2 — TTS language selection

**Decision**: Set `SpeechSynthesisUtterance.lang` on every utterance. Extend `TtsService.speak()` to accept an optional `lang` string (BCP-47). `WebSpeechTtsService` applies it directly; if absent it defaults to the browser locale.

BCP-47 tags used:
| Language   | Code | TTS tag   |
|------------|------|-----------|
| Ukrainian  | `uk` | `uk-UA`   |
| Spanish    | `es` | `es-ES`   |
| English    | `en` | `en-US`   |

Voice selection: after `synth.getVoices()` loads, prefer a voice whose `.lang` starts with the target code; fall back to the browser default. If no Ukrainian/Spanish voice is installed, the browser uses its default voice (acceptable per FR-008 — a wrong-language voice is not a crash).

**Rationale**: Native browser API, zero dependencies. `SpeechSynthesisUtterance.lang` is well-supported across Chrome, Firefox, Safari.

**Alternatives considered**:
- Hard-coding a voice name: brittle across OS/browser combinations.
- Third-party TTS API: adds network dependency, privacy concern, cost.

---

## Decision 3 — Speech recognition for non-English languages

**Decision**: Add a second recognition service, `WebSpeechRecognitionService`, that wraps the browser's built-in `SpeechRecognition` / `webkitSpeechRecognition` API. Set `recognition.lang` to the BCP-47 tag for the active language. Keep `OnDeviceRecognitionService` (Vosk, English-only) for English. `App.tsx` instantiates the service that matches the active language:
- `en` → `OnDeviceRecognitionService` (on-device, private)
- `uk` / `es` → `WebSpeechRecognitionService` (cloud, browser-native)

Both implement the existing `RecognitionService` interface unchanged. When `SpeechRecognition` is unavailable (browser doesn't support it), `WebSpeechRecognitionService.isAvailable()` returns `false` and quiz mode degrades to reveal-after-two-misses (FR-008).

**Rationale**: `SpeechRecognition` supports `uk-UA` and `es-ES` in Chrome and Safari. It does involve cloud processing — a documented trade-off for non-English, but acceptable: the current Vosk-only approach already fails silently for non-English (no Vosk model exists for UA/ES), so this strictly improves the experience.

**Alternatives considered**:
- Vosk models for UA/ES: `vosk-model-small-uk` (~50 MB) and `vosk-model-small-es` are available. Impractical for a web app — too large to ship and too slow to download on mobile.
- Disable voice recognition for UA/ES entirely: simpler but contradicts FR-006. Graceful degradation is a fallback, not the default design.

---

## Decision 4 — UI strings (i18n approach)

**Decision**: Lightweight TypeScript constant object in `src/domain/language.ts`. No external i18n library.

```ts
export const UI_STRINGS = {
  en: { learn: 'Learn', quiz: 'Quiz', listen: 'Listen', loading: 'Loading animals…', … },
  uk: { learn: 'Навчання', quiz: 'Вікторина', listen: 'Слухати', loading: 'Завантаження…', … },
  es: { learn: 'Aprender', quiz: 'Quiz', listen: 'Escuchar', loading: 'Cargando…', … },
} as const;
```

Components receive a `strings: typeof UI_STRINGS['en']` prop. No dynamic imports, no plural forms needed at this scale.

**Rationale**: 3 languages × ~12 strings = 36 string values. An i18n library (i18next, react-intl) adds ≥ 15 kB and a mental model for zero benefit. The type system enforces exhaustiveness — missing a key in any language is a compile error.

**Alternatives considered**:
- `react-i18next`: industry standard for larger apps. Overkill here; adds runtime overhead and configuration complexity.
- Inline ternaries per language in JSX: unreadable, not maintainable across 3 languages.

---

## Decision 5 — Language state and persistence

**Decision**: Language state lives in `App` component, initialized from `localStorage` (key: `'mumu-language'`), defaulting to `'uk'`. Passed as props to child components — no React Context needed given the 3-level component tree.

Persistence: new `LanguageStore` service wraps `localStorage.getItem` / `setItem`. Isolated for testability. Validation on read: if stored value is not `'en' | 'uk' | 'es'`, return `'uk'`.

**Rationale**: Context adds indirection without benefit at this tree depth. localStorage is the spec-required mechanism (FR-007, Assumptions section). Defaulting to `'uk'` satisfies FR-002.

**Alternatives considered**:
- `sessionStorage`: doesn't persist across tabs/sessions (Story 3 would fail).
- URL query parameter: works across sessions only if bookmarked; not child-friendly.
- React Context: adds provider wrapping and extra indirection for a single scalar value.

---

## Decision 6 — Animal resolution from localized data

**Decision**: Load `LocalizedAnimalData[]` once (on app start). Cache in a ref. When language changes, call a pure function `resolveAnimals(localized, lang)` that maps each `LocalizedAnimalData` to `Animal` using the active language's translation (falling back to English if a translation is missing). The current `Animal` type is unchanged — it remains the runtime view.

The repository grows a `loadLocalizedAnimals(): Promise<LocalizedAnimalData[]>` method. The existing `loadAnimals()` is kept for backward compatibility in existing tests (delegates to `loadLocalizedAnimals` with `'en'`).

**Rationale**: Separates concerns — data loading vs. language resolution. Resolution is a pure function, easy to unit-test. No re-fetch on language switch.

**Alternatives considered**:
- Modifying `loadAnimals()` to accept a `lang` parameter and re-fetch on each switch: wasteful (extra network requests) and breaks existing test contracts.
- Storing the localized data in a global singleton: testability concern.

---

## Decision 7 — Flag selector placement and accessibility

**Decision**: `LanguageSelector` renders as a fixed row of three large flag buttons above the `ModeToggle`. Buttons use `role="radio"` inside a `role="radiogroup"` (semantically a single-select group). Active button has `aria-checked="true"`. Minimum tap target: 48 × 48 px (WCAG 2.5.5). Flag emoji acts as the label; a screen-reader-only `aria-label` provides the language name.

**Rationale**: Flags are immediately recognizable to children and parents. Radio semantics communicate single-select state to assistive tech. Placement above mode toggle makes it persistently visible in both modes without layout shift.

**Alternatives considered**:
- Dropdown/select: hidden behind a tap, violates SC-001 ("under 2 taps").
- Tabs pattern: correct semantics but heavier visual weight.
- Placement in a header bar: would require layout restructuring; the app currently has no header.

---

## Cheers localization

**Decision**: The `CHEERS` array in `domain/cheers.ts` becomes a record keyed by language:

```ts
export const CHEERS: Record<Language, readonly string[]> = {
  en: ['Yay! Great job!', 'Woohoo! Well done!', …],
  uk: ['Чудово!', 'Молодець!', 'Ура! Правильно!', …],
  es: ['¡Muy bien!', '¡Genial!', '¡Bravo!', …],
};
```

`nextCheer(lang, previous?)` gains a `lang` parameter. All callers that currently pass no language will continue to work with `'en'` as default. QuizMode passes the active language.

**Rationale**: Spoken cheers must be in the active language (FR-004). English cheers played in Ukrainian mode would be jarring and confusing for children.
