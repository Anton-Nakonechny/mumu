# Implementation Plan: Quiz Cheer & Auto-Advance

**Branch**: `002-quiz-cheer-advance` | **Date**: 2026-08-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-quiz-cheer-advance/spec.md`

## Summary

Enhance the existing Quiz mode so a **recognized correct answer** triggers an enthusiastic
spoken TTS cheer ("Yay! Great job!") and, after the cheer finishes and a short child-friendly
pause, the game **auto-advances** to the next animal and asks its question — hands-free, so a
pre-reader can play a whole loop with only their voice.

Technical approach: no new dependencies and no backend change. Add one small framework-free
domain module (`cheers.ts`) that picks a celebratory phrase from a rotating set without
immediately repeating — pure and unit-tested first (TDD). Orchestrate the reaction inside the
existing `QuizMode` component: when `QuizSession` reports the `correct` phase, `await`
the existing `TtsService.speak()` of the chosen cheer (its promise resolves on utterance end,
which guarantees the cheer and the next question never overlap — FR-006), then arm a **single
cancellable timer** that calls the existing `onNext`. The timer is disarmed by any manual
navigation, mode switch, unmount, or the tab being hidden (FR-005, FR-007). When TTS is
unavailable, the existing celebratory `Feedback` text stands in for the spoken cheer and the
auto-advance still fires (FR-008). Only the `correct` phase is affected — the `tryAgain` and
`revealed` (2-miss) paths keep today's behavior (FR-003, and the reveal path does **not**
auto-advance).

## Technical Context

**Language/Version**: TypeScript 5.x (ES2022), React 18 — unchanged from 001.

**Primary Dependencies**: Existing only — React 18 + Vite, native Web Speech `SpeechSynthesis` (`TtsService`), `vosk-browser` recognition. Vitest + React Testing Library for tests. **No new dependencies.**

**Storage**: N/A. Cheer phrases are a static in-code constant (no metadata/schema change; `animals.json` is untouched).

**Testing**: Vitest + React Testing Library (jsdom). Pure cheer picker unit-tested; auto-advance/cheer sequencing component-tested with a mocked `TtsService` (resolvable/awaitable `speak`) and fake timers (`vi.useFakeTimers`) to assert timing and cancellation deterministically.

**Target Platform**: Same evergreen browsers (tablet/phone/desktop) as 001.

**Project Type**: Single-page web application (frontend only) — extends existing app.

**Performance Goals**: Cheer begins within ~1s of the answer being recognized (SC-003); next question begins only after the cheer ends (no overlap); auto-advance pause ≈2s after the cheer.

**Constraints**: Reuse the existing `TtsService`/navigation seams — no changes to `QuizSession`'s attempt/reveal logic and no new browser APIs beyond `setTimeout`/`document.visibilitychange`. Exactly one pending auto-advance at a time; it must never fire after the child has left the animal by any means (no double-advance, no stale advance).

**Scale/Scope**: One new pure module (~30 LOC), edits to one component (`QuizMode.tsx`), optional copy tweaks to `Feedback.tsx`. No scoring, streaks, persistence, or accounts.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution (`.specify/memory/constitution.md`) is still the unpopulated
template — it defines **no ratified principles or gates**, so there are no formal gates to
evaluate. In their absence this plan applies the same two standing guidelines as 001:

- **Test-First (user's global preferences)**: the cheer picker is pure and unit-tested before
  implementation; cheer/auto-advance orchestration is component-tested with a mocked TTS and
  fake timers. → Honored.
- **Simplicity / YAGNI**: no new dependencies, no new services, no data-model/schema change —
  one small pure module plus a cancellable timer inside the existing component. → Honored.

**Initial gate result: PASS** (no gates defined; no violations). Re-checked after Phase 1:
still PASS — see end of Phase 1. Complexity Tracking intentionally empty.

## Project Structure

### Documentation (this feature)

```text
specs/002-quiz-cheer-advance/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── quiz-cheer-advance.md   # Cheer-picker + auto-advance behavior contract
├── checklists/
│   └── requirements.md  # From /speckit-specify
└── tasks.md             # Phase 2 output (/speckit-tasks - NOT created here)
```

### Source Code (repository root) — changes only

```text
src/
├── domain/
│   └── cheers.ts                # NEW: rotating celebratory-phrase picker (pure, TDD)
└── components/
    ├── QuizMode.tsx             # EDIT: on 'correct' → speak cheer, arm cancellable auto-advance
    └── Feedback.tsx             # (optional) reuse/clarify celebratory correct-answer copy

tests/
├── unit/
│   └── cheers.test.ts           # NEW: rotation / no-immediate-repeat / membership
└── component/
    ├── quizCheer.test.tsx       # NEW (US1): cheer spoken on correct (a CHEERS member),
    │                            #      no cheer on miss/reveal, celebratory text when TTS off
    └── quizAutoAdvance.test.tsx # NEW (US2): delay→onNext, cancel on nav/mode/hide,
                                 #      no auto-advance on miss/reveal, wrap past last animal
```

**Structure Decision**: Single-project frontend SPA (unchanged from 001). New celebratory-copy
selection lives in the framework-free `domain/` layer as a pure function (`cheers.ts`), keeping
it deterministic and unit-testable first. All time/sequence orchestration (await-cheer →
cancellable timer → `onNext`) stays inside `QuizMode.tsx`, reusing the existing `TtsService`
promise-resolves-on-end contract and the existing `onNext`/`onPrev` navigation seams from
`App.tsx`. `QuizSession` and its `QuizPhase` are reused as-is (the `correct` phase already
exists); no domain state machine changes are required.

## Complexity Tracking

> No constitution gates are defined and no violations exist; this section is intentionally empty.
