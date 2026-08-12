---

description: "Task list for Animal Sounds Game"
---

# Tasks: Animal Sounds Game

**Input**: Design documents from `/specs/001-animal-sounds-quiz/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: INCLUDED — the project uses Test-Driven Development (per the plan's Constitution Check / user preference). Within each phase, write the listed tests FIRST and confirm they FAIL before implementing.

**Organization**: Tasks are grouped by user story so each story can be implemented, tested, and demoed independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1 / US2 / US3 (setup, foundational, and polish tasks have no story label)
- Every task lists an exact file path.

## Path Conventions

Single-project frontend SPA (per plan.md): source in `src/`, static content in `public/assets/`, tests in `tests/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project scaffolding and tooling.

- [X] T001 Scaffold Vite + React 18 + TypeScript project at repo root (`package.json`, `index.html`, `tsconfig.json`, `vite.config.ts`, `src/main.tsx`, `src/App.tsx` placeholder)
- [X] T002 [P] Configure Vitest + React Testing Library + jsdom in `vite.config.ts`/`vitest.config.ts` and `tests/setup.ts` (add `test` npm script)
- [X] T003 [P] Configure ESLint + Prettier (`.eslintrc.cjs`, `.prettierrc`) with the TypeScript/React ruleset
- [X] T004 [P] Create source directory structure per plan in `src/domain/`, `src/services/`, `src/components/`, `src/styles/`, and `tests/{unit,component,e2e}/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared building blocks that BOTH Learn and Quiz modes depend on (types, content, collection navigation, picture card, TTS). No user-story work can start until this phase is complete.

**⚠️ CRITICAL**: Complete before any Phase 3+ story.

- [X] T005 [P] Define `Animal` type/interface and phrase defaults (`learnPhrase`/`quizPrompt`) in `src/domain/animal.ts`
- [X] T006 [P] Write FAILING unit tests for `AnimalCollection` (next/prev, wrap-around loop, empty collection) in `tests/unit/animalCollection.test.ts`
- [X] T007 Implement `AnimalCollection` (current/next/prev/loop, `isEmpty`) in `src/domain/animal.ts` to pass T006
- [X] T008 [P] Create sample content: `public/assets/animals.json` (cow + dog entries per `contracts/animals-metadata.schema.json`) and place the dog `.png` and cow `.avif` under `public/assets/animals/`
- [X] T009 [P] Write FAILING unit tests for `AnimalsRepository` (validates against schema, skips invalid entries, lowercases `acceptedAnswers`, returns empty list when none valid) in `tests/unit/animalsRepository.test.ts`
- [X] T010 Implement `AnimalsRepository.loadAnimals()` (fetch + validate `animals.json`, filter invalid, image-ref check) in `src/services/animalsRepository.ts` to pass T009
- [X] T011 Implement `TtsService` (Web Speech `SpeechSynthesis`: `isAvailable`, `speak` resolving even when unavailable, `cancel`) in `src/services/speechSynthesis.ts`
- [X] T012 [P] Write FAILING component test for `AnimalCard` (renders picture, large Prev/Next buttons, horizontal swipe fires nav, replay control fires callback) in `tests/component/animalCard.test.tsx`
- [X] T013 Implement `AnimalCard` (large picture, big child-friendly Prev/Next buttons, swipe gesture, replay control) in `src/components/AnimalCard.tsx` to pass T012
- [X] T014 Implement App shell in `src/App.tsx` + `src/main.tsx`: load animals via `AnimalsRepository`, build `AnimalCollection`, provide current animal + navigation, render friendly empty state when `isEmpty`

**Checkpoint**: App loads animals, shows a picture, and navigates (swipe/buttons) with looping — ready for mode behavior.

---

## Phase 3: User Story 1 - Learn animal sounds (Priority: P1) 🎯 MVP

**Goal**: Show each animal and speak "The {animal} says {sound}", with swipe/button navigation, looping, and replay.

**Independent Test**: Open the app (Learn mode); first animal's picture shows and its sentence is spoken; advancing announces each new animal within ~1s; from the first animal, going back wraps to the last; tapping replay re-speaks. With TTS disabled, the sentence appears as on-screen text.

### Tests for User Story 1 (write first, ensure they FAIL) ⚠️

- [X] T015 [P] [US1] Write FAILING component test for `LearnMode` (speaks `learnPhrase` on mount and on animal change; replay re-speaks; cancels in-flight speech before next; shows on-screen text when `TtsService.isAvailable()` is false) in `tests/component/learnMode.test.tsx`

### Implementation for User Story 1

- [X] T016 [US1] Implement `LearnMode` (speak learn phrase on animal change, replay control, cancel-on-navigate per research R5, text fallback per FR-012) in `src/components/LearnMode.tsx` to pass T015
- [X] T017 [US1] Wire `LearnMode` as the default mode in `src/App.tsx` so navigation announces each animal
- [X] T018 [P] [US1] Add large child-friendly layout/styles for the learn screen and controls in `src/styles/learn.css` (referenced by `LearnMode`/`AnimalCard`)

**Checkpoint**: MVP — a child can browse animals and hear each one, fully functional on its own.

---

## Phase 4: User Story 2 - Guess the sound (voice quiz) (Priority: P2)

**Goal**: Ask "What does the {animal} say?", listen on-device, check the answer leniently, give feedback, and reveal the correct sound after 2 misses.

**Independent Test**: In Quiz mode an animal is shown and the question spoken; saying the expected sound gives celebratory feedback; an unrelated answer gives gentle "try again"; a second miss reveals and speaks the correct sound and lets you advance; denying the microphone still lets you continue (reveal/skip). No recorded audio/transcript leaves the device.

### Tests for User Story 2 (write first, ensure they FAIL) ⚠️

- [X] T019 [P] [US2] Write FAILING unit tests for `answerMatcher` (accepts lenient/repeated-vowel variants, rejects unrelated words, normalizes case/punctuation) in `tests/unit/answerMatcher.test.ts`
- [X] T020 [P] [US2] Write FAILING unit tests for `quizSession` (attempt counting, `tryAgain` on 1st miss, `revealed` on 2nd miss, reset on animal/mode change) in `tests/unit/quizSession.test.ts`
- [X] T021 [P] [US2] Write FAILING component test for `QuizMode` (asks prompt; correct→celebrate; miss→try again; 2nd miss→reveal + speak sound; mic denied/unsupported→still allows continue) with mocked `RecognitionService`/`TtsService` in `tests/component/quizMode.test.tsx`

### Implementation for User Story 2

- [X] T022 [P] [US2] Implement `answerMatcher.isAnswerCorrect` (normalize + token-substring OR edit-distance threshold per research R3) in `src/domain/answerMatcher.ts` to pass T019
- [X] T023 [P] [US2] Implement `quizSession` (mode, attempts, phase, `registerResult`, `onAnimalChange`) in `src/domain/quizSession.ts` to pass T020
- [X] T024 [US2] Implement `RecognitionService` interface + on-device `vosk-browser` recognizer in `src/services/speechRecognition.ts` and `src/services/recognition.worker.ts` (`isAvailable`, `requestPermission`, `listenOnce` with `expectedWords`/timeout→noSpeech, `stop`; guarantee no network egress)
- [X] T025 [US2] Add recognizer WASM + model assets under `public/assets/models/` and load them in `src/services/recognition.worker.ts`
- [X] T026 [US2] Implement `QuizMode` (`src/components/QuizMode.tsx`) + `Feedback` (`src/components/Feedback.tsx`): speak prompt → listen → match → feedback → 2-miss reveal (speak `soundWord`), and mic-permission handling that never blocks (FR-011/SC-006), to pass T021
- [X] T027 [US2] Wire `QuizMode` into `src/App.tsx`; reset `quizSession` on each animal change (no-speech timeout counts as a miss)

**Checkpoint**: Learn AND Quiz modes both work independently.

---

## Phase 5: User Story 3 - Switch between modes (Priority: P3)

**Goal**: Toggle Learn ↔ Quiz at any time on the current animal without restarting.

**Independent Test**: From Learn mode, switch to Quiz mode → the current animal is presented as a quiz question; switch back → the learn sentence is spoken. No reload; attempts reset on switch.

### Tests for User Story 3 (write first, ensure they FAIL) ⚠️

- [X] T028 [P] [US3] Write FAILING component test for `ModeToggle` + App mode switching (switch keeps current animal, starts the other mode's behavior, resets quiz attempts) in `tests/component/modeToggle.test.tsx`

### Implementation for User Story 3

- [X] T029 [US3] Implement `ModeToggle` (large labeled control) in `src/components/ModeToggle.tsx`
- [X] T030 [US3] Add mode state to `src/App.tsx` to switch Learn ↔ Quiz without restart and reset `quizSession` attempts on mode change, to pass T028

**Checkpoint**: All three user stories independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Robustness, offline, privacy verification, and final validation across all stories.

- [X] T031 [P] Verify rapid-swipe handling: cancel in-flight TTS and stop active recognition on every animal/mode change so only the current animal speaks (research R5) — add guard in `src/App.tsx` and a test in `tests/component/navigationDebounce.test.tsx`
- [X] T032 [P] Add PWA/offline service worker and asset precaching (app + models) for offline-capable play in `vite.config.ts` (or `src/sw.ts`)
- [X] T033 [P] Add privacy check (SC-008): assert no outbound network transmission of audio/transcript during recognition in `tests/e2e/privacy-network.test.ts`
- [X] T034 [P] Add optional Playwright smoke test (load app, picture + on-screen text render, navigate) in `tests/e2e/smoke.spec.ts`
- [ ] T035 Run all `quickstart.md` manual validation scenarios A–F and record results
- [X] T036 [P] Add README/authoring docs (how to add an animal via `animals.json` + image, FR-005) in `README.md`

---

## Refinements (post-validation)

- [X] T037 Fix TTS mispronunciation (FR-002a): `soundWord` must be a natural, pronounceable spelling. Changed cow "muuuu" → "moo" in `public/assets/animals.json`; updated spec.md (Clarification + FR-002a), data-model.md, and the metadata contract accordingly. No code change (soundWord is used for both display and speech). Found during Learn-mode runtime validation.
- [X] T038 [US1] Harden `WebSpeechTtsService.speak()` for reliable repeated replay (FR-004, research R9) in `src/services/speechSynthesis.ts`: cancel then defer speak to a later tick (dodge Chrome cancel/speak race), `resume()` if paused, and wait for `voiceschanged` when `getVoices()` is empty. Found during manual replay validation (T035).
- [X] T039 [US1] Remove the effect-cleanup `tts.cancel()` in `src/components/LearnMode.tsx` so React StrictMode's double-mount does not swallow the auto-announcement (navigation already cancels explicitly).
- [X] T040 Register the offline service worker in production only and unregister any existing one in dev (research R10), in `src/main.tsx` — prevents dev cache-serving stale modules/`animals.json`.

## Implementation Notes & Deviations

- **T018**: layout/styles were consolidated into `src/styles/app.css` (imported by `main.tsx`) rather than a separate `learn.css`; all large-target styling lives there.
- **T024**: `RecognitionService` is implemented in `src/services/speechRecognition.ts` with graceful degradation. A separate `src/services/recognition.worker.ts` was **not** created — `vosk-browser` runs the recognizer in its own internal Web Worker, so the extra file was unnecessary. On-device / no-network guarantee is preserved.
- **T025** (done): bundled the on-device recognizer model `public/assets/models/vosk-model-small-en-us-0.15.tar.gz` (~41 MB, from the vosk-browser author's official host) and pointed the loader (`src/services/speechRecognition.ts` `MODEL_URL`) at it. Model serves 200 and the loader path is verified; **live recognition of a real child's voice still needs a device with a microphone** (covered by manual T035).
- **T033 / T034** (done): Playwright installed (`@playwright/test` + Chromium); `playwright.config.ts` added. Both specs pass in real Chromium — smoke (load + navigate) and privacy (no cross-origin egress in Quiz mode). Run with `npx playwright test`. Note: the privacy spec validates the negative without a granted mic; forcing real recognition would need a fake-audio fixture.
- **T035** (open): automated validation all green — 44 unit/component tests, `tsc` type-check, production build, served-assets smoke, and 2 Playwright e2e (load/navigate + privacy). The remaining manual scenarios needing a **real microphone + device TTS** (Quiz B correct/miss recognition, D mic-denied on device) still require a human on a device.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies — start immediately.
- **Foundational (Phase 2)**: depends on Setup — BLOCKS all user stories.
- **User Stories (Phase 3–5)**: all depend on Foundational.
  - US1 is the MVP. US2 and US3 build on the shared shell but are independently testable.
  - Recommended order P1 → P2 → P3; US2 and US3 can be parallelized by different developers after Foundational.
- **Polish (Phase 6)**: after the desired stories are complete.

### User Story Dependencies

- **US1 (P1)**: needs only Foundational.
- **US2 (P2)**: needs Foundational; adds recognition/matcher/quiz (independent of US1's LearnMode).
- **US3 (P3)**: needs Foundational; most meaningful once US1 and US2 exist, but the toggle/state is testable on its own.

### Within Each Story

- Tests written first and failing → implementation → integration.
- Domain (pure) before services; services before components; components before App wiring.

### Parallel Opportunities

- Setup: T002, T003, T004 in parallel after T001.
- Foundational: T005, T006, T008, T009, T012 in parallel (different files); T007 after T006, T010 after T009, T013 after T012.
- US2 domain: T022 and T023 in parallel; T019/T020/T021 (tests) in parallel first.
- Polish: T031–T034, T036 largely parallel.
- After Foundational, US1 / US2 / US3 can be staffed in parallel.

---

## Parallel Example: User Story 2

```bash
# Write the failing tests together first:
Task: "Unit tests for answerMatcher in tests/unit/answerMatcher.test.ts"
Task: "Unit tests for quizSession in tests/unit/quizSession.test.ts"
Task: "Component test for QuizMode in tests/component/quizMode.test.tsx"

# Then implement the pure domain pieces in parallel:
Task: "Implement answerMatcher in src/domain/answerMatcher.ts"
Task: "Implement quizSession in src/domain/quizSession.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Phase 1 Setup → 2. Phase 2 Foundational → 3. Phase 3 US1 → **STOP & validate Learn mode** → demo (MVP).

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 (Learn) → test → demo (MVP).
3. US2 (Quiz) → test → demo.
4. US3 (Mode switch) → test → demo.
5. Polish (offline, privacy check, quickstart validation).

---

## Notes

- [P] = different files, no dependency on an incomplete task.
- TDD: confirm each test fails before implementing; commit after each task or logical group.
- The on-device recognizer (T024/T025) is the main technical risk; `transformers.js` Whisper-tiny is the documented offline fallback if Vosk accuracy on toddler speech is insufficient (research R2).
- Do not use the browser's cloud `SpeechRecognition` — it violates the on-device privacy clarification (SC-008).
