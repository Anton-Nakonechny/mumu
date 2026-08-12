# Phase 1 Data Model: Animal Sounds Game

All data is in-memory (per session) or static content files. No database. Entities below map
to the pure `domain/` layer and the `animals.json` content file.

## Entity: Animal

One playable animal, sourced from a metadata entry paired with an image file.

| Field | Type | Rules / Notes |
|-------|------|---------------|
| `id` | string | Unique, non-empty. Stable identifier (e.g., `"cow"`). |
| `name` | string | Non-empty. Display/spoken name (e.g., `"cow"`). |
| `image` | string | Non-empty. Path/reference to a picture in `assets/animals/` that must load. |
| `soundWord` | string | Non-empty. Natural, TTS-pronounceable spelling used for both display and speech (e.g., `"moo"`, not `"muuuu"`) — see FR-002a. |
| `acceptedAnswers` | string[] | ≥1 entry, each non-empty, lowercased on load. Used by the matcher (e.g., `["muuu","moo","mooo"]`). |
| `learnPhrase` | string (derived) | Optional override; default composed as `"The {name} says {soundWord}"`. |
| `quizPrompt` | string (derived) | Optional override; default composed as `"What does the {name} say?"`. |

**Validation (on load, R6)**: entries missing `id`, `name`, `image`, `soundWord`, or a
non-empty `acceptedAnswers` are skipped (logged). Duplicate `id`s: first wins. An animal
whose `image` fails to load is treated as unavailable (edge case: "picture without a known
sound" / unreadable picture).

## Entity: Animal Collection

Ordered, looping set of valid animals for the session.

| Field / Op | Type | Rules / Notes |
|------------|------|---------------|
| `animals` | Animal[] | Order = order in `animals.json` (after filtering invalid). |
| `currentIndex` | number | 0-based; starts at 0. |
| `current()` | Animal | Current animal; undefined only if collection is empty. |
| `next()` | Animal | Advance with wrap-around to first after last (FR-015). |
| `prev()` | Animal | Go back with wrap-around to last before first. |
| `isEmpty` | boolean | True when no valid animals → triggers friendly empty state. |

**State transitions**: `next`/`prev` change `currentIndex` modulo `animals.length`. Empty
collection: all navigation is no-op; UI shows the empty-state message.

## Entity: Quiz Session

Tracks per-animal attempts and the 2-miss reveal rule (FR-008a) for Quiz mode.

| Field / Op | Type | Rules / Notes |
|------------|------|---------------|
| `mode` | `"learn" \| "quiz"` | Active mode (FR-010). |
| `attempts` | number | Misses on the *current* animal; resets to 0 on animal change or mode change. |
| `phase` | `"listening" \| "correct" \| "tryAgain" \| "revealed"` | Current quiz feedback state. |
| `registerResult(isMatch)` | → phase | Match → `correct`. Miss → increment `attempts`; if `attempts < 2` → `tryAgain`, else → `revealed` (reveal + speak correct sound, allow advance). |
| `onAnimalChange()` | — | Reset `attempts=0`, `phase="listening"`. |

**State transition summary (Quiz)**:

```
listening --match--> correct
listening --miss(attempts<2)--> tryAgain --(listen again)--> listening
listening --miss(attempts==2)--> revealed   (speak correct sound; child may advance)
any --animal change / mode change--> listening (attempts reset)
```

A "no speech detected" timeout counts as a miss (edge case, R2/spec).

## Content File: `animals.json` (contract)

Array of objects matching the Animal input fields (`id`, `name`, `image`, `soundWord`,
`acceptedAnswers`, optional `learnPhrase`/`quizPrompt`). Formal shape in
[`contracts/animals-metadata.schema.json`](./contracts/animals-metadata.schema.json).

## Relationships

- **Animal Collection → Animal**: 1..* (ordered, looping). Empty collection is valid → empty state.
- **Quiz Session → Animal**: references the collection's `current()`; attempts are per current animal.
- **Game Session** = Animal Collection (position) + Quiz Session (mode/attempts/phase) — the
  full current play state referenced in the spec's Key Entities.

## Requirement traceability

| Requirement | Data-model element |
|-------------|--------------------|
| FR-005 (author-editable roster) | `animals.json` + Animal validation |
| FR-007 (contains expected sound) | Animal.`acceptedAnswers` + matcher |
| FR-008a (reveal after 2 misses) | Quiz Session `attempts`/`registerResult` |
| FR-013 (lenient match) | Animal.`acceptedAnswers` (normalized) + matcher threshold |
| FR-015 (loop) | Animal Collection `next`/`prev` wrap-around |
