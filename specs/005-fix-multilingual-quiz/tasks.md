---

description: "Task list for Fix Multilingual Quiz — Localized Feedback + Non-English Recognition"
---

# Tasks: Fix Multilingual Quiz (Localized Feedback + Non-English Recognition)

**Input**: Design documents from `/specs/005-fix-multilingual-quiz/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**TDD**: Tests are written FIRST (Red → Green → Refactor) per global CLAUDE.md and the plan.md constitution check.

**Organization**: Tasks grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- Include exact file paths in descriptions

## Path Conventions

- Single-project SPA: `src/`, `tests/`, `public/` at repository root
- Models: `public/assets/models/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify project environment and confirm existing tests are green before any changes.

- [X] T001 Run `npm install` from repo root and confirm `vosk-browser` is listed as an optional dependency in `package.json`
- [X] T002 Run `npm test` and `npm run build` to establish a clean baseline — all existing tests must pass and build must succeed before any changes are made

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Model asset files and type-system extension that all user stories depend on.

**⚠️ CRITICAL**: US3/US4 cannot complete without model files; the `UiStrings` type extension blocks US1 compilation until T005 is done.

- [X] T003 [P] Download `vosk-model-small-uk-v3-nano.tar.gz` (Ukrainian Vosk small/nano model) from the official Vosk model repository (alphacephei.com/vosk/models) and place it at `public/assets/models/vosk-model-small-uk-v3-nano.tar.gz`
- [X] T004 [P] Download `vosk-model-small-es-0.42.tar.gz` (Spanish Vosk small model) from the official Vosk model repository (alphacephei.com/vosk/models) and place it at `public/assets/models/vosk-model-small-es-0.42.tar.gz`
- [X] T005 Extend the `UiStrings` type in `src/domain/language.ts` with four new required string fields: `quizListening`, `quizCorrect`, `quizTryAgain`, and `quizRevealed` — TypeScript will error until all three language entries in `UI_STRINGS` supply values, enforcing completeness by the type system

**Checkpoint**: Foundation ready — model assets present, type system enforces completeness for all languages.

---

## Phase 3: User Story 1 — Localized Quiz Feedback (Priority: P1) 🎯 MVP-Part-1

**Goal**: Every quiz feedback state (listening, correct, try-again, revealed, mic-unavailable) renders in the selected language with zero English mixed in.

**Independent Test**: Select Ukrainian then Spanish; drive each feedback phase; confirm every visible line is in the selected language and English fragments (`"It says"`, `"Yay"`, `"Good try"`) are absent for non-English sessions.

### Tests for User Story 1 ⚠️ Write FIRST — ensure they FAIL before implementation

- [X] T006 [P] [US1] Write failing component test in `tests/component/feedbackLocalized.test.tsx` — for uk and es: mount `<Feedback>` in each phase (correct, tryAgain, revealed, listening, listeningUnavailable) with localized `strings` and a `soundWord`; assert the localized substring is present and known English fragments (`"It says"`, `"Yay"`, `"Good try"`) are absent; assert the revealed phase embeds the sound word inside the localized sentence (FR-002)
- [X] T007 [P] [US1] Write failing unit test in `tests/unit/feedbackStrings.test.ts` — for every language in `UI_STRINGS`: assert all four new fields are non-empty strings; assert `quizRevealed` contains exactly one `{sound}` token and no fixed English scaffolding; assert English values equal the current hard-coded strings verbatim (FR-009)

### Implementation for User Story 1

