# Phase 0 Research: Quiz Cheer & Auto-Advance

This feature extends the Quiz mode already researched in `001-animal-sounds-quiz` (see its
R1 TTS and R5 speech-sequencing notes). Only the deltas needed for the cheer and auto-advance
are researched here. There were no unresolved `NEEDS CLARIFICATION` markers in the spec; the
two soft parameters (delay length, cheer wording) had documented defaults — recorded below as
decisions.

## R1. Sequencing the cheer before the next question (FR-006, no overlap)

**Decision**: Reuse the existing `TtsService.speak()` promise, which resolves on the utterance's
`onend`/`onerror` (see `src/services/speechSynthesis.ts`). On a correct answer, `await
tts.speak(cheer)` and only *then* start the post-cheer delay; the next question is spoken by the
existing per-animal effect after `onNext` fires. Because `speak()` internally calls
`synth.cancel()` before each new utterance and we advance only after the cheer's promise settles,
the cheer and the next question can never play simultaneously.

**Rationale**: The promise-resolves-on-end contract already exists and is relied on elsewhere;
awaiting it gives correct ordering with no new machinery and satisfies FR-006/SC-003 directly.

**Alternatives considered**: A fixed timer sized to "typical cheer length" — rejected as fragile
(voice/rate variance would clip audio or overlap). Chaining via `onNext` inside `utterance.onend`
without awaiting — rejected as harder to test than the existing awaitable promise.

## R2. Cancellable auto-advance timer (FR-004, FR-005, FR-007)

**Decision**: After the cheer resolves, arm a single `setTimeout` (stored in a ref) that calls
`onNext`. Disarm/clear it in every path that leaves the current animal: manual `navigate()`
(Next/Prev), mode switch and unmount (the existing `animal.id` effect cleanup already runs on
these), and tab hide via a `document.visibilitychange` listener. Guard so at most one timer is
armed and a fired timer nulls its own ref.

**Rationale**: A ref-held timer cleared in the same effect cleanup that already cancels TTS and
recognition centralizes teardown and guarantees no stale or double advance (FR-005 edge case:
manual advance during the delay must not skip an extra animal).

**Alternatives considered**: Driving the delay off React state + `useEffect` — rejected as more
re-render churn and harder to cancel precisely. A debounce utility — unnecessary for a single
one-shot timer.

## R3. Post-cheer delay length (spec Assumption → decision)

**Decision**: `AUTO_ADVANCE_DELAY_MS = 2000` (2s) measured **after** the cheer finishes, exported
as a named constant so it is easy to tune and to assert in tests.

**Rationale**: Falls in the spec's assumed 1.5–2.5s window — long enough to register the
celebration, short enough to keep flow. A named constant keeps the "short delay" wording from
001's style and avoids magic numbers.

**Alternatives considered**: Delay measured from answer-recognition (overlaps the cheer) —
rejected; the pause is meant to follow the celebration. User-configurable delay — YAGNI for v1.

## R4. Cheer phrase selection (FR-001, FR-002; spec Assumption)

**Decision**: A pure `cheers.ts` module exporting a small `CHEERS` array of short English
celebratory phrases (e.g., "Yay! Great job!", "Woohoo! Well done!", "Awesome!") and a
`nextCheer(previous?)` picker that returns a phrase from the set while avoiding an immediate
repeat of `previous`. `QuizMode` keeps the last-used cheer in a ref to pass as `previous`.

**Rationale**: Keeping selection pure and framework-free makes rotation/no-repeat deterministically
unit-testable (TDD) and separates *what to say* from *when to say it*. Distinct celebratory wording
satisfies FR-002's "audibly distinct from neutral speech".

**Alternatives considered**: A single fixed cheer — rejected as repetitive over a full loop
(spec calls for a rotating set). Random with possible immediate repeats — rejected; back-to-back
identical cheers feel less rewarding. Per-animal custom cheers in metadata — out of scope,
would touch the content schema for no clear v1 benefit.

## R5. Distinct celebratory delivery (FR-002)

**Decision**: Distinctiveness comes from **wording** (exclamatory cheer vs. the neutral "What
does the … say?") using the existing single utterance path; no second voice/pitch profile is
introduced for v1. The visual `Feedback` "correct" state already renders a celebratory
"🎉 Yay! That's right!" line, which doubles as the no-audio fallback.

**Rationale**: Wording alone reliably reads as a celebration and needs no changes to the TTS
service. Adding a separate pitch/rate for cheers is a possible future polish but is unnecessary
to meet FR-002 and would expand the `TtsService` contract.

**Alternatives considered**: Extending `TtsService.speak()` with prosody options — deferred; not
required and would enlarge a stable contract.

## R6. Testing strategy (TDD)

**Decision**: (1) Unit-test `nextCheer` first — every result is a member of `CHEERS`, and given a
`previous`, the result never equals it (across many draws) while a single-element edge stays
safe. (2) Component-test `QuizMode` with a mocked `TtsService` whose `speak` returns a controllable
promise and `vi.useFakeTimers()`: correct answer → cheer spoken → after `AUTO_ADVANCE_DELAY_MS`,
`onNext` called once; manual Next during the delay → `onNext` once, no second (timer cleared);
incorrect → no cheer, no advance; second miss (`revealed`) → sound spoken but `onNext` not called;
TTS-unavailable → celebratory text shown and auto-advance still fires.

**Rationale**: Fake timers + an awaitable mocked `speak` make the sequencing and cancellation
deterministic without real audio, matching 001's component-test approach.

**Alternatives considered**: Real timers with `waitFor` — flakier and slower. Playwright-only
verification — kept as a manual quickstart check, not the primary gate.

## Open items deferred (non-blocking)

- Optional distinct cheer **prosody** (higher pitch/faster rate) — future polish (R5).
- Whether the 2-miss **reveal** should also auto-advance — spec assumes **no**; revisit only if
  play-testing shows children get stuck on the reveal screen.
