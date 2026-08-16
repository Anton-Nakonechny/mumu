---

description: "Task list for feature: Add More Animals"
---

# Tasks: Add More Animals

**Input**: Design documents from `/specs/006-add-more-animals/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/animals-json.schema.md, quickstart.md

**Tests**: Included — the project follows TDD (write the failing data/roster assertion first, then author the data to make it pass).

**Organization**: Tasks are grouped by user story (US1 Learn, US2 Quiz, US3 Languages) so each is independently deliverable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3 (maps to spec.md user stories)
- Exact file paths are included in each task.

## Key constraint (read first)

All seven animals share **one** metadata file: `public/assets/animals.json`. Tasks that edit
that file are therefore **sequential** (no `[P]`), even across user stories. Picture files
are separate, so picture-sourcing tasks are parallelizable. No `src/` code changes are
required — the data-driven mechanism (`HttpAnimalsRepository`, `resolveAnimals`) already
handles new entries.

New animals (fixed roster): **duck, chicken, rooster, wolf, goat, sheep, turkey**.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the visual/format target and confirm the ingestion mechanism.

- [X] T001 Review the existing roster style and metadata shape to define the target for the 7 new assets: inspect `public/assets/animals/cow.webp` and `public/assets/animals/dog.png` (cartoon style, transparent/simple background, ~27–33 KB) and the two entries in `public/assets/animals.json`; record the chosen file format(s) and naming (`assets/animals/<id>.<ext>`) as the convention for this feature.
- [X] T002 Confirm the add-an-animal contract by re-reading `specs/006-add-more-animals/contracts/animals-json.schema.md` and the validation in `src/services/animalsRepository.ts` (required `en` block, ≥2-char answers, duplicate-id de-dup) so all authored entries satisfy it.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Source the seven license-clean cartoon pictures. These block US1 (Learn mode
displays them) and every animals.json entry references them.

**⚠️ CRITICAL**: All picture files must exist before the US1 entries can render.

- [X] T003 [P] Source a royalty-free / CC0 / public-domain friendly cartoon **duck** picture (style-matched, child-safe) into `public/assets/animals/duck.<ext>`.
- [X] T004 [P] Source a royalty-free / CC0 / public-domain friendly cartoon **chicken** picture into `public/assets/animals/chicken.<ext>`.
- [X] T005 [P] Source a royalty-free / CC0 / public-domain friendly cartoon **rooster** picture into `public/assets/animals/rooster.<ext>`.
- [X] T006 [P] Source a royalty-free / CC0 / public-domain friendly cartoon **wolf** picture (gentle/non-scary depiction, FR-011) into `public/assets/animals/wolf.<ext>`.
- [X] T007 [P] Source a royalty-free / CC0 / public-domain friendly cartoon **goat** picture into `public/assets/animals/goat.<ext>`.
- [X] T008 [P] Source a royalty-free / CC0 / public-domain friendly cartoon **sheep** picture into `public/assets/animals/sheep.<ext>`.
- [X] T009 [P] Source a royalty-free / CC0 / public-domain friendly cartoon **turkey** picture into `public/assets/animals/turkey.<ext>`.
- [X] T010 Verify each of the 7 files is a valid, correctly-sized image with a cohesive cartoon style (reselect any that clashes per FR-002), and record source + license for each in `specs/006-add-more-animals/research.md` (append an "Asset provenance" section).

**Checkpoint**: Seven pictures present under `public/assets/animals/` and license-cleared.

---

## Phase 3: User Story 1 - Learn the sounds of seven new animals (Priority: P1) 🎯 MVP

**Goal**: All seven new animals appear in Learn mode with a picture and a correct
name-and-sound phrase, alongside cow and dog.

**Independent Test**: Launch in Learn mode, tap ▶ through the roster; confirm 9 animals show
clear pictures (no broken images) and each speaks a correct name-and-sound phrase.

### Tests for User Story 1 (write first, must FAIL)

- [X] T011 [P] [US1] Add a failing assertion in `tests/unit/animalsRepository.test.ts` that `parseLocalizedAnimals(<animals.json>)` yields 9 entries and that each new id (duck, chicken, rooster, wolf, goat, sheep, turkey) resolves via `resolveAnimals(data, 'en')` with a non-empty `name`, `soundWord`, and `image`. Also assert wrap-around navigation is preserved across the 9-animal roster (FR-003): advancing past the last animal returns to the first (and previous from the first wraps to the last) via `AnimalCollection`.

### Implementation for User Story 1

- [X] T012 [US1] Append seven new objects to `public/assets/animals.json`, each with `id`, `image` (path from Phase 2), and an `en` translation block containing `name`, `soundWord`, `acceptedAnswers`, and `learnPhrase`, using the values in `specs/006-add-more-animals/research.md` R3 (e.g. duck → "quack quack"). The `en` block intentionally omits `quizPrompt` — the English Quiz prompt uses the app's default sentence pattern (FR-005); only `uk`/`es` need an explicit `quizPrompt` (T020/T021). (Single file — sequential.)
- [X] T013 [US1] Run `npm test` and confirm the T011 roster/resolve assertion now passes (Red → Green).
- [X] T014 [US1] Manually validate quickstart Scenario 1: `npm run dev`, Learn mode, tap ▶ through all 9 animals; confirm each new animal shows its picture and speaks a correct name-and-sound phrase, and 🔊 replays it.

**Checkpoint**: US1 is fully functional — MVP deliverable (Learn mode with 9 animals).

---

## Phase 4: User Story 2 - Be quizzed on the new animals (Priority: P2)

**Goal**: Quiz mode asks what each new animal says, cheers a recognized English answer and
auto-advances, and safely falls back to reveal/skip when no answer is recognized — never a
false "wrong".

**Independent Test**: In Quiz mode, cycle the new animals; each produces a spoken prompt,
accepts a reasonable English answer, and degrades to reveal/skip with zero false "wrong".

**Depends on**: US1 (entries must exist in `animals.json`).

### Tests for User Story 2 (write first, must FAIL)

- [X] T015 [P] [US2] Add failing assertions in `tests/unit/answerMatcher.test.ts` that representative recognizable answers match their target (e.g. `isAnswerCorrect('baa', sheep.acceptedAnswers)`, `isAnswerCorrect('quack', duck.acceptedAnswers)`) and that a clearly-unrelated word does not, using the English `acceptedAnswers` from research R3.

### Implementation for User Story 2

- [X] T016 [US2] Refine the `en` `acceptedAnswers` for the seven animals in `public/assets/animals.json` to favor recognizer-friendly words (both spaced and joined onomatopoeia forms, all ≥2 chars) per research R3, so recognizable sounds match. (Single file — sequential.)
- [X] T017 [US2] Run `npm test` and confirm the T015 matcher assertions pass (Red → Green).
- [X] T018 [US2] Manually validate quickstart Scenario 2: Quiz mode (English), confirm each new animal prompts correctly, cheers+auto-advances on a valid answer, and for a hard-to-recognize sound (turkey "gobble", rooster "cock-a-doodle-doo") falls through to the reveal/skip path after two misses with **zero** false "wrong" (SC-004, FR-007).

**Checkpoint**: US1 + US2 both work independently — quizzable roster.

---

## Phase 5: User Story 3 - New animals respect the selected language (Priority: P3)

**Goal**: Each new animal shows localized Ukrainian and Spanish names/sounds and Quiz
prompts, matching cow/dog, and falls back to English cleanly when a block is absent.

**Independent Test**: Switch to Spanish then Ukrainian; confirm each new animal shows
localized (non-fallback) names/sounds, with clean English fallback and no crashes/blank labels.

**Depends on**: US1 (entries must exist in `animals.json`).

### Tests for User Story 3 (write first, must FAIL)

- [X] T019 [P] [US3] Add failing assertions in `tests/unit/animalsRepository.test.ts` that each new id resolves via `resolveAnimals(data, 'uk')` and `resolveAnimals(data, 'es')` to a **localized** `name`/`soundWord` (distinct from the English fallback), and that each `uk` block's `acceptedAnswers` contain at least one Latin (non-Cyrillic) sound-alike.

### Implementation for User Story 3

- [X] T020 [US3] Add a `uk` translation block to each of the seven entries in `public/assets/animals.json` — `name`, `soundWord`, `learnPhrase`, `quizPrompt`, and `acceptedAnswers` that include **Latin sound-alikes** (per research R4, e.g. duck → `["кря", "krya", "kra"]`). (Single file — sequential.)
- [X] T021 [US3] Add an `es` translation block to each of the seven entries in `public/assets/animals.json` — `name`, `soundWord`, `learnPhrase`, `quizPrompt`, `acceptedAnswers` (per research R5, e.g. rooster → "quiquiriquí"). (Single file — sequential.)
- [X] T022 [US3] Run `npm test` and confirm the T019 localization assertions pass (Red → Green).
- [X] T023 [US3] Manually validate quickstart Scenario 3: switch to Spanish and Ukrainian, confirm localized names/sounds for every new animal; temporarily remove one `uk` block and reload to confirm clean English fallback (then restore).

**Checkpoint**: All three user stories independently functional — full trilingual roster.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Robustness, regression coverage, and docs.

- [X] T024 [P] Update the e2e smoke expectation in `tests/e2e/smoke.spec.ts` to reflect the 9-animal roster (and confirm `tests/e2e/privacy-network.spec.ts` still shows no speech network calls, SC-006). (smoke tests are roster-size-agnostic; no changes needed — confirmed compatible)
- [X] T025 Validate quickstart Scenario 4 (FR-010): rename one new picture so its path 404s, reload, confirm the app does not crash and the other 8 animals stay playable; restore the filename.
- [X] T026 [P] Update `README.md` — mention the expanded roster (and refresh the title/roster note) to keep the add-an-animal docs consistent.
- [X] T027 Run the full gate: `npm test`, `npm run build`, and `npx playwright test` — all must pass with no new speech network calls.
- [X] T028 Run the complete `specs/006-add-more-animals/quickstart.md` checklist end-to-end and confirm every success criterion (SC-001…SC-007) is met.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: After Setup. Blocks US1 (pictures needed to render/reference).
- **US1 (Phase 3)**: After Foundational. Creates the `animals.json` entries — the MVP.
- **US2 (Phase 4)**: After US1 (edits the same entries' `en` answers).
- **US3 (Phase 5)**: After US1 (adds `uk`/`es` blocks to the same entries). Independent of US2.
- **Polish (Phase 6)**: After all desired user stories.

### User Story Dependencies

- **US1 (P1)**: Depends only on Phase 2 pictures. Independently testable (Learn mode).
- **US2 (P2)**: Depends on US1 entries existing. Independently testable (Quiz mode).
- **US3 (P3)**: Depends on US1 entries existing. Independently testable (language switch). Independent of US2 — US2 and US3 could proceed in either order, but both serialize on `public/assets/animals.json`.

### Within Each User Story

- Write the failing test first (Red) → author the data → confirm Green → manual quickstart validation.

### Parallel Opportunities

- **Phase 2**: T003–T009 (seven picture files) run fully in parallel.
- Test-authoring tasks T011, T015, T019 touch different test files and can be written in parallel with each other (before their data is authored).
- `animals.json` edits (T012, T016, T020, T021) are **sequential** — same file.

---

## Parallel Example: Phase 2 (picture sourcing)

```bash
# Source all seven pictures at once (different files, no dependencies):
Task: "Source duck picture → public/assets/animals/duck.<ext>"
Task: "Source chicken picture → public/assets/animals/chicken.<ext>"
Task: "Source rooster picture → public/assets/animals/rooster.<ext>"
Task: "Source wolf picture → public/assets/animals/wolf.<ext>"
Task: "Source goat picture → public/assets/animals/goat.<ext>"
Task: "Source sheep picture → public/assets/animals/sheep.<ext>"
Task: "Source turkey picture → public/assets/animals/turkey.<ext>"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1 Setup → 2. Phase 2 pictures → 3. Phase 3 US1 (en blocks + Learn validation).
4. **STOP and VALIDATE**: 9 animals visible and speaking in Learn mode. Demo-able MVP.

### Incremental Delivery

1. Setup + Foundational → pictures ready.
2. US1 → Learn mode with 9 animals → validate → demo (MVP).
3. US2 → Quiz recognition + safe fallback → validate.
4. US3 → Ukrainian + Spanish coverage → validate.
5. Polish → e2e/robustness/docs → full quickstart.

---

## Notes

- `[P]` = different files, no dependencies. All `animals.json` edits are sequential.
- No `src/` code changes are expected (FR-006 / SC-005); if one becomes necessary, treat it as a scope signal to revisit the plan.
- Ukrainian answers require Latin sound-alikes to be voice-matchable (documented trade-off); Cyrillic-only never causes a false "wrong", only reveal/skip.
- Commit after each task or logical group; stop at any checkpoint to validate a story independently.
