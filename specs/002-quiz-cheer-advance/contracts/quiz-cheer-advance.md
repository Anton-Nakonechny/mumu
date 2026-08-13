# Contract: Quiz Cheer & Auto-Advance

This feature exposes **no external/network interface**. The relevant contracts are the internal
cheer-selection function and the observable behavior of `QuizMode` on a correct answer. It reuses
the existing `TtsService` contract (`contracts/speech-services.md` in 001) without changing it.

## 1. Cheer selection contract — `src/domain/cheers.ts`

```ts
/** Non-empty set of short, celebratory, TTS-pronounceable English phrases. */
export const CHEERS: readonly string[];

/** Post-cheer pause before auto-advancing to the next animal (ms). */
export const AUTO_ADVANCE_DELAY_MS: number; // = 2000

/**
 * Pick a celebratory phrase for a correct answer.
 * - Always returns a member of CHEERS.
 * - If `previous` is given and CHEERS has >1 entry, the result !== previous (no immediate repeat).
 * - If CHEERS has exactly 1 entry, returns it (repeat allowed).
 */
export function nextCheer(previous?: string): string;
```

**Guarantees**
- `CHEERS.includes(nextCheer(p)) === true` for any `p`.
- For `CHEERS.length > 1`: `nextCheer(prev) !== prev`.
- Pure and deterministic-enough for tests (membership + no-repeat are the assertions; any internal
  randomness must still honor the no-immediate-repeat guarantee).

## 2. Reused TtsService contract (unchanged)

```ts
interface TtsService {
  isAvailable(): boolean;
  speak(text: string): Promise<void>; // resolves on utterance end OR immediately if unavailable
  cancel(): void;
}
```

This feature depends on the existing guarantee that `speak()` **resolves when the utterance ends**
(or immediately when TTS is unavailable). No new methods or options are added.

## 3. `QuizMode` behavioral contract (correct-answer path)

Given the Quiz-mode component with props `{ animal, tts, recognition, onNext, onPrev }`:

| # | Given | When | Then | Requirements |
|---|-------|------|------|--------------|
| C1 | question asked | answer recognized **correct** | `tts.speak(cheer)` is called with an argument that **is a member of `CHEERS`** (the objective FR-002 distinctiveness check — celebratory-set membership, not merely ≠ the prompt string) | FR-001, FR-002 |
| C2 | cheer is speaking | — | the next question is **not** spoken until the cheer promise resolves | FR-006, SC-003 |
| C3 | cheer promise resolved | `AUTO_ADVANCE_DELAY_MS` elapses | `onNext` is called exactly once | FR-004, SC-002 |
| C4 | delay counting down | child presses/swipes Next (or Prev) | navigation happens once; the pending timer is cleared (no second advance) | FR-005, SC-004 |
| C5 | delay counting down | mode switched / component unmounts / tab hidden | pending timer is cleared; `onNext` is **not** called later | FR-007 |
| C6 | question asked | answer recognized **incorrect** (not 2nd miss) | no cheer spoken; no auto-advance; existing "try again" feedback shown | FR-003, SC-005 |
| C7 | one prior miss | 2nd miss → `revealed` | sound word spoken (existing behavior); **no** cheer; **no** auto-advance | spec Assumption |
| C8 | TTS unavailable | answer recognized **correct** | celebratory text shown; auto-advance still fires after the delay | FR-008, SC-001 |
| C9 | auto-advance past last animal | timer fires on last animal | wraps to first animal (existing loop) | FR-009 |

## 4. Non-goals (explicitly out of contract)

- No change to `QuizSession` attempt counting or the 2-miss reveal threshold.
- No change to `animals.json` shape or the metadata schema.
- No new TTS prosody/voice options (distinctiveness is by wording only for v1).
- No scoring, streaks, persistence, or accounts.
