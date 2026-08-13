# Quickstart: Validate the Multilingual Quiz Fix

Run these scenarios to prove the feature end-to-end. They map to the spec's user stories and success criteria. Details of behavior live in [contracts/](./contracts/) and [data-model.md](./data-model.md).

## Prerequisites

- Node deps installed (`npm install`). `vosk-browser` is an optional dependency — recognition scenarios require it plus the bundled models.
- Ukrainian and Spanish Vosk models present alongside the English one:
  - `public/assets/models/vosk-model-small-en-us-0.15.tar.gz` (exists)
  - `public/assets/models/vosk-model-small-uk-v3-nano.tar.gz` (add)
  - `public/assets/models/vosk-model-small-es-0.42.tar.gz` (add)
- A microphone for the live recognition scenarios (US2/US3). Automated scenarios that don't need a mic run headless.

## 1. Automated: unit + component (US1, US2, FR-009)

```bash
npm test
```

Expected:
- **Answer matcher** ([contracts/answer-matcher.md](./contracts/answer-matcher.md)): new cases C1–C11 pass — Cyrillic ("муу"), stretched ("мууууу"), Spanish ("muu"), embedded-in-phrase accept; unrelated/cross-language words reject; **all existing English cases still pass** (SC-006).
- **Feedback strings** ([contracts/feedback-strings.md](./contracts/feedback-strings.md)): for uk and es, each phase (`listening`, `correct`, `tryAgain`, `revealed`) renders the localized line and contains **no** English fragment; `micUnavailable` still localized (US1-3, SC-001).
- **Recognition factory** ([contracts/recognition-service.md](./contracts/recognition-service.md)): `makeRecognitionService('uk'|'es'|'en')` selects the matching on-device model and never falls back to another language's model (SC-004).

## 2. Automated: lint + build + privacy e2e (FR-011)

```bash
npm run lint && npm run build
npx playwright test tests/e2e/privacy-network.spec.ts
```

Expected: build clean; the privacy/no-network e2e still passes, confirming no recorded audio/transcript leaves the device and no cloud speech endpoint is contacted (FR-011, SC — on-device only).

## 3. Manual: localized feedback in every state (US1 / SC-001)

```bash
npm run dev
```

For **Ukrainian** and again for **Spanish**:
1. Select the language (flag), switch to **Quiz**.
2. Drive each feedback state and confirm it is in the selected language with **zero English**:
   - listening/interim line
   - correct celebration (answer right)
   - try-again nudge (one miss)
   - reveal line after the allowed misses — the sentence is localized **and** embeds the localized sound word (e.g. uk «муу») (FR-002)
   - microphone-unavailable notice (deny mic) — still localized (FR-003, must be preserved)

Pass: every observed line is in the selected language.

## 4. Manual: non-English answers accepted (US2 / SC-002, SC-003)

With a mic, in **Ukrainian**: say the cow sound ("муу") → accepted + localized cheer. Say a clearly unrelated word → not accepted. Repeat in **Spanish** ("muu"). Confirm English still accepts "moo"/"muu" (SC-006).

## 5. Manual: recognizer actually works per language + honest degradation (US3, US4 / SC-004, SC-005, SC-007)

1. **Per-language recognizer (SC-004)**: in uk/es, speak and confirm a matching transcript is produced by that language's on-device model (not the English one). Verify via DevTools that no cross-origin speech request is made.
2. **Degradation (SC-005)**: simulate "no model" (temporarily remove/rename a model file, or block its fetch). The quiz shows the localized unavailable notice and reveal/advance works — **no false "wrong answer"** and **no** switch to another language's model (FR-012).
3. **Persistence / offline (SC-007)**: load a language once (model downloads), then reload with the network disabled (DevTools → Offline). Recognition for that language is available with **no** re-download (served from the service-worker cache, FR-014).

## 6. Manual: language switch mid-quiz (FR-010)

Start a quiz in one language, switch the flag mid-round. Confirm the next feedback line and the recognizer both use the newly selected language without a page reload.

---

### Success-criteria coverage map

| Scenario | Covers |
|----------|--------|
| 1 | SC-001, SC-006, SC-004 (factory) |
| 2 | FR-011 (on-device/no-network) |
| 3 | SC-001 (US1) |
| 4 | SC-002, SC-003, SC-006 |
| 5 | SC-004, SC-005, SC-007 |
| 6 | FR-010 |
