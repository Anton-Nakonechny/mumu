# Phase 1 Data Model: Fix Multilingual Quiz

This feature adds no persistent database. The "data" here is in-memory/config: the string tables, the accepted-answer sets already in `animals.json`, and the recognizer-model registry. Entities below map directly to the spec's Key Entities.

---

## Entity: Language

Existing (`src/domain/language.ts`). Unchanged shape.

| Field | Type | Notes |
|-------|------|-------|
| `code` | `'en' \| 'uk' \| 'es'` | Selected language identifier |
| `flag` | `string` | Emoji flag shown in the selector |
| `label` | `string` | Human name |
| `ttsLang` | `string` | BCP-47 tag for speech synthesis (e.g. `uk-UA`) |
| `speechLang` | `string` | BCP-47 tag; **no longer used for cloud recognition** after this feature (on-device models are language-keyed by `code`). May be retained for reference/TTS parity. |

Relationships: one selected `Language` drives (a) which per-language string table is used, (b) which per-language accepted answers `resolveAnimal` picks, and (c) which recognizer model is loaded.

---

## Entity: Localized feedback strings

Extends the existing per-language `UI_STRINGS` record. **New fields** added to `UiStrings` for every language:

| Field | Type | Meaning | Constraint |
|-------|------|---------|------------|
| `quizListening` | `string` | Interim/"listening…" line | Localized; no English |
| `quizCorrect` | `string` | Celebratory result line for a correct answer | Localized; no English |
| `quizTryAgain` | `string` | Gentle "say it again" nudge after a miss | Localized; no English |
| `quizRevealed` | `string` | Reveal template containing the placeholder `{sound}` | Localized sentence; the placeholder is replaced with the animal's localized `soundWord` (FR-002) |
| `micUnavailable` | `string` | **Existing**, already localized | MUST be preserved unchanged (FR-003) |

Validation / rules:
- Every `Language` MUST define all four new fields (enforced by the `Record<Language, UiStrings>` type — missing keys fail `tsc`).
- `quizRevealed` MUST contain exactly one `{sound}` placeholder and no fixed English scaffolding around it.
- English values reproduce the current hard-coded strings verbatim so English behavior is unchanged (FR-009).

State: none (pure lookup by current language).

---

## Entity: Accepted answers

Existing per-animal, per-language arrays in `public/assets/animals.json`, resolved to `Animal.acceptedAnswers` by `resolveAnimal()`. **No schema change.** This feature only changes how they are *compared* (script-aware normalization), not how they are authored or stored.

| Field | Type | Notes |
|-------|------|-------|
| `acceptedAnswers` | `string[]` | Native-script spoken words that count as correct (Cyrillic for uk, Latin for es/en) |
| `soundWord` | `string` | Localized canonical sound, substituted into `quizRevealed` |

Rules (enforced by the matcher, not the data):
- Comparison is within a single language only (the resolved animal already holds one language's answers) — no cross-language leakage (FR-006).
- Matching tolerates repeated letters, minor edits, and surrounding words (FR-005) in any script (FR-004).

---

## Entity: Recognizer capability / model registry

New in-memory config in `src/services/speechRecognition.ts`.

| Field | Type | Meaning |
|-------|------|---------|
| `MODEL_URLS` | `Record<Language, string>` | Same-origin URL of each language's bundled Vosk `.tar.gz` model |
| (per service) `lang` | `Language` | The language this service instance recognizes |
| (per service) `model` | `VoskModel \| null` | Lazily loaded, `null` until ready or on failure |
| (module) session cache | `Map<Language, VoskModel>` | Parsed models reused within a session (FR-013) |

Derived capability state (consumed by `QuizMode`):

| State | Condition | UI outcome |
|-------|-----------|-----------|
| `available` | permission `granted` **and** model loaded for the selected language | Listens on-device |
| `unavailable` | permission not granted, model missing/failed, or still loading | Localized `micUnavailable` notice + reveal/advance (FR-008, FR-012) |

Invariants:
- A service for language L MUST only ever load `MODEL_URLS[L]`; it MUST NOT fall back to another language's model (FR-007, FR-012).
- Models are same-origin static assets so the service worker persists them across restarts (FR-014).
- Audio and transcripts never leave the device (FR-011) — enforced by using only the WASM recognizer path (no Web Speech / cloud).

---

## Entity relationships (summary)

```
Language (selected)
  ├── selects → Localized feedback strings  (UI_STRINGS[lang])
  ├── narrows → Accepted answers            (resolveAnimal(data, lang).acceptedAnswers)
  └── selects → Recognizer model            (MODEL_URLS[lang] → OnDeviceRecognitionService)

QuizMode
  ├── reads   → feedback strings  → Feedback.tsx
  ├── calls   → matcher(transcript, acceptedAnswers)   [script-aware]
  └── calls   → recognition.isAvailable()/listenOnce() [per-language on-device]
```
