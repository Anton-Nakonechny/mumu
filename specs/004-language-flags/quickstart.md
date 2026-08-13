# Quickstart Validation Guide: Multi-Language Flag Selector

**Branch**: `004-language-flags`

## Prerequisites

- Node.js ≥ 18, npm available
- Dev certs already generated (`certs/dev-cert.pem`)
- Run from project root: `npm run dev`
- App available at `https://localhost:5173` (or the HTTPS address printed by Vite)

---

## Scenario 1 — Ukrainian is the default on first launch (US-1, FR-002)

**Setup**: Clear `localStorage` before opening the app.

```js
// Run in browser DevTools console:
localStorage.removeItem('mumu-language');
```

**Steps**:
1. Reload the page.
2. Observe the flag selector row.
3. Click the 🔊 replay button or wait for auto-speak in Learn mode.

**Expected**:
- The 🇺🇦 button has the `.active` class (`aria-checked="true"`).
- All visible text is in Ukrainian (`Навчання`, `Вікторина`, animal names in Ukrainian).
- Spoken audio is in Ukrainian (Ukrainian-language TTS voice, or browser default if none installed).

---

## Scenario 2 — Switch to Spanish (US-2, FR-003, FR-004, SC-002)

**Steps**:
1. From any state, click the 🇪🇸 (Spanish) flag button.
2. Observe the UI immediately.
3. Replay audio (🔊 button).

**Expected**:
- 🇪🇸 button is now `.active`; 🇺🇦 and 🇺🇸 are not.
- All text updates to Spanish (`Aprender`, `Quiz`, `vaca`, `perro`).
- Replay audio speaks in Spanish.
- Total time from tap to fully updated UI: under 1 second (SC-002).

---

## Scenario 3 — Switch back to Ukrainian

**Steps**:
1. Click 🇺🇦.

**Expected**: All text and audio revert to Ukrainian. No flicker or partial state visible.

---

## Scenario 4 — Tap the currently active flag (US-2 acceptance scenario 3)

**Steps**:
1. Confirm 🇺🇦 is active.
2. Click 🇺🇦 again.

**Expected**: Nothing changes — no reset, no flicker, no re-render of animal card.

---

## Scenario 5 — Language persists across sessions (US-3, FR-007)

**Steps**:
1. Click 🇪🇸 (Spanish).
2. Confirm Spanish is active.
3. Close the browser tab entirely.
4. Open a new tab and navigate to `https://localhost:5173`.

**Expected**:
- 🇪🇸 is active on load — no flag click required.
- All text and audio are in Spanish.

**Verify**:
```js
localStorage.getItem('mumu-language'); // => "es"
```

---

## Scenario 6 — Language selector is visible in both modes (FR-001)

**Steps**:
1. While in Learn mode, confirm the flag row is visible.
2. Click the `Quiz` mode button.
3. Confirm the flag row is still visible in Quiz mode.

**Expected**: `data-testid="lang-selector"` is present in the DOM in both modes.

---

## Scenario 7 — Language switch in Quiz mode (US-2 acceptance scenario 4)

**Steps**:
1. Enter Quiz mode.
2. Wait for the quiz prompt to speak.
3. Click 🇺🇸 (English) while the quiz prompt is playing or while the "Listen" button is visible.

**Expected**:
- Any active speech or listening stops.
- Quiz prompt updates to English.
- "Listen" button label updates to "Listen" (English).
- No crash or frozen state.

---

## Scenario 8 — Speech synthesis unavailable (FR-008, edge case)

**Setup** (simulate via DevTools):
```js
// Override to simulate no TTS
window.speechSynthesis.speak = () => {};
window.speechSynthesis.cancel = () => {};
```

**Steps**:
1. Switch to Ukrainian.
2. Navigate to an animal.

**Expected**:
- Text displays in Ukrainian.
- The `(Audio is off — read it out loud!)` fallback message appears (in Ukrainian).
- No error, no crash.

---

## Scenario 9 — Unit and component tests pass

```bash
npm test
```

**Expected**: All existing tests pass. New tests for `language.ts`, `animalsRepository.ts` (localized parsing), `LanguageSelector`, and `LanguageStore` also pass. Zero failing tests.

---

## Scenario 10 — Build succeeds

```bash
npm run build
```

**Expected**: TypeScript compiles with zero errors. Vite produces output in `dist/`. No type errors about missing translation keys.

---

## References

- Data shape: [data-model.md](./data-model.md)
- TTS contract: [contracts/TtsService.md](./contracts/TtsService.md)
- Recognition contract: [contracts/RecognitionService.md](./contracts/RecognitionService.md)
- Flag selector contract: [contracts/LanguageSelector.md](./contracts/LanguageSelector.md)
- Persistence contract: [contracts/LanguageStore.md](./contracts/LanguageStore.md)
- Repository contract: [contracts/AnimalsRepository.md](./contracts/AnimalsRepository.md)
