---

description: "Task list for Multi-Language Flag Selector implementation"
---

# Tasks: Multi-Language Flag Selector

**Input**: Design documents from `/specs/004-language-flags/`

**Prerequisites**: plan.md, spec.md, data-model.md, research.md, contracts/, quickstart.md

**Tests**: TDD — write failing tests first, then implement (Red → Green → Refactor).

**Organization**: Tasks grouped by user story; each story is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to ([US1], [US2], [US3])

## Path Conventions

Single-page app — `src/` and `tests/` at repository root; `public/assets/` for static data.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Restructure the static data file before any code changes; breaking change applied atomically.

- [X] T001 Restructure `public/assets/animals.json` — replace flat array with localized translations map per animal; add `translations.uk` and `translations.es` entries for all existing animals (cow, dog), keeping `translations.en` as baseline; shape must match `LocalizedAnimalData` in data-model.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Domain types, pure functions, and service interfaces that every user story depends on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 [P] Create `src/domain/language.ts` — export `Language` type (`'en' | 'uk' | 'es'`), `LanguageConfig` interface, `LANGUAGES` readonly array (uk → 🇺🇦 uk-UA, es → 🇪🇸 es-ES, en → 🇺🇸 en-US), `DEFAULT_LANGUAGE = 'uk'`, and `UI_STRINGS` record with all keys from data-model.md for all three languages
- [X] T003 Add `LocalizedTranslation` and `LocalizedAnimalData` interfaces to `src/domain/animal.ts`; add pure functions `resolveAnimal(data: LocalizedAnimalData, lang: Language): Animal | null` (with en fallback) and `resolveAnimals(data: LocalizedAnimalData[], lang: Language): Animal[]`
- [X] T004 Update `src/services/animalsRepository.ts` — add `loadLocalizedAnimals(): Promise<LocalizedAnimalData[]>` to `AnimalsRepository` interface; implement in `HttpAnimalsRepository`; add exported pure functions `parseLocalizedAnimal(raw: unknown): LocalizedAnimalData | null` and `parseLocalizedAnimals(rawList: unknown): LocalizedAnimalData[]`; update `loadAnimals()` to delegate to `loadLocalizedAnimals()` + resolve with `'en'` (backward compat)
- [X] T005 [P] Extend `src/services/speechSynthesis.ts` — add optional `lang?: string` (BCP-47) parameter to `TtsService.speak()`; in `WebSpeechTtsService` set `utterance.lang = lang` and select first matching voice via `synth.getVoices()` prefix match; fall back to browser default when no match; `speak()` must still always resolve (never reject)
- [X] T006 [P] Extend `src/domain/cheers.ts` — change `CHEERS` from `readonly string[]` to `Record<Language, readonly string[]>` with uk/es/en cheer sets; add `lang: Language` as first parameter to `nextCheer(lang, previous?)`; update all internal usages

**Checkpoint**: Foundation ready — user story phases can now start in parallel.

---

## Phase 3: User Story 1 — Ukrainian Default on First Launch (Priority: P1) 🎯 MVP

**Goal**: App launches in Ukrainian with all text, audio, and the Ukrainian flag visually active — no setup required.

**Independent Test**: Clear `localStorage`, reload the app, verify 🇺🇦 has `aria-checked="true"`, all visible text is in Ukrainian (Навчання, Вікторина, animal names), and spoken audio uses `uk-UA` TTS lang.

### Tests for User Story 1 (TDD — write FIRST, ensure they FAIL before implementing)

- [X] T007 [P] [US1] Write failing unit tests for `src/domain/language.ts` — test LANGUAGES array contents, DEFAULT_LANGUAGE is `'uk'`, UI_STRINGS has identical keys across all three languages, all string values are non-empty — in `tests/unit/language.test.ts`
- [X] T008 [P] [US1] Write failing unit tests for localized animal parsing — test `parseLocalizedAnimal` validation rules, `resolveAnimal` with matching lang, `resolveAnimal` falls back to `'en'` when requested lang absent, `resolveAnimal` returns `null` when en fallback also invalid, `resolveAnimals` drops nulls — in `tests/unit/animalsRepository.test.ts` (extend existing file)
- [X] T009 [P] [US1] Write failing component tests for `LanguageSelector` — test 🇺🇦 renders with `aria-checked="true"` and `data-testid="lang-uk"` when `language='uk'`, 🇪🇸 and 🇺🇸 render with `aria-checked="false"`, container has `role="radiogroup"` and `data-testid="lang-selector"`, tapping active flag does NOT call `onChange` — in `tests/component/languageSelector.test.tsx`

