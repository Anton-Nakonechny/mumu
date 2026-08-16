# Implementation Plan: Add More Animals

**Branch**: `006-add-more-animals` | **Date**: 2026-08-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-add-more-animals/spec.md`

## Summary

Grow the playable roster from 2 animals (cow, dog) to 9 by adding seven new ones —
duck, chicken, rooster, wolf, goat, sheep, turkey. Each new animal is delivered purely
as **data + assets**: a royalty-free cartoon picture in `public/assets/animals/` and a
trilingual (`en`/`uk`/`es`) entry in `public/assets/animals.json`. No changes to game
logic, navigation, scoring, or the recognition pipeline are required — the app is already
data-driven through `LocalizedAnimalData` (`src/domain/animal.ts`) and validated by
`HttpAnimalsRepository` (`src/services/animalsRepository.ts`). The two design-sensitive
areas are (1) sourcing seven license-clean, style-consistent pictures and (2) authoring
`acceptedAnswers` that the on-device recognizer can match, including **Latin sound-alikes**
for every Ukrainian block (a documented constraint — the UK session runs on the English
acoustic model).

## Technical Context

**Language/Version**: TypeScript 5.5, React 18.3 (ES modules)

**Primary Dependencies**: React / React-DOM; Vite 5 (build/dev); `vosk-browser` 0.0.8
(optional, on-device speech). No new runtime dependencies added by this feature.

**Storage**: Static files served from `public/` — `assets/animals.json` (metadata) and
`assets/animals/*` (picture assets). No database.

**Testing**: Vitest 2 + Testing Library (unit/component) and Playwright (e2e smoke +
privacy-network). New coverage is data-level (repository parse + resolve) and a roster
count assertion; no new test frameworks.

**Target Platform**: Modern mobile & desktop browsers in a secure context (HTTPS/localhost
for mic). Offline-capable via `public/sw.js`.

**Project Type**: Single-page web application (client-only; no backend).

**Performance Goals**: 60 fps navigation; adding seven images introduces no measurable
regression in load/navigation (SC-006). Original budget was set by the small existing
assets (dog ≈ 27 KB PNG); note the cow was later re-encoded from AVIF (~32 KB) to PNG
(≈ 302 KB), so cow.webp and chicken.png are now the two roster size outliers — see the
research Open Items.

**Constraints**: All speech stays on-device — no network calls for recognition and no
audio leaves the device (FR-008, SC-006). Child-appropriate imagery/sounds for ages ~2–6
(FR-011). Ukrainian Quiz matching only works with Latin sound-alikes (documented
trade-off). App must remain functional if a picture fails to load (FR-010).

**Scale/Scope**: +7 animals → 9 total. 7 new picture files, 7 new JSON objects (each with
3 language blocks). Zero source-code files changed for the core feature (documentation and
optionally a roster-count test may be touched).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution (`.specify/memory/constitution.md`) is an unratified template
with placeholder principles — it defines no enforceable gates. No constitutional
violations are therefore possible to assess. The team's active engineering conventions
that this feature respects instead:

- **Data-driven, no core-logic changes** (FR-006, SC-005): satisfied — new animals flow
  through the existing metadata mechanism. **PASS**
- **On-device / offline speech guarantee** (FR-008): unchanged — no recognition code or
  models touched. **PASS**
- **Graceful degradation & no false "wrong"** (FR-007, edge cases): inherited from
  existing Quiz behavior; new animals only supply data. **PASS**
- **TDD preference** (global user rule): data changes are validated by extending existing
  repository/roster tests before adding entries where a test is warranted. **PASS**

No entries required in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/006-add-more-animals/
├── plan.md              # This file (/speckit-plan command output)
├── spec.md              # Feature specification (input)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── animals-json.schema.md   # Metadata contract for a new animal entry
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created here)
```

### Source Code (repository root)

```text
public/assets/
├── animals.json                 # EDIT: append 7 new localized animal entries
└── animals/
    ├── cow.webp                  # existing (re-encoded from AVIF)
    ├── dog.png                  # existing
    ├── duck.webp                # ADD (royalty-free cartoon)
    ├── chicken.png              # ADD
    ├── rooster.png              # ADD
    ├── wolf.webp                # ADD
    ├── goat.webp                 # ADD
    ├── sheep.webp               # ADD
    └── turkey.png               # ADD

src/                             # NO CHANGES required for the core feature
├── domain/animal.ts             # LocalizedAnimalData / resolveAnimals (reused as-is)
├── services/animalsRepository.ts# parse + validate (reused as-is)
└── ...                          # components/services unchanged

tests/                           # optionally extend, no new files required
├── unit/animalsRepository.test.ts   # may add roster/parse assertions for new entries
└── e2e/smoke.spec.ts                # roster now shows 9 animals

README.md                        # UPDATE: title emoji + roster mention (optional polish)
```

**Structure Decision**: Single-project SPA. The feature is delivered entirely under
`public/assets/` (pictures + `animals.json`). The `src/` tree is intentionally untouched,
proving the data-driven contract (FR-006). Documentation lives under
`specs/006-add-more-animals/`.

## Complexity Tracking

> No Constitution Check violations — this section is intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| —         | —          | —                                    |
