---
description: "Task list for Quiz Cheer & Auto-Advance"
---

# Tasks: Quiz Cheer & Auto-Advance

**Input**: Design documents from `/specs/002-quiz-cheer-advance/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/quiz-cheer-advance.md, quickstart.md

**Tests**: INCLUDED — the project follows TDD (user global preference; plan.md & quickstart.md mandate tests-first). Every implementation task is preceded by a failing test.

**Organization**: Tasks are grouped by user story. This feature is a small vertical slice extending existing Quiz mode; US1 and US2 both edit `src/components/QuizMode.tsx`, so US2 follows US1 (see Dependencies).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1 or US2 (setup/foundational/polish carry no story label)

## Path Conventions

Single-project frontend SPA. Source at `src/`, tests at `tests/` (repository root).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm a green baseline before changes (no new dependencies are required).

- [X] T001 Confirm branch `002-quiz-cheer-advance` is checked out and establish a green baseline by running `npm run test` and `npm run lint` from the repository root; record that the existing suite passes before any edits.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The pure cheer/timing module imported by BOTH user stories.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Write failing unit test in `tests/unit/cheers.test.ts` for the cheer picker: every `nextCheer(prev)` result is a member of `CHEERS`; given a `previous` and `CHEERS.length > 1`, the result never equals `previous` across many draws; a single-element `CHEERS` returns that element safely. Run `npm run test -- cheers` and confirm it FAILS (module absent).
- [X] T003 Implement `src/domain/cheers.ts` to satisfy T002: export `CHEERS` (non-empty `readonly string[]` of short, distinct, TTS-pronounceable celebratory phrases, e.g. "Yay! Great job!", "Woohoo! Well done!", "Awesome!"), `AUTO_ADVANCE_DELAY_MS = 2000`, and pure `nextCheer(previous?: string): string` honoring the no-immediate-repeat guarantee. Make `npm run test -- cheers` pass.

**Checkpoint**: Shared cheer module ready — US1 and US2 can build on it.

---

## Phase 3: User Story 1 - Hear a spoken cheer for a correct answer (Priority: P1) 🎯 MVP

**Goal**: On a recognized correct answer, Quiz mode speaks an enthusiastic cheer aloud (distinct from the neutral question), with a celebratory visual fallback when TTS is unavailable; misses and the 2-miss reveal never cheer.

**Independent Test**: In Quiz mode, answer correctly → hear a spoken cheer (`tts.speak` a `CHEERS` phrase) that does not overlap the next question; answer incorrectly → no cheer, existing "try again" plays; reach the 2-miss reveal → sound spoken but no cheer; disable TTS → celebratory text shown.

### Tests for User Story 1 ⚠️ (write first, must FAIL)

- [X] T004 [US1] Write failing component test in `tests/component/quizCheer.test.tsx` using a mocked `TtsService` with an awaitable `speak`: correct answer → `speak` called with an argument that **is a member of `CHEERS`** (the objective FR-002 distinctiveness assertion — celebratory-set membership, not just ≠ the quiz prompt) (contract C1); the next question is not spoken until the cheer promise resolves (C2 ordering); incorrect (single miss) → no cheer and existing try-again feedback (C6); second miss `revealed` → sound word spoken, no cheer (C7); TTS unavailable → celebratory correct-answer text rendered via `Feedback` (C8 visual). Run `npm run test -- quizCheer` and confirm it FAILS.

### Implementation for User Story 1

- [X] T005 [US1] Implement cheer-on-correct in `src/components/QuizMode.tsx`: when `QuizSession.registerResult` yields the `correct` phase, pick `nextCheer(prevCheerRef.current)` from `src/domain/cheers.ts`, store the choice in a `useRef` (for no-repeat), and `await tts.speak(cheer)`; ensure `tryAgain` and `revealed` paths speak no cheer (reveal keeps speaking only the sound word). Make C1/C2/C6/C7 green.
- [X] T006 [P] [US1] Verify/adjust the celebratory correct-answer copy in `src/components/Feedback.tsx` so the `correct` phase renders a clearly celebratory message that serves as the no-audio fallback (C8 visual); keep existing `data-testid="feedback"`.

**Checkpoint**: US1 delivers a spoken (or visual) cheer on every correct answer, independent of any auto-advance.

---

## Phase 4: User Story 2 - Automatically continue to the next animal (Priority: P2)

**Goal**: After the correct-answer cheer finishes, wait a short pause then auto-advance to the next animal hands-free; the pending advance is cancellable and never double-advances or fires after the child has left the animal.

**Independent Test**: Answer correctly and wait → next animal appears after ~`AUTO_ADVANCE_DELAY_MS` with no input; press Next during the pause → single advance (no skip); switch mode / unmount / hide the tab during the pause → no later advance; incorrect answers and the reveal never auto-advance.

### Tests for User Story 2 ⚠️ (write first, must FAIL)

- [X] T007 [US2] Write failing component test in `tests/component/quizAutoAdvance.test.tsx` using `vi.useFakeTimers()` and a mocked awaitable `TtsService`: after the correct cheer resolves, advancing the clock by `AUTO_ADVANCE_DELAY_MS` calls `onNext` exactly once (C3); manual Next during the pause → `onNext` once and the pending timer is cleared, no second advance (C4); mode switch/unmount and `document` `visibilitychange` to hidden during the pause → `onNext` not called later (C5); incorrect and `revealed` → no auto-advance (C6/C7 advance parts); TTS unavailable → auto-advance still fires after the delay (C8 advance part); advancing on the last animal wraps via the existing loop (C9). Run `npm run test -- quizAutoAdvance` and confirm it FAILS.

### Implementation for User Story 2

- [X] T008 [US2] Implement the cancellable auto-advance in `src/components/QuizMode.tsx`: after the correct cheer promise resolves, arm a single `setTimeout(AUTO_ADVANCE_DELAY_MS)` held in a `useRef` that calls `onNext` once then nulls its ref; clear it in `navigate()` (manual Next/Prev), in the `animal.id` effect cleanup (mode switch/unmount), and via a `document` `visibilitychange` handler when the tab becomes hidden — guaranteeing at most one armed timer and no stale/double advance. Make C3/C4/C5/C8/C9 green.

**Checkpoint**: US1 + US2 both work; a full loop is completable by voice alone with hands-free progression.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Full verification and docs.

- [X] T009 [P] Run the full suite and linter from the repository root: `npm run test` and `npm run lint`; ensure all tests green and no lint errors.
- [ ] T010 [P] Execute the manual validation in `specs/002-quiz-cheer-advance/quickstart.md` via `npm run dev` (real TTS in a browser): confirm the spoken cheer, hands-free ~2s advance, no cheer/next-question overlap, cancel-on-manual-Next, no cheer/advance on misses, reveal does not auto-advance, and the TTS-off visual fallback.
- [X] T011 [P] Update `README.md` to note the Quiz-mode correct-answer cheer and auto-advance behavior.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none — start immediately.
- **Foundational (Phase 2)**: depends on Setup; BLOCKS both user stories (provides `cheers.ts`).
- **User Story 1 (Phase 3)**: depends on Foundational.
- **User Story 2 (Phase 4)**: depends on Foundational AND on US1 — both edit `src/components/QuizMode.tsx`, and per FR-006 the cheer (US1) must play before the auto-advance (US2). Sequential, not parallel with US1.
- **Polish (Phase 5)**: depends on US1 + US2 complete.

### Within Each User Story

- The test task MUST be written and FAIL before its implementation task.
- US1: T004 (test) → T005 (impl); T006 [P] alongside T005 (different file: `Feedback.tsx`).
- US2: T007 (test) → T008 (impl).

### Parallel Opportunities

- T006 can run in parallel with T005 (edits `Feedback.tsx`, not `QuizMode.tsx`).
- Polish tasks T009, T010, T011 can run in parallel.
- US1 and US2 canNOT run in parallel (shared file `QuizMode.tsx` + FR-006 ordering).

---

## Parallel Example: User Story 1

```bash
# After the failing US1 test (T004) is in place, implement in parallel across different files:
Task: "T005 [US1] Cheer-on-correct in src/components/QuizMode.tsx"
Task: "T006 [US1] Celebratory fallback copy in src/components/Feedback.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → Phase 2 Foundational (`cheers.ts`).
2. Phase 3 US1: spoken/visual cheer on correct answers.
3. **STOP and VALIDATE**: correct answers cheer; misses/reveal do not — a rewarding quiz even without auto-advance. Ship/demo.

### Incremental Delivery

1. Setup + Foundational → cheer module ready.
2. US1 → cheer on correct (MVP). Validate independently.
3. US2 → hands-free auto-advance. Validate independently.
4. Polish → full suite, manual quickstart, docs.

---

## Notes

- [P] = different files, no dependencies. `QuizMode.tsx` is touched by both US1 and US2, so those tasks are sequential.
- No new dependencies, no `animals.json`/schema change, no `QuizSession` change.
- Verify each test FAILS before implementing (TDD).
- The 2-miss `revealed` path deliberately does NOT auto-advance (spec Assumption).
- Commit after each task or logical group.