### Implementation for User Story 1

- [X] T010 [US1] Create `src/components/LanguageSelector.tsx` — stateless component with props `{ language: Language; onChange: (lang: Language) => void }`; render `<div role="radiogroup" aria-label="Language" data-testid="lang-selector">`; one `<button role="radio">` per language from `LANGUAGES` array (order: uk, es, en); each button: `aria-checked`, `aria-label`, `data-testid="lang-{code}"`, flag emoji, minimum 48×48 px tap target; active flag: `aria-checked="true"`, CSS class `active` (scale 1.3×, outline); inactive: `aria-checked="false"`, 80% opacity; tapping active flag → no-op (do not call `onChange`); add `LanguageSelector.css` with button and active state styles
- [X] T011 [US1] Wire language state in `src/components/App.tsx` — add `useState<Language>('uk')` default (persistence wired in US3); call `loadLocalizedAnimals()` once on mount and store in a ref; derive `animals` via `resolveAnimals(localizedAnimals, language)` whenever `language` changes; render `<LanguageSelector language={language} onChange={setLanguage} />` above `<ModeToggle>`; pass `lang={language}`, `strings={UI_STRINGS[language]}`, and `langConfig={LANGUAGES.find(l => l.code === language)}` to all child components
- [X] T012 [P] [US1] Update `src/components/LearnMode.tsx` — add `lang: Language` and `strings: typeof UI_STRINGS['en']` and `langConfig: LanguageConfig` to props; replace hardcoded UI strings with `strings.*` values; pass `langConfig.ttsLang` as second argument to all `tts.speak()` calls
- [X] T013 [P] [US1] Update `src/components/QuizMode.tsx` — add `lang: Language`, `strings: typeof UI_STRINGS['en']`, and `langConfig: LanguageConfig` to props; replace hardcoded UI strings with `strings.*`; pass `langConfig.ttsLang` to all `tts.speak()` calls; pass `lang` as first argument to `nextCheer()`
- [X] T014 [P] [US1] Update `src/components/ModeToggle.tsx` — add `strings: typeof UI_STRINGS['en']` to props; replace hardcoded `'Learn'`/`'Quiz'` labels with `strings.learn` and `strings.quiz`
- [X] T015 [P] [US1] Update `src/components/Feedback.tsx` — add `strings: typeof UI_STRINGS['en']` to props; replace hardcoded UI copy (audioOff, micUnavailable messages) with `strings.*` equivalents

**Checkpoint**: App launches in Ukrainian, all text and audio in Ukrainian, Ukrainian flag visually active — User Story 1 independently testable.

---

## Phase 4: User Story 2 — Switch Language via Flag (Priority: P2)

**Goal**: Tapping a flag instantly switches all text and audio to the selected language; active flag becomes highlighted; switching during quiz mode stops listening and restarts in the new language.

**Independent Test**: Open app (Ukrainian active), tap 🇪🇸 — verify all text switches to Spanish, 🇪🇸 gets `aria-checked="true"`, audio replays in `es-ES`. Tap 🇺🇦 — verify all text reverts to Ukrainian.

### Tests for User Story 2 (TDD — write FIRST, ensure they FAIL before implementing)

- [X] T016 [P] [US2] Write failing unit tests for `WebSpeechRecognitionService` — test `isAvailable()` returns false when `window.SpeechRecognition` absent, `requestPermission()` returns `'unsupported'` when unavailable, `stop()` resolves pending listen promise — in `tests/unit/speechRecognition.test.ts` (extend or create)
- [X] T017 [P] [US2] Write failing component tests for language switching — test tapping inactive flag calls `onChange` with correct lang code, all three flags can be selected in sequence, `data-testid="lang-selector"` present in both Learn and Quiz modes — extend `tests/component/languageSelector.test.tsx`

### Implementation for User Story 2

- [X] T018 [US2] Implement `WebSpeechRecognitionService` in `src/services/speechRecognition.ts` — wraps `window.SpeechRecognition ?? window.webkitSpeechRecognition`; constructor takes `lang: string` (BCP-47); `isAvailable()` checks window API presence; `listenOnce()` sets `recognition.lang`, `interimResults = false`, `maxAlternatives = 1`; resolves on `result`; resolves `{ noSpeech: true }` on `nomatch`, `error`, or timeout (`options.timeoutMs ?? 4000`); `stop()` calls `recognition.abort()` and resolves any pending promise
- [X] T019 [US2] Add `makeRecognitionService(lang: Language): RecognitionService` factory to `src/services/speechRecognition.ts` (returns `OnDeviceRecognitionService` for `'en'`, `WebSpeechRecognitionService` with BCP-47 for `'uk'`/`'es'`, falls back to `OnDeviceRecognitionService` if `SpeechRecognition` API absent); wire in `src/components/App.tsx` via `useMemo` keyed on `language`; call `recognitionService.stop()` in the language-change handler before updating state

