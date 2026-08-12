# Phase 0 Research: Animal Sounds Game

All Technical Context unknowns are resolved below. The central research question was how to
satisfy the **on-device-only voice processing** clarification while keeping the "native
browser text-to-speech" intent from the original description.

## R1. Text-to-speech (speaking sentences and questions)

**Decision**: Use the native Web Speech API `SpeechSynthesis` (`speechSynthesis.speak(new SpeechSynthesisUtterance(text))`).

**Rationale**: Built into all target browsers, zero dependencies/downloads, honors the
original "native text-to-speech" intent, and speaks locally. TTS emits audio *out* of the
device — it does not capture or transmit the child's voice — so it is unaffected by the
on-device privacy clarification (which concerns recorded child audio/transcript). Supports
per-utterance rate/pitch tuning for a friendly children's voice and fires `onend` events we
use to sequence UI.

**Alternatives considered**:
- Pre-recorded audio clips per sentence — rejected: heavier assets, no flexibility for new
  animals added via metadata, and TTS quality is adequate.
- Cloud TTS (e.g., hosted neural voices) — rejected: needs network, adds cost/latency, and
  is unnecessary for short fixed phrases.

**Fallback**: If `speechSynthesis` is unavailable or has no voices, display the sentence/
question as on-screen text (FR-012, SC-006).

## R2. Speech recognition (checking the child's spoken answer) — the key decision

**Decision**: Run recognition **fully on-device** using a WebAssembly offline recognizer,
`vosk-browser` (Vosk small models compiled to WASM), inside a Web Worker, constrained to a
small grammar of the expected animal-sound words.

**Rationale**:
- The Web Speech API `SpeechRecognition` is **disqualified for recognition**: in Chrome/Edge
  it streams microphone audio to Google's servers, which directly violates the clarification
  "no audio or transcript ever leaves the device" (FR-007, SC-008). Its availability and
  on-device behavior are also inconsistent across browsers.
- We do **not** need general dictation. Quiz matching is a small closed vocabulary (the
  accepted answers per animal, e.g., "muuu", "moo", "woof", "meow"). A lightweight offline
  recognizer with a restricted grammar is accurate enough and small.
- `vosk-browser` runs entirely client-side (WASM + a small model), supports a runtime
  grammar/keyword list to bias toward expected words, and works offline after first load —
  satisfying offline-capable and privacy constraints.
- Running it in a Web Worker keeps the main thread responsive (60fps UI, SC-003).

**Alternatives considered**:
- Web Speech `SpeechRecognition` — rejected: cloud-based in Chrome; privacy violation.
- `transformers.js` Whisper-tiny (WASM) — viable and fully offline, but a larger model
  download and heavier compute than needed for closed-vocabulary matching; keep as a
  documented fallback if Vosk model quality on toddler speech proves insufficient.
- Raw audio heuristics (energy/pitch/duration only, no ASR) — rejected: too unreliable to
  distinguish animal sounds and meet SC-004/SC-005 accuracy targets.

**Consequence for requirements**: FR-007's "listen and determine whether it contains the
expected sound" is implemented as: recognizer produces a text hypothesis on-device → the
`answerMatcher` checks it against that animal's accepted answers.

## R3. Lenient answer matching (FR-013, SC-004, SC-005)

**Decision**: Normalize the recognizer hypothesis (lowercase, strip punctuation, collapse
repeated letters, e.g., "muuuuu" → "mu"+repeat-tolerant) and accept if it contains any of
the animal's accepted answers under a fuzzy comparison: token substring match OR normalized
edit distance within a small threshold (accept if distance ≤ ~30% of the target length).

**Rationale**: Young children pronounce approximately ("mooo" vs "muuu"); repeated-vowel and
edit-distance tolerance accepts genuine attempts (target ≥90% accept, SC-004) while unrelated
words fall outside the threshold (target <5% false accept, SC-005). Accepted-answer lists per
animal let content authors tune this without code.

**Alternatives considered**: Exact string equality (rejected: too strict for toddlers);
phoneme-level matching (rejected: over-engineered, no phonemizer needed for a fixed small set).

## R4. Navigation & gestures (FR-003, FR-009, FR-014)

**Decision**: Support both large on-screen Prev/Next buttons and horizontal swipe via
pointer/touch events (a small, well-tested swipe hook or a light library such as
`@use-gesture/react`). Collection navigation is a pure `AnimalCollection` with looping
next/prev in the domain layer.

