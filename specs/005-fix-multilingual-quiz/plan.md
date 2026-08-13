# Implementation Plan: Fix Multilingual Quiz (Localized Feedback + Non-English Recognition)

**Branch**: `005-fix-multilingual-quiz` | **Date**: 2026-08-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-fix-multilingual-quiz/spec.md`

## Summary

Fix two independent defects that break the quiz in Ukrainian and Spanish:

1. **Localized feedback** — the quiz reaction/result lines (`listening`, `correct`, `tryAgain`, `revealed`) are hard-coded English in `Feedback.tsx`. Move them into the existing per-language string tables so every feedback state renders in the selected language, with the reveal line embedding the localized sound word inside a fully localized sentence. The already-localized `micUnavailable` notice is preserved unchanged.
2. **Correct, effective non-English recognition** — two root causes:
   - The answer matcher's `normalize()` strips every non-`[a-z]` character, erasing Cyrillic answers to nothing. Make normalization **script-aware** (Unicode letter class) so Cyrillic and Latin answers both survive, while keeping the existing child-friendly leniency (repeated-letter collapse, edit-distance fuzz, substring/word match) and per-language isolation (the matcher only ever sees the selected language's accepted answers).
   - Recognition for `uk`/`es` currently routes to the browser cloud Web Speech API and silently falls back to the **English** Vosk model when that API is absent. Per the recorded decision (FR-011), replace this with **per-language bundled on-device Vosk recognizers**: each language gets its own model, loaded lazily for the selected language, cached in-session, and persisted across restarts via the existing service-worker cache. When a language's model is unavailable, degrade honestly (localized unavailable notice + reveal/advance) and never substitute another language's recognizer.

The work is ordered so the two P1 correctness fixes (feedback strings, script-aware matcher) land first and independently, followed by the P2 recognizer wiring and honest degradation.

## Technical Context

**Language/Version**: TypeScript 5.5, React 18.3, ES modules (`"type": "module"`)

**Primary Dependencies**: React 18 + react-dom, Vite 5 (build/dev), `vosk-browser` ^0.0.8 (optional dependency — WebAssembly Kaldi recognizer running fully on-device)

**Storage**: Browser Cache Storage via the existing service worker (`public/sw.js`, cache-first for same-origin GETs) for recognizer-model persistence across restarts (FR-014); `localStorage` for the selected-language preference (existing `LocalStorageLanguageStore`)

**Testing**: Vitest (unit + component, jsdom + Testing Library) for domain/UI; Playwright (e2e) for smoke and the privacy/no-network guarantee

**Target Platform**: Modern desktop and mobile browsers **including child-friendly in-app browsers**; requires WebAssembly + Web Audio + `getUserMedia`. Offline-capable PWA after first load

**Project Type**: Single-page web app (frontend only, static hosting) — Structure Decision below

**Performance Goals**: Recognizer models are lazy-loaded only for the selected language and cached; answer matching is O(transcript × answers) trivial. No blocking of the child at any point — TTS ask/listen cycle unchanged

**Constraints**: **On-device only** — recorded audio and transcripts MUST NOT leave the device (FR-011). Must work offline after a language's first successful model load (FR-014). Larger app/model download for uk/es is an accepted trade-off for a uniform privacy guarantee and reliability inside in-app browsers

**Scale/Scope**: 3 languages (uk, es, en), a small animal set, a single-screen game. This feature touches ~2 domain modules, 2 components, 1 service, the string tables, and adds 2 bundled model assets

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution (`.specify/memory/constitution.md`) is an unpopulated template — it defines **no ratified principles or gates**, so there are no project-level constraints to violate. The user's global development preferences (test-first / TDD, Red→Green→Refactor) are honored: every change in this plan is expressed as a failing-test-first task in the tasks phase, and the existing Vitest/Playwright suites gate regressions (FR-009, SC-006).

**Result: PASS** (no constitution gates defined; TDD workflow adopted for all tasks).

## Project Structure

### Documentation (this feature)

```text
specs/005-fix-multilingual-quiz/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── answer-matcher.md
│   ├── feedback-strings.md
│   └── recognition-service.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created here)
```

### Source Code (repository root)

```text
src/
├── domain/
│   ├── answerMatcher.ts      # CHANGE: script-aware normalize() (Unicode letter class)
│   ├── language.ts           # CHANGE: add localized quiz-feedback strings (correct/tryAgain/
│   │                         #         revealed template/listening) to the per-language tables
│   ├── cheers.ts             # (unchanged) already localized celebratory phrases
│   └── animal.ts             # (unchanged) per-language resolution already isolates answers
├── components/
│   ├── QuizMode.tsx          # (minor) pass feedback strings through; wiring unchanged
│   └── Feedback.tsx          # CHANGE: render localized strings instead of hard-coded English
├── services/
│   └── speechRecognition.ts  # CHANGE: per-language on-device Vosk service + model registry;
│                             #         remove cloud Web Speech + English fallback for uk/es
└── App.tsx                   # (unchanged) already re-creates recognition service on lang change

public/
├── assets/
│   └── models/
│       ├── vosk-model-small-en-us-0.15.tar.gz   # existing (English)
│       ├── vosk-model-small-uk-v3-nano.tar.gz   # ADD (Ukrainian, lazy-loaded)
│       └── vosk-model-small-es-0.42.tar.gz      # ADD (Spanish, lazy-loaded)
└── sw.js                     # (unchanged) cache-first already persists models across restarts

tests/
├── unit/
│   ├── answerMatcher.test.ts       # EXTEND: Cyrillic/Spanish accept + cross-language reject
│   └── speechRecognition.test.ts   # REWRITE: per-language model selection + no-fallback
└── component/
    └── quizMode.test.tsx / new feedbackLocalized.test.tsx  # localized feedback states
```

**Structure Decision**: Single-project frontend SPA (no backend). All work lives under the existing `src/` domain/component/service layers plus two new static model assets under `public/assets/models/`. This matches the current architecture — domain logic is framework-free and unit-tested, services are swappable behind interfaces (`RecognitionService`), and components consume injected services — so the fixes slot into established seams without new layers.

## Complexity Tracking

> No constitution gates are defined, and this plan introduces no architectural complexity requiring justification (no new projects, patterns, or abstractions — it reuses the existing `RecognitionService` interface and string-table pattern). Section intentionally empty.