**Checkpoint**: All three flags switch text and audio correctly; flag UI reflects active selection; Quiz mode language switch stops listening.

---

## Phase 5: User Story 3 — Language Persists Across Sessions (Priority: P3)

**Goal**: Selected language is saved to `localStorage` and restored on next app open — no re-selection needed.

**Independent Test**: Switch to Spanish, close tab, reopen — verify 🇪🇸 is active and `localStorage.getItem('mumu-language') === 'es'`.

### Tests for User Story 3 (TDD — write FIRST, ensure they FAIL before implementing)

- [X] T020 [P] [US3] Write failing unit tests for `LocalStorageLanguageStore` — test `load()` returns `'uk'` when storage empty, `load()` returns stored valid Language, `load()` returns `'uk'` when stored value is unrecognized, `save()` writes correct key/value, both methods never throw (mock localStorage to throw) — in `tests/unit/languageStore.test.ts`

### Implementation for User Story 3

- [X] T021 [US3] Create `src/services/languageStore.ts` — export `LanguageStore` interface (`load(): Language; save(lang: Language): void`); implement `LocalStorageLanguageStore`: key `'mumu-language'`, `load()` wraps `localStorage.getItem` in try/catch and validates against `VALID` set before returning, defaults to `DEFAULT_LANGUAGE`; `save()` wraps `localStorage.setItem` in try/catch and swallows errors silently
- [X] T022 [US3] Update `src/components/App.tsx` — create store via `useMemo(() => new LocalStorageLanguageStore(), [])`; replace `useState<Language>('uk')` with lazy initializer `useState<Language>(() => store.load())`; call `store.save(lang)` inside `handleLanguageChange` before calling `setLanguage`

**Checkpoint**: Language selection survives page reload — User Story 3 independently verifiable via `localStorage.getItem('mumu-language')`.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T023 [P] Verify accessibility — confirm `<LanguageSelector>` has `role="radiogroup"`, each button `role="radio"` with correct `aria-label` and `aria-checked`, tab navigation cycles through flags, active flag has visible focus ring in `LanguageSelector.css`
- [X] T024 [P] TypeScript build validation — run `npm run build`; fix any type errors (missing translation keys, unresolved imports, prop type mismatches); zero errors required (SC-003 enforced at compile time)
- [X] T025 Run full test suite — `npm test`; verify all existing tests pass and all new tests green; run quickstart.md scenarios in browser to confirm SC-001, SC-002, SC-003, SC-004, SC-005

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately (data restructure)
- **Foundational (Phase 2)**: Depends on Phase 1 (T001 must be done before T004) — **BLOCKS all user stories**
- **User Story phases (Phase 3, 4, 5)**: All depend on Phase 2 completion; can proceed in priority order or in parallel if staffed
- **Polish (Phase 6)**: Depends on all desired user story phases complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — no dependency on US2 or US3
- **US2 (P2)**: Can start after Phase 2 — extends App.tsx wired in US1 (complete US1 first for single-developer flow)
- **US3 (P3)**: Can start after Phase 2 — extends App.tsx state initialization; independent of US2

### Within Each User Story

- Tests MUST be written and FAIL before implementation (TDD — global rule)
- Models/types before services
- Services before components
- Core implementation before integration wiring in App.tsx

### Parallel Opportunities

- T002, T005, T006 can run in parallel (different domain files)
- T007, T008, T009 can all run in parallel (different test files)
- T012, T013, T014, T015 can run in parallel (different component files)
- T016, T017 can run in parallel (different test concerns)
- T020 can start as soon as Phase 2 complete (independent of US1/US2)
- T023, T024 can run in parallel during polish

---

## Parallel Example: User Story 1 Tests