- [X] T008 [US1] Populate `UI_STRINGS` in `src/domain/language.ts` with localized values for all three languages: en values match current hard-coded strings; uk: `quizListening: "👂 Слухаю…"`, `quizCorrect: "🎉 Ура! Правильно!"`, `quizTryAgain: "🙂 Майже! Спробуй ще раз!"`, `quizRevealed: "Каже «{sound}». Молодець! Натисни ▶ для наступної."`; es: `quizListening: "👂 Escuchando…"`, `quizCorrect: "🎉 ¡Sí! ¡Correcto!"`, `quizTryAgain: "🙂 ¡Casi! ¡Otra vez!"`, `quizRevealed: "Hace «{sound}». ¡Bien hecho! Pulsa ▶ para el siguiente."` — values from `contracts/feedback-strings.md`
- [X] T009 [US1] Rewrite `src/components/Feedback.tsx` to render from `strings.quizCorrect`, `strings.quizTryAgain`, `strings.quizRevealed` (replacing `{sound}` with `soundWord`), and `strings.quizListening` instead of hard-coded English literals — preserve the `micUnavailable` branch unchanged (`🎤 {strings.micUnavailable}`)
- [X] T010 [US1] Verify `src/components/QuizMode.tsx` passes the `strings` object (including all new keys) to `<Feedback>` — add or update the prop threading if it is missing; no other logic change required

**Checkpoint**: Run `npm test` — T006 and T007 must now PASS; existing English behavior is unchanged.

---

## Phase 4: User Story 2 — Ukrainian & Spanish Answers Accepted (Priority: P1)

**Goal**: The answer matcher preserves Cyrillic and non-Latin letters so Ukrainian and Spanish correct answers can match against recognized transcripts.

**Independent Test**: Feed all eleven contract cases (C1–C11) from `contracts/answer-matcher.md` into `isAnswerCorrect` — all Cyrillic and Spanish accept cases pass, all reject/cross-language cases pass, all existing English cases still pass.

### Tests for User Story 2 ⚠️ Write FIRST — ensure they FAIL before implementation

- [X] T011 [US2] Extend `tests/unit/answerMatcher.test.ts` with all eleven contract cases from `contracts/answer-matcher.md`: C1 uk `["му","муу"]` + `"муу"` → true; C2 uk `"МУУУУУ"` → true; C3 uk embedded `"корова каже гав"` → true; C4 es `["mu","muu"]` + `"muu"` → true; C5 es stretched `"muuuuuu"` → true; C6 en `"MOO!!!"` → true; C7 en phrase `"the cow says moo"` → true; C8 uk unrelated `"банан"` → false; C9 es unrelated `"hola"` → false; C10 uk cross-language `"woof"` → false; C11 empty/whitespace-only → false — cases C1–C5 and C8–C10 MUST FAIL before the fix

### Implementation for User Story 2

- [X] T012 [US2] Fix `normalize()` in `src/domain/answerMatcher.ts`: replace the strip regex `/[^a-z\s]/g` with `/[^\p{L}\s]/gu` (Unicode letter class with `u` flag); add the `u` flag to the repeated-letter collapse regex so `муууу→му` works correctly; leave `.toLowerCase()`, whitespace trim, edit-distance fuzz, and substring/word matching exactly unchanged (FR-005, FR-009)

**Checkpoint**: Run `npm test` — all C1–C11 matcher cases PASS; no existing English tests regress.

---

## Phase 5: User Stories 3 & 4 — Per-Language On-Device Recognition + Honest Degradation (Priority: P2)

**Goal**: Each language is served by its own bundled Vosk on-device model; no silent English fallback occurs; when unavailable the state is honest, localized, and non-blocking.

**Independent Test**: Factory returns a service pointing at the correct model URL for each language; a missing/failed model yields `isAvailable() === false` and never substitutes another language's model; QuizMode surfaces the localized unavailable notice and enables reveal/advance without ever showing a false wrong-answer state.

### Tests for User Story 3 ⚠️ Write FIRST — ensure they FAIL before implementation

- [X] T013 [P] [US3] Rewrite `tests/unit/speechRecognition.test.ts` — assert `makeRecognitionService('uk')` creates a service referencing `MODEL_URLS['uk']` (Ukrainian model path); `makeRecognitionService('es')` references `MODEL_URLS['es']`; `makeRecognitionService('en')` references `MODEL_URLS['en']`; none of these reference a different language's model URL (FR-007, FR-012)
- [X] T014 [US3] Add unit test in `tests/unit/speechRecognition.test.ts` asserting `WebSpeechRecognitionService` (or the cloud speech path) is NOT returned by `makeRecognitionService` for any of the three languages — verify via type check or absence of cloud/browser speech references in the returned service (FR-011)

