# Phase 1 Data Model: Add More Animals

This feature adds **data only** — it introduces no new types. The existing shapes in
`src/domain/animal.ts` fully describe the new entries. This document specifies the concrete
data each new animal must supply and the validation rules that govern it.

## Entities

### LocalizedAnimalData (one JSON object per animal — reused, not modified)

| Field          | Type                                             | Required | Notes                                                    |
|----------------|--------------------------------------------------|----------|----------------------------------------------------------|
| `id`           | string (non-empty, unique)                       | yes      | Stable identifier, e.g. `"duck"`. Duplicates dropped (first wins). |
| `image`        | string (non-empty, relative path)                | yes      | e.g. `"assets/animals/duck.webp"`. Path only — any browser format. |
| `translations` | object keyed by language code (`en`/`uk`/`es`)   | yes      | Must contain a valid `en` block or the whole animal is dropped. |

### LocalizedTranslation (one block per language — reused, not modified)

| Field            | Type                       | Required | Notes                                                        |
|------------------|----------------------------|----------|--------------------------------------------------------------|
| `name`           | string (non-empty)         | yes      | Localized animal name (Learn label).                         |
| `soundWord`      | string (non-empty)         | yes      | Sound spoken/shown in Learn mode.                            |
| `acceptedAnswers`| string[] (≥1 non-empty)    | yes      | Lowercased & trimmed on load. Each ≥2 chars to be matchable. |
| `learnPhrase`    | string                     | no       | Overrides `"The {name} says {soundWord}"`.                   |
| `quizPrompt`     | string                     | no       | Overrides `"What does the {name} say?"`.                     |

## New instances (7)

Seven `LocalizedAnimalData` objects are appended to `public/assets/animals.json`, each with
`en`, `uk`, and `es` blocks (FR-009):

`duck`, `chicken`, `rooster`, `wolf`, `goat`, `sheep`, `turkey`.

Concrete `name` / `soundWord` / `acceptedAnswers` values are enumerated in
[research.md](./research.md) R3 (en), R4 (uk), R5 (es). Those tables are the authoring
source of truth; exact accepted-answer lists may be tuned during validation.

## Validation Rules (enforced by existing code)

1. **Required `en` block** — `parseLocalizedAnimal` returns `null` if the `en` block is
   missing or invalid (empty `name`/`soundWord` or no `acceptedAnswers`). Such an animal is
   silently dropped (edge case: "incomplete translation ⇒ drop, don't show broken").
2. **Per-language validity** — a non-`en` block that fails validation is skipped, and that
   language falls back to `en` at resolve time (FR-009 fallback safety).
3. **Answer normalization** — `acceptedAnswers` are lowercased/trimmed; empty strings are
   filtered out. A block whose answers all filter away is invalid.
4. **Matchable answers** — single-character targets are rejected by `answerMatcher`
   (`fuzzyEquals` / substring guards). Every accepted answer MUST be ≥2 characters.
5. **Ukrainian Latin requirement** — because `uk` runs on the English acoustic model, each
   `uk` block MUST include Latin sound-alike answers to be voice-matchable; Cyrillic-only
   answers are unmatchable by design (never a false "wrong" — falls through to reveal/skip).
6. **Uniqueness** — duplicate `id`s are de-duplicated (first occurrence wins), so new `id`s
   must not collide with `cow`/`dog` or each other.

## Relationships & State

- **Roster ordering**: `AnimalCollection` presents animals in `animals.json` order with
  wrap-around navigation; appending the seven keeps cow and dog first, new animals after.
- **No state transitions**: animals are immutable content. Session state (current index,
  quiz attempts) lives in existing components and is unaffected by adding entries.

## Impact Summary

- Roster size: 2 → 9 (SC-001).
- Types changed: none.
- Source files changed for core feature: none (data + assets only, FR-006 / SC-005).