```bash
# All three test files can be written simultaneously:
Task: "Write failing unit tests for language.ts in tests/unit/language.test.ts"
Task: "Write failing unit tests for animalsRepository localized parsing in tests/unit/animalsRepository.test.ts"
Task: "Write failing component tests for LanguageSelector in tests/component/languageSelector.test.tsx"

# All four component updates can happen simultaneously:
Task: "Update LearnMode.tsx — lang+strings props, ttsLang in speak()"
Task: "Update QuizMode.tsx — lang+strings props, ttsLang in speak(), lang in nextCheer()"
Task: "Update ModeToggle.tsx — strings prop"
Task: "Update Feedback.tsx — strings prop"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Restructure `animals.json`
2. Complete Phase 2: Foundational types + services (CRITICAL — blocks all stories)
3. Complete Phase 3: User Story 1 (Ukrainian default, full component wiring)
4. **STOP and VALIDATE**: `npm test` passes; quickstart Scenarios 1–2–3 pass in browser
5. App is usable in Ukrainian — deploy/demo if needed

### Incremental Delivery

1. Phase 1 + Phase 2 → Data and types ready
2. Phase 3 (US1) → Ukrainian default works → MVP demo
3. Phase 4 (US2) → Language switching works → Switch demo
4. Phase 5 (US3) → Persistence works → Full feature complete
5. Phase 6 → Polish, build validation, full test pass

### Parallel Team Strategy

With multiple developers after Phase 2:
- Developer A: User Story 1 (Ukrainian default + component wiring)
- Developer B: User Story 3 (LanguageStore implementation)
- Once US1 merges: Developer A continues with US2 (WebSpeechRecognitionService)

---

## Notes

- `[P]` tasks operate on different files — safe to parallelize
- `[Story]` label maps each task to its user story for traceability
- `resolveAnimal()` fallback to `'en'` is critical — never expose null to components
- `LocalStorageLanguageStore` try/catch is required — private browsing blocks localStorage
- `WebSpeechRecognitionService` is cloud-based for uk/es — document trade-off in PR
- `speak()` must always resolve (never reject) — existing contract must hold after lang param addition
- Commit after each task or logical group; stop at checkpoints to validate story independently

---

## Phase 7: Convergence

**Purpose**: Close the gap between the clarified spec (immediate speech on language switch — FR-004, US2 AC1-2/AC4-5, edge case, SC-002) and the current code, which re-renders text silently when only the language changes (LearnMode `lastSpokenId` guard; QuizMode effect keyed on `animal.id` only; App `handleLanguageChange` cancels audio but triggers no re-speak). Also adds the requested tests asserting TTS speaks the data-model text for the selected language in that language. TDD: write the failing tests (T026–T027) first, then implement (T028–T030).

- [X] T026 [P] Write failing component test in `tests/component/languageSwitchSpeech.test.tsx` — render `<App>` in Learn mode with a repo fixture whose animals carry `uk` and `es` translations (with `learnPhrase`); click a flag and assert `tts.speak` is called with that language's localized learn phrase AND the matching `ttsLang` (tap 🇺🇦 → `speak(<uk learnPhrase>, 'uk-UA')`; then 🇪🇸 → `speak(<es learnPhrase>, 'es-ES')`) per user-request / FR-004 / US2 AC1 / SC-002 (missing)
- [X] T027 [P] Write failing component test in `tests/component/languageSwitchSpeech.test.tsx` — render `<App>`, switch to Quiz mode, then tap a different flag (🇺🇦→🇪🇸) and assert `tts.speak` is called with the Spanish quiz prompt AND `'es-ES'`, and that listening restarts in the new language (recognition `listenOnce` invoked again after the switch) per user-request / FR-004 / US2 AC4 (missing)
- [X] T028 Implement Learn-mode immediate re-speak on language change in `src/components/LearnMode.tsx` — when `langConfig.ttsLang` changes for the same animal, cancel current audio and re-speak the current animal's `learnPhrase` in the new `ttsLang`; relax the `lastSpokenId` guard so a language change re-speaks while still preventing duplicate same-language repeats; makes T026 green per FR-004 / US2 AC1-2 (missing)
- [X] T029 Implement Quiz-mode immediate re-ask + relisten on language change in `src/components/QuizMode.tsx` — re-run the ask→listen cycle when `lang` changes (speak the current `quizPrompt` in the new `ttsLang`, then listen via the new-language recognition, falling back to reveal/skip when unavailable) and clear any pending auto-advance so a mid-cheer switch cannot bounce the child forward; makes T027 green per FR-004 / US2 AC4-5 / Edge case (missing)
- [X] T030 Wire the switch trigger in `src/components/App.tsx` `handleLanguageChange` — keep the existing `ttsService.cancel()` + recognition re-creation and ensure the active mode re-speaks in the new language on switch (drive T028/T029, e.g. via lang-keyed effects); confirm tapping the already-active flag stays a no-op (no speech, no state change) per FR-010 / US2 AC5 (partial)
