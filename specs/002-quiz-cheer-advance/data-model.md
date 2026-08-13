# Phase 1 Data Model: Quiz Cheer & Auto-Advance

This feature adds **no persisted data** and **no metadata/schema changes** (`animals.json` is
untouched). The "entities" below are in-memory constructs. Existing entities from
`001-animal-sounds-quiz` (`Animal`, `AnimalCollection`, `QuizSession`) are reused unchanged.

## New: Cheer (static, in-code)

Represents the celebratory phrase spoken/shown on a correct answer.

| Field | Type | Notes |
|-------|------|-------|
| (value) | `string` | A short English celebratory phrase, TTS-pronounceable. |

- **Source**: a static, non-empty `CHEERS: readonly string[]` constant in `src/domain/cheers.ts`.
- **Validation**: array is non-empty; each entry is a non-empty trimmed string. (Compile-time
  constant, so this is an authoring invariant, not runtime validation.)
- **Selection**: `nextCheer(previous?: string): string`
  - Returns a member of `CHEERS`.
  - When `previous` is supplied and `CHEERS.length > 1`, the result is **not equal** to
    `previous` (no immediate repeat).
  - When `CHEERS.length === 1`, returns that single element (repeat unavoidable, allowed).

## Reused (unchanged): Quiz Result / Phase

`QuizPhase = 'listening' | 'correct' | 'tryAgain' | 'revealed'` from `src/domain/quizSession.ts`.
This feature only *reacts* to the phase; it does not add or alter phases.

| Phase | Triggers cheer? | Triggers auto-advance? |
|-------|-----------------|------------------------|
| `listening` | No | No |
| `correct` | **Yes** | **Yes** (after cheer + delay) |
| `tryAgain` | No | No |
| `revealed` (2-miss) | No | **No** (child chooses when to move on) |

## New (component-local): Pending Auto-Advance

An in-memory, cancellable transition owned by `QuizMode.tsx`. Not a domain type; described here
as the state that drives FR-004/005/007.

| Aspect | Value |
|--------|-------|
| Storage | A `setTimeout` handle held in a `useRef` (at most one armed at a time). |
| Armed when | The `correct` cheer's `speak()` promise resolves. |
| Delay | `AUTO_ADVANCE_DELAY_MS` (2000 ms) after the cheer ends. |
| Fires | Calls `onNext` once, then clears its own ref. |
| Cancelled by | Manual Next/Prev (`navigate`), mode switch/unmount (animal-effect cleanup), tab hidden (`visibilitychange`). |
| Invariant | Never fires after the child has left the current animal (no double/stale advance). |

## State transitions (correct-answer path)

```text
listening --(recognized correct)--> correct
   correct: pick cheer (nextCheer(prevCheer)) → await tts.speak(cheer)
            → arm timer(AUTO_ADVANCE_DELAY_MS)
   timer fires --> onNext() --> [App changes current animal]
            --> QuizMode animal.id effect re-runs: reset session, speak next prompt
   (any manual nav / mode switch / unmount / tab hide before fire) --> timer cleared, no advance
```

## Constants introduced

| Name | Location | Value | Rationale |
|------|----------|-------|-----------|
| `CHEERS` | `src/domain/cheers.ts` | small `readonly string[]` | Rotating celebratory phrases (R4). |
| `AUTO_ADVANCE_DELAY_MS` | `src/domain/cheers.ts` (or `QuizMode`) | `2000` | Post-cheer pause; within spec's 1.5–2.5s (R3). |
