# Implementation Plan: Animal Sounds Game

**Branch**: `001-animal-sounds-quiz` | **Date**: 2026-08-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-animal-sounds-quiz/spec.md`

## Summary

A browser-based, single-page learning game for children aged 2–6. It shows large cartoon
animal pictures one at a time. In **Learn mode** it speaks a friendly sentence naming the
animal and its sound ("The cow says muuuu"). In **Quiz mode** it asks "What does the cow
say?", listens to the child, and checks whether the spoken answer contains the expected
sound, revealing the answer after two misses. Navigation is by swipe or large buttons, the
collection loops, and modes can be switched at any time.

Technical approach: a React + TypeScript single-page app (no backend). Text-to-speech uses
the browser's native `SpeechSynthesis` API. Speech **recognition runs entirely on-device**
via a WebAssembly offline recognizer (no child audio or transcript ever leaves the device,
per clarification), constrained to the small vocabulary of expected animal sounds and
matched leniently. Animals are defined by image files plus a companion metadata file
(JSON), so content authors add animals without code changes. Browser capabilities (speech
synthesis, microphone/recognition) are wrapped behind service interfaces so game logic and
UI are unit-testable with mocks (TDD).

## Technical Context

**Language/Version**: TypeScript 5.x, targeting ES2022; React 18

**Primary Dependencies**: React 18 + Vite (build/dev), `vosk-browser` (WASM offline speech recognition) running in a Web Worker, native Web Speech `SpeechSynthesis` for TTS. Vitest + React Testing Library for tests; optional Playwright for smoke/e2e.

**Storage**: No server storage. Animal metadata is a static `animals.json` file; images are static assets under the public asset folder. Recognizer model files are static WASM/model assets served with the app.

**Testing**: Vitest + React Testing Library (unit/component, TDD), jsdom environment. Browser speech/mic APIs abstracted behind service interfaces and mocked in tests. A short manual/Playwright quickstart validates real mic/TTS behavior.

**Target Platform**: Modern evergreen browsers (Chrome, Edge, Safari, Firefox) on tablet, phone, and desktop; primary target is a tablet in a home setting. Requires microphone for Quiz mode.

**Project Type**: Single-page web application (frontend only)

**Performance Goals**: New animal shown and its announcement begun within 1s of a swipe/button (SC-003); UI interactions and swipe animation at ~60fps; recognition result surfaced within ~2s of the child finishing speaking in a quiet room.

**Constraints**: Offline-capable after initial load (no network dependency for core play or recognition); **no recorded child audio or transcript leaves the device** (SC-008); graceful degradation when TTS or microphone is unavailable; large child-friendly touch targets (FR-014); TTS playback must be reliable on repeated replay taps (research R9); the offline **service worker is registered in production only** — dev never cache-serves modules (research R10).

**Scale/Scope**: Single child, no accounts, no persistence beyond current session. ~2 screens/modes; initial animal roster on the order of ~10–20 animals, extensible via metadata.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution (`.specify/memory/constitution.md`) is still the unpopulated
template — it defines **no ratified principles or gates**. There are therefore no formal
constitution gates to evaluate. In their absence this plan applies two standing guidelines:

- **Test-First (from the user's global development preferences)**: production code is written
  only to satisfy a failing test; browser APIs are abstracted behind interfaces so logic is
  testable without a real browser. → Honored (services are mockable; Vitest is the harness).
- **Simplicity / YAGNI**: no backend, no database, no accounts — a static SPA with a JSON
  metadata file. → Honored.

**Initial gate result: PASS** (no gates defined; no violations). Re-checked after Phase 1: still PASS — see end of Phase 1. No entries required in Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-animal-sounds-quiz/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── animals-metadata.schema.json   # Content contract: animals.json shape
│   └── speech-services.md             # Internal service interface contracts
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created here)
```

### Source Code (repository root)

```text
index.html
public/
└── assets/
    ├── animals/                 # Animal picture files (png/avif/…)
    ├── animals.json             # Companion metadata (name, sound, accepted answers, image ref)
    └── models/                  # On-device recognizer WASM + model files

src/
├── main.tsx                     # App bootstrap
├── App.tsx                      # Mode routing (Learn / Quiz), collection provider
├── domain/                      # Framework-free logic (pure, unit-tested first)
│   ├── animal.ts                # Animal, AnimalCollection (next/prev/loop)
│   ├── answerMatcher.ts         # Lenient match: transcript ↔ accepted answers
│   └── quizSession.ts           # Attempt tracking, 2-miss reveal rule
├── services/                    # Browser-capability adapters (behind interfaces)
│   ├── speechSynthesis.ts       # TtsService (Web Speech SpeechSynthesis)
│   ├── speechRecognition.ts     # RecognitionService (vosk-browser worker)
│   ├── recognition.worker.ts    # WASM recognizer worker
│   └── animalsRepository.ts     # Loads + validates animals.json
├── components/
│   ├── AnimalCard.tsx           # Picture + swipe/buttons + replay
│   ├── LearnMode.tsx
│   ├── QuizMode.tsx
│   ├── ModeToggle.tsx
│   └── Feedback.tsx             # Correct/try-again/reveal UI
└── styles/

tests/
├── unit/                        # domain/* and answerMatcher, quizSession (TDD core)
├── component/                   # React Testing Library, services mocked
└── e2e/                         # Optional Playwright smoke (real TTS/mic, manual-friendly)
```

**Structure Decision**: Single-project frontend SPA. A `domain/` layer holds all
framework-free, deterministic game logic (collection navigation, lenient answer matching,
the 2-miss quiz rule) and is developed test-first. A `services/` layer wraps the two
browser capabilities (speech synthesis; on-device recognition) plus metadata loading behind
narrow interfaces so components and domain logic are tested with mocks and the real APIs are
swapped in at runtime. React components are thin views over that logic.

## Complexity Tracking

> No constitution gates are defined and no violations exist; this section is intentionally empty.
