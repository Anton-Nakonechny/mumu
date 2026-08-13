# Implementation Plan: Multi-Language Flag Selector

**Branch**: `004-language-flags` | **Date**: 2026-08-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-language-flags/spec.md`

## Summary

Add three-language support (Ukrainian default, Spanish, English) to the animal-sounds game: a persistent flag-selector UI controls all spoken audio and displayed text simultaneously, with the selection persisted to `localStorage`. The implementation extends the data layer with per-language animal translations, updates TTS and recognition services to accept a BCP-47 language tag, and adds a lightweight UI-string dictionary — no external i18n library required.

## Technical Context

**Language/Version**: TypeScript 5.5.4 · React 18.3.1

**Primary Dependencies**: React, Vite 5, Vitest (unit + component), Playwright (E2E); `vosk-browser` optional (on-device EN recognition only)

**Storage**: `localStorage` — key `mumu-language`, value `'en' | 'uk' | 'es'`

**Testing**: Vitest for unit/component; Playwright for E2E smoke

**Target Platform**: Browser PWA, touch-first (children aged 2–6), mobile + desktop

**Project Type**: Single-page app / PWA

**Performance Goals**: Language switch completes within 1 second (SC-002)

**Constraints**: Touch targets ≥ 48 px; offline-capable after first load; no new npm dependencies; no cloud calls for animal data

**Scale/Scope**: 3 languages · 2 animals · ~10 UI strings per language

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

The constitution file is a placeholder template — no project-specific gates are defined. No violations identified. Proceed.

## Project Structure

### Documentation (this feature)

```text
specs/004-language-flags/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/           ← Phase 1 output
│   ├── TtsService.md
│   ├── RecognitionService.md
│   ├── AnimalsRepository.md
│   ├── LanguageStore.md
│   └── LanguageSelector.md
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── domain/
│   ├── animal.ts              # EXTEND: LocalizedAnimalData type; resolveAnimal()
│   ├── language.ts            # NEW: Language type, LANGUAGES constant, UI_STRINGS
│   ├── answerMatcher.ts       # unchanged
│   ├── cheers.ts              # EXTEND: per-language cheer sets
│   └── quizSession.ts         # unchanged
├── services/
│   ├── animalsRepository.ts   # EXTEND: loadLocalizedAnimals(); resolveAnimals(lang)
│   ├── speechSynthesis.ts     # EXTEND: speak(text, lang?) — sets utterance.lang
│   ├── speechRecognition.ts   # EXTEND: OnDeviceRecognitionService unchanged; new WebSpeechRecognitionService
│   └── languageStore.ts       # NEW: localStorage read/write for language preference
├── components/
│   ├── App.tsx (was root)     # EXTEND: language state, flag selector, localized animal resolution
│   ├── LanguageSelector.tsx   # NEW: 3 flag buttons
│   ├── LearnMode.tsx          # EXTEND: receives lang + strings; passes lang to TTS
│   ├── QuizMode.tsx           # EXTEND: receives lang + strings; passes lang to TTS + recognition
│   ├── ModeToggle.tsx         # EXTEND: receives strings for button labels
│   ├── AnimalCard.tsx         # unchanged
│   └── Feedback.tsx           # EXTEND: receives strings for UI labels
└── i18n/
    └── (none — strings live in domain/language.ts)

public/assets/
└── animals.json               # RESTRUCTURE: add translations map per animal

tests/
├── unit/
│   ├── language.test.ts       # NEW: resolveAnimal, UI_STRINGS, LanguageStore
│   └── ... (existing unchanged)
└── component/
    ├── languageSelector.test.tsx  # NEW
    └── ... (existing unchanged)
```

**Structure Decision**: Single web-app project (Option 1 variant). No new top-level directories. New `languageStore.ts` service and `LanguageSelector.tsx` component are additive; existing files extended in-place.

## Complexity Tracking

*No constitution violations — section skipped.*