### Tests for User Story 4 ⚠️ Write FIRST — ensure they FAIL before implementation

- [X] T015 [US4] Add failing unit test in `tests/unit/speechRecognition.test.ts` for honest degradation: when the model fetch for language L fails, `isAvailable()` returns `false` and `requestPermission()` resolves `'unsupported'`; no fallback to any other language's model is attempted (FR-008, FR-012)

### Implementation for User Stories 3 & 4

- [X] T016 [US3] Add `MODEL_URLS: Record<Language, string>` constant to `src/services/speechRecognition.ts` mapping `'en'` → `'/assets/models/vosk-model-small-en-us-0.15.tar.gz'`, `'uk'` → `'/assets/models/vosk-model-small-uk-v3-nano.tar.gz'`, `'es'` → `'/assets/models/vosk-model-small-es-0.42.tar.gz'`
- [X] T017 [US3] Refactor `makeRecognitionService(lang: Language)` in `src/services/speechRecognition.ts` to always `return new OnDeviceRecognitionService(MODEL_URLS[lang])`; remove `WebSpeechRecognitionService` from the factory return path; remove the English-model fallback for uk/es (FR-007, FR-011)
- [X] T018 [US3] Add module-level session cache `const modelCache = new Map<Language, VoskModel>()` in `src/services/speechRecognition.ts`; update `OnDeviceRecognitionService.ensureModel()` to check the cache before loading and store a successfully parsed model in the cache after load (FR-013)
- [X] T019 [US4] Verify `OnDeviceRecognitionService.isAvailable()` returns `false` when `model` is `null` (loading or failed) and that `src/components/QuizMode.tsx` correctly maps `'unsupported'` / `'denied'` from `requestPermission()` to the unavailable state (localized `micUnavailable` notice + reveal/advance, no wrong-answer flash) — add a defensive guard if the mapping is absent (FR-008, FR-012)

**Checkpoint**: Run `npm test` — all recognition factory and degradation tests PASS; run `npm run build` — TypeScript compiles clean with no errors.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Full regression sweep, privacy e2e confirmation, build verification, and quickstart validation.

- [X] T020 [P] Run `npm test` — confirm all unit and component tests pass with zero failures and zero regressions in the existing English test suite (SC-006)
- [X] T021 [P] Run `npm run lint && npm run build` — confirm TypeScript compiles with no errors and the production build output is clean
- [X] T022 Run `npx playwright test tests/e2e/privacy-network.spec.ts` — confirm no cross-origin speech requests are made and no audio or transcript leaves the device (FR-011)
- [X] T023 Run manual quickstart validation per `specs/005-fix-multilingual-quiz/quickstart.md` scenarios 3–6: localized feedback in every state (SC-001), Ukrainian and Spanish answers accepted (SC-002, SC-003), per-language recognizer selection (SC-004), honest degradation (SC-005), offline persistence after first load (SC-007), mid-quiz language switch (FR-010)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — run first to establish baseline
- **Foundational (Phase 2)**: Depends on Phase 1; T003 and T004 [P] can run concurrently; T005 can run in parallel with T003/T004
- **US1 (Phase 3)**: Depends on T005 (type extension must compile); T006 and T007 [P] can run concurrently
- **US2 (Phase 4)**: Independent of US1 and model downloads — can start after Phase 1; T011 before T012
- **US3+US4 (Phase 5)**: Depends on T003 and T004 (model files must be present); T013 [P] before T016; T015 before T019; T016 before T017 before T018
- **Polish (Phase 6)**: Depends on all prior phases complete; T020 and T021 [P] can run concurrently

### User Story Dependencies

- **US1 (P1)**: Depends only on T005 (UiStrings type) — independent of recognizer work
- **US2 (P1)**: Fully independent — only touches `src/domain/answerMatcher.ts`; can run in parallel with US1 after Phase 1 baseline
- **US3 (P2)**: Depends on Phase 2 model assets (T003, T004); implementation tasks T016 → T017 → T018 are sequential
- **US4 (P2)**: Tightly coupled with US3 — T019 follows T016–T018

