# Quickstart: Quiz Cheer & Auto-Advance

Validation guide for the correct-answer cheer + auto-advance enhancement to Quiz mode. See
[spec.md](./spec.md), [data-model.md](./data-model.md), and
[contracts/quiz-cheer-advance.md](./contracts/quiz-cheer-advance.md) for details.

## Prerequisites

- Dependencies installed: `npm install` (no new packages are required for this feature).
- Feature branch `002-quiz-cheer-advance` checked out.

## Automated checks (primary gate, TDD)

Write these tests **first** and watch them fail before implementing:

```bash
# Unit: cheer picker (membership + no immediate repeat)
npm run test -- cheers

# Component (US1): cheer spoken on a correct answer (mocked TTS)
npm run test -- quizCheer

# Component (US2): cancellable auto-advance (mocked TTS, fake timers)
npm run test -- quizAutoAdvance

# Full suite + lint before finishing
npm run test
npm run lint
```

**Expected once implemented (maps to contract §3):**
- `nextCheer()` returns a `CHEERS` member and never repeats the given `previous` (when >1 phrase).
- Correct answer → `tts.speak(<cheer>)` called (C1); next question not spoken until the cheer
  promise resolves (C2); after `AUTO_ADVANCE_DELAY_MS`, `onNext` called exactly once (C3).
- Manual Next during the delay → single advance, timer cleared (C4); mode switch / unmount / tab
  hidden → timer cleared, `onNext` not called later (C5).
- Incorrect answer → no cheer, no advance (C6); 2nd miss `revealed` → sound spoken, no cheer, no
  auto-advance (C7); TTS unavailable → celebratory text shown and auto-advance still fires (C8).

## Manual validation (real TTS in a browser)

```bash
npm run dev   # open the served URL, grant microphone permission
```

1. Switch to **Quiz mode**. The game asks "What does the … say?".
2. Say the expected sound. → You hear an enthusiastic spoken cheer (e.g., "Yay! Great job!"),
   audibly distinct from the question (FR-001/FR-002).
3. **Do nothing.** → After a short (~2s) pause the next animal appears and its question is asked,
   hands-free (FR-004). Confirm the cheer and the next question never talk over each other (FR-006).
4. Answer another animal correctly, then **press/swipe Next during the pause**. → The game advances
   once — no extra animal is skipped (FR-005).
5. Give a wrong answer. → A gentle "try again" plays; **no** cheer and **no** auto-advance (FR-003).
   Miss again to reach the reveal; confirm the sound is spoken but the game does **not** auto-advance.
6. (Optional) Mute/disable speech output. → A celebratory cheer message is shown on screen and the
   game still auto-advances after the delay (FR-008).

## Success signals

- All targeted tests green; `npm run test` and `npm run lint` pass.
- Every recognized correct answer produces a cheer (spoken or visual) and a hands-free advance
  (SC-001, SC-002); no overlapping speech (SC-003); no double-advance (SC-004); misses never cheer
  or advance (SC-005); a full loop is completable by voice alone (SC-006).
