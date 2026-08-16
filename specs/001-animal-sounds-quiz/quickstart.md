# Quickstart & Validation Guide: Animal Sounds Game

How to run the app and validate the feature end-to-end. Implementation details live in
`plan.md`, `data-model.md`, and `contracts/`; task breakdown comes from `/speckit-tasks`.

## Prerequisites

- Node.js 20+ and npm.
- A modern browser (Chrome/Edge/Safari/Firefox). Quiz mode needs a **microphone**.
- Sample content present: at least the dog (`.png`) and cow (`.png`) images under
  `public/assets/animals/` with matching entries in `public/assets/animals.json`
  (see `contracts/animals-metadata.schema.json`).

## Setup & run

```bash
npm install
npm run dev        # start Vite dev server, open the printed localhost URL
```

Build / preview production:

```bash
npm run build
npm run preview
```

## Automated tests (TDD harness)

```bash
npm test           # Vitest: unit (domain) + component (services mocked)
```

Expected: unit tests for `answerMatcher`, `AnimalCollection` (next/prev/loop), and
`quizSession` (2-miss reveal) pass; component tests assert the right phrases are spoken and
that a simulated recognized answer drives the correct feedback. These were written first (red)
before their implementations (green).

## Manual validation scenarios

Map to the spec's user stories and success criteria.

### Scenario A — Learn mode (User Story 1 / SC-002, SC-003)
1. Open the app (defaults to Learn mode).
2. **Expect**: the first animal's picture fills the screen and the app speaks
   "The {animal} says {sound}" (e.g., "The cow says muuuu"). If audio is off, the sentence
   shows as on-screen text.
3. Swipe left / press **Next** → next animal appears and is announced within ~1s.
4. Swipe right / press **Previous** → previous animal; from the first, wraps to the last.
5. Tap the picture / **say it again** → the sentence is spoken again.

### Scenario B — Quiz mode & voice (User Story 2 / SC-004, SC-005, FR-008a)
1. Switch to **Quiz mode** (ModeToggle).
2. Allow the microphone when prompted.
3. **Expect**: the app asks "What does the {animal} say?".
4. Say the sound (e.g., "muuuu") → celebratory correct feedback.
5. On a fresh animal, say something unrelated (e.g., "banana") → gentle "try again".
6. Miss again (unrelated or silence) → after the **2nd miss** the app reveals and speaks the
   correct sound, and lets you advance.
7. Swipe / **Next** at any point → next animal, new question.

### Scenario C — Mode switching (User Story 3)
- Toggle Learn ↔ Quiz on the same animal; behavior switches without reload.

### Scenario D — Graceful degradation (FR-011, FR-012, SC-006)
- **Deny** the microphone (or use a browser without recognition): Quiz mode clearly indicates
  listening is unavailable and still lets you reveal/skip — never stuck.
- Disable or mute TTS voices: sentences/questions appear as on-screen text; play continues.

### Scenario E — Privacy (SC-008)
- With DevTools **Network** tab open during Quiz mode, confirm **no outbound request carries
  recorded audio or a transcript** while the child speaks (recognition is on-device WASM).

### Scenario F — Content-driven roster (FR-005)
- Add a new image to `assets/animals/` and a matching entry to `animals.json`; reload → the
  new animal appears in rotation with no code change. Remove all entries → friendly empty
  state (no blank screen).

## Success-criteria checkpoints

| Check | Criterion |
|-------|-----------|
| First announcement reachable quickly, no adult help beyond opening | SC-001 |
| Every animal shows picture + spoken/text sentence | SC-002 |
| Next/Prev shows new animal + starts speech within 1s | SC-003 |
| Correct sound accepted (quiet room) | SC-004 |
| Unrelated answer rarely accepted | SC-005 |
| Never blocked when mic/TTS unavailable | SC-006 |
| No child audio/transcript leaves device | SC-008 |