### Within Each User Story

- Tests MUST be written first and MUST FAIL before the corresponding implementation (TDD: Red → Green → Refactor)
- Model registry (T016) before factory refactor (T017) before session cache (T018)
- Degradation guard (T019) after model-loading code is in place (T016–T018)

### Parallel Opportunities

- T003 and T004 (model downloads) are independent — run simultaneously
- T005 (type extension) can start while models are downloading
- T006 and T007 (US1 tests) target different files — parallel
- T020 and T021 (final checks) are independent shell commands — run simultaneously
- US1 and US2 implementation can run in parallel (different files throughout)

---

## Parallel Example: Phase 2 Model Downloads

```bash
# Run simultaneously (independent files):
Task: "T003 — Download UK model → public/assets/models/vosk-model-small-uk-v3-nano.tar.gz"
Task: "T004 — Download ES model → public/assets/models/vosk-model-small-es-0.42.tar.gz"
```

## Parallel Example: US1 & US2 (after Phase 2 complete)

```bash
# Run simultaneously (different files, no shared dependencies):
Task: "US1 — T006/T007 tests → T008/T009/T010 implementation (language.ts, Feedback.tsx, QuizMode.tsx)"
Task: "US2 — T011 tests → T012 implementation (answerMatcher.ts)"
```

---

## Implementation Strategy

### MVP First (US1 + US2 — P1 Stories Only)

1. Phase 1: Confirm clean baseline
2. Phase 2 (T005 only): Extend `UiStrings` type
3. Phase 3 (US1): Localized feedback strings
4. Phase 4 (US2): Script-aware answer matcher
5. **STOP and VALIDATE**: Every feedback line is localized; Cyrillic/Spanish sounds match correctly. Both P1 stories done.
6. Deploy/demo — a child sees localized text and Ukrainian/Spanish sounds are accepted ✓

### Incremental Delivery

1. US1 (P1) → localized feedback ✓
2. US2 (P1) → script-aware matching ✓ (ships independently of recognizer work)
3. US3 + US4 (P2) → per-language recognizer + honest degradation ✓ (requires model files first)
4. Polish → full regression sweep + privacy e2e ✓

### Parallel Team Strategy

- While US1 is being implemented: US2 can proceed independently (different files)
- While US1+US2 are being implemented: model downloads (T003/T004) for US3 can happen in background
- US3/US4 implementation begins only after T003+T004 confirm model files are present

---

## Notes

- [P] tasks touch different files and have no unmet dependencies — safe to parallelize
- TDD: every implementation task has a preceding test task with the same story label; implement only after the test fails
- `micUnavailable` string is pre-existing and already localized — do NOT modify it (FR-003)
- English behavior must be identical before and after all changes (FR-009, SC-006)
- Model files (T003, T004) are binary downloads, not code tasks; verify tarball layout matches what `vosk-browser createModel` expects (reference: existing English model at `public/assets/models/vosk-model-small-en-us-0.15.tar.gz`)
- After T017, `WebSpeechRecognitionService` may be removed entirely if unreferenced; check with `grep -r WebSpeechRecognitionService src/` before deleting
- The service worker (`public/sw.js`) already persists same-origin model tarballs across restarts — no new SW code required (FR-014)

---

## Phase 7: Convergence

**Purpose**: Close gaps found by `/speckit-converge` on 2026-08-13. Field report: quiz unusable in Ukrainian and Spanish (permanent mic-unavailable). Root cause: the uk/es "model" files delivered by T003/T004 are 1.7 KB HTML pages from alphacephei.com, not Vosk tarballs, so `createModel` can never succeed for those languages.