**Rationale**: Toddlers use touch; parents may use buttons. Keeping navigation logic in the
pure domain layer makes wrap-around (FR-015) unit-testable independent of gestures.

**Alternatives considered**: Buttons only (rejected: spec requires swipe); a heavy carousel
framework (rejected: unnecessary, harder to keep 60fps and accessible large targets).

## R5. Debounce / speech sequencing (edge case: rapid swiping)

**Decision**: On each animal change, cancel any in-flight utterance (`speechSynthesis.cancel()`)
and stop any active recognition before starting the new animal's speech; ignore/queue-collapse
rapid repeated navigation so only the currently displayed animal speaks.

**Rationale**: Prevents overlapping audio (spec edge case) and keeps behavior predictable.

## R6. Metadata format & loading (FR-005)

**Decision**: A single `public/assets/animals.json` array; each entry references an image
file in `assets/animals/`, the animal name, the TTS sound word, and a list of accepted
spoken answers. Loaded once at startup, validated against a JSON schema (see contracts);
invalid/missing entries are skipped with a friendly empty-state if none remain (edge case).

**Rationale**: Editing JSON + dropping an image adds an animal with no code change (FR-005).
Static file = offline, cacheable, no backend.

**Alternatives considered**: Filename-encoded names + built-in lookup (rejected in
clarification); an in-app hardcoded catalog (rejected: not author-editable without code).

## R7. Testing strategy (TDD)

**Decision**: Vitest + React Testing Library in jsdom.
- **Unit (test-first)**: `answerMatcher`, `AnimalCollection` (next/prev/loop), `quizSession`
  (attempt counting, 2-miss reveal) — pure, no browser.
- **Component**: Learn/Quiz/ModeToggle with `TtsService` and `RecognitionService` **mocked**
  through their interfaces (assert "spoke the right sentence", simulate recognized answers).
- **e2e/smoke (optional, manual-friendly)**: Playwright to load the app, verify picture +
  on-screen text render and navigation; real mic/TTS validated manually per quickstart
  (browser mic automation is unreliable).

**Rationale**: Abstracting browser APIs behind interfaces makes the core logic deterministic
and honors the test-first preference. Real-device audio behavior is validated via quickstart.

## R8. Build tooling & platform

**Decision**: Vite + React + TypeScript; static build deployable to any static host; PWA/
offline caching optional (service worker) to fully satisfy offline-capable.

**Rationale**: Fast dev server, simple static output, first-class TS/React support, easy WASM
asset handling for the recognizer.

## R9. Reliable TTS playback (repeated replay) — FR-004

**Decision**: Make `WebSpeechTtsService.speak()` robust against Web Speech engine quirks:
1. Cancel any in-flight utterance, then **defer** `speechSynthesis.speak()` to a later tick
   (macrotask) so it does not run in the same tick as `cancel()`.
2. Call `resume()` if the engine reports `paused` before speaking.
3. If `getVoices()` is empty, wait for the `voiceschanged` event (with a short timeout
   fallback) before speaking.

**Rationale**: Chrome silently drops an utterance when `cancel()` is immediately followed by
`speak()` in the same tick — the exact "tap replay, hear nothing" symptom, worst on repeated
taps. Chrome can also leave the engine paused, and some browsers populate voices
asynchronously so an early `speak()` produces no audio. Deferring + resume + voice-readiness
covers all three.

**Alternatives considered**: Pre-recorded audio clips (rejected earlier, R1); a third-party
TTS wrapper library (rejected — the workaround is a few lines and avoids a dependency).

## R10. Service worker registered in production only

**Decision**: Register `public/sw.js` only when `import.meta.env.PROD` is true; in dev,
actively unregister any existing service worker.

**Rationale**: A cache-first service worker in the Vite dev server serves stale modules and
`assets/animals.json`, breaking HMR and causing the app to run a stale/mixed bundle after
edits (observed during development). Offline caching is only meaningful for the built app, so
gating registration to production removes the dev hazard while preserving the offline goal
(R8) in production.

**Alternatives considered**: Network-first SW in dev (rejected — still risks staleness and
adds complexity); no SW at all (rejected — loses the production offline-capable constraint).

## Open items deferred (non-blocking)

- **Exact initial roster** (which ~10–20 animals) — content decision; the app is roster-driven
  via `animals.json`, so this does not block architecture (spec Outstanding item).
- **Deeper accessibility** (beyond large targets) — English-only v1 per spec; revisit later.