- [X] T024 Replace the invalid `public/assets/models/vosk-model-small-uk-v3-nano.tar.gz` (currently a 1.7 KB HTML page, not a model): download the official Ukrainian nano model from alphacephei.com/vosk/models (distributed as `.zip` — repackage to `.tar.gz`), verify with `file` that it is gzip data of plausible size (tens of MB) and with `tar tzf` that its top-level directory layout matches the working English model (`tar tzf public/assets/models/vosk-model-small-en-us-0.15.tar.gz | head`), per T003/FR-007/FR-011/US3-AC1 (contradicts) — CRITICAL
- [X] T025 Replace the invalid `public/assets/models/vosk-model-small-es-0.42.tar.gz` (same 1.7 KB HTML page): download the official Spanish small model `vosk-model-small-es-0.42` from alphacephei.com/vosk/models, repackage `.zip` → `.tar.gz`, and verify identically to T024, per T004/FR-007/FR-011/US3-AC2 (contradicts) — CRITICAL
- [X] T026 Re-run the quickstart validation (scenarios 3–6 of `specs/005-fix-multilingual-quiz/quickstart.md`) on a real device AFTER all other Phase 7 tasks complete, serving over trusted HTTPS (mic is a secure-context API: install the mkcert root CA on the device and open `https://anakon.local:5173` in a real browser — plain-http or an in-app browser without the CA yields mic-unavailable in every language); confirm uk/es answers are accepted (SC-002, SC-003), the correct per-language recognizer loads (SC-004), and degradation/offline persistence hold (SC-005, SC-007), per T023/SC-002/SC-004/SC-005 (contradicts) — HIGH
- [X] T027 Write a failing component test first, then update `src/components/QuizMode.tsx` so the localized unavailable (reveal/skip) state — not the "listening…" line — is shown while the selected language's recognizer is not yet ready: initialize the unavailable state as true (or add an explicit not-ready state mapped to the `micUnavailable` notice) and clear it only when `requestPermission()` resolves `'granted'`, per Clarification 2026-08-13/FR-012/FR-013 (partial) — MEDIUM
- [X] T028 Write a failing test first (or verify manually in a prod build), then guard the `fetch` handler in `public/sw.js` to only `cache.put` responses where `response.ok` is true, so a transient 404/error page is never permanently persisted by the cache-first strategy in place of a model tarball, per FR-014/SC-007 (partial) — MEDIUM
- [X] T029 Change `MODEL_URLS` in `src/services/speechRecognition.ts` to the absolute paths T016 specifies (`/assets/models/...` with leading slash) and update the assertions in `tests/unit/speechRecognition.test.ts` accordingly, per T016 (partial) — LOW

---

## Phase 8: Convergence

**Purpose**: Close the gap found by `/spe`ckit-converge` on 2026-08-15. Field report: in Quiz mode the question is heard twice at the start of each animal; it must be asked exactly once. Root cause: `<StrictMode>` (`src/main.tsx`) double-invokes the `[animal.id]` effect in `src/components/QuizMode.tsx` that speaks the prompt on mount, and `WebSpeechTtsService.speak()` (`src/services/speechSynthesis.ts`) defers the real `synth.speak()` via `setTimeout(start, 0)` — so the cleanup's `tts.cancel()` runs before the queued utterance reaches the engine and cancels nothing, leaving both utterances to play.

- [X] T030 Write a failing test first (mount `<QuizMode>` under React `<StrictMode>`, or simulate the setup→cleanup→setup remount, asserting the quiz prompt is spoken exactly once at start), then fix `WebSpeechTtsService` in `src/services/speechSynthesis.ts` so `cancel()` aborts a deferred-but-not-yet-started utterance: track the pending pre-`start` timer (both the `setTimeout(start, 0)` and the `voiceschanged`/250 ms fallback paths) in an instance field, clear it in `cancel()`, and resolve the pending promise — so cleanup's `tts.cancel()` truly cancels the queued prompt and only one utterance reaches the engine; optionally add an ask-once-per-animal `useRef` guard in `src/components/QuizMode.tsx` as defense-in-depth. Preserve existing English behavior and the `reveals and speaks the sound` flow (FR-009, SC-006). Per field report: quiz question spoken twice at start + QuizMode ask/listen contract (`src/components/QuizMode.tsx:111`) (contradicts) — HIGH
