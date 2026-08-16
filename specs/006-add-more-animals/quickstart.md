# Quickstart / Validation Guide: Add More Animals

Proves the seven new animals (duck, chicken, rooster, wolf, goat, sheep, turkey) work
end-to-end in Learn and Quiz modes across all three languages. Run these after the pictures
and `animals.json` entries are added.

## Prerequisites

- `npm install` completed.
- Seven picture files present under `public/assets/animals/` (one per new animal).
- Seven trilingual entries appended to `public/assets/animals.json`
  (shape: [contracts/animals-json.schema.md](./contracts/animals-json.schema.md);
  values: [research.md](./research.md) R3–R5).
- For Quiz voice checks: a secure context (`localhost` or HTTPS per README), microphone
  permission, and a Vosk model under `public/assets/models/` (English + Spanish already
  bundled). Without a mic/model, Quiz still validates via the reveal/skip path.

## Setup

```bash
npm run dev        # open the printed localhost URL
```

## Scenario 1 — Learn mode roster (US1, SC-001/002/003)

1. Ensure the app is in **Learn** mode.
2. Tap ▶ through the whole roster starting from cow.
3. **Expect**: all **9** animals appear in order (cow, dog, duck, chicken, rooster, wolf,
   goat, sheep, turkey), each with a clear cartoon picture (no broken images), and the app
   speaks a correct name-and-sound phrase for each (e.g. *"The duck says quack quack"*).
4. Tap 🔊 on a new animal → the phrase repeats.

## Scenario 2 — Quiz mode + safe fallback (US2, SC-004)

1. Switch to **Quiz** mode; language English.
2. For each new animal, confirm a spoken prompt (e.g. *"What does the goat say?"*).
3. Say a reasonable sound (e.g. "baa" for sheep) → **Expect** a cheer and auto-advance.
4. For a hard-to-recognize sound (turkey "gobble", rooster "cock-a-doodle-doo"): stay silent
   or say something unmatched → after two misses **Expect** the gentle reveal of the sound
   and the ability to continue. **Never** a harsh "wrong" state (zero false negatives).

## Scenario 3 — Languages (US3, SC-007)

1. Set language to **Spanish** → view sheep/duck/etc.
   **Expect** Spanish names & sounds (e.g. *oveja*, *pato*) — not the English fallback.
2. Set language to **Ukrainian** → cycle the new animals.
   **Expect** Ukrainian names & sounds; Quiz voice-matches only where Latin sound-alikes
   were supplied, otherwise degrades cleanly to reveal/skip — no crashes, no blank labels.
3. Temporarily remove a `uk` block from one animal and reload → **Expect** that animal falls
   back to its English name/sound without error (then restore the block).

## Scenario 4 — Robustness (edge cases, FR-010)

1. Rename one new picture file so its `image` path 404s, reload.
   **Expect**: that card shows `alt` text but the app does not crash and the other 8 animals
   remain fully playable. (Restore the filename afterward.)

## Automated checks

```bash
npm test                 # Vitest unit + component; roster/repository assertions
npm run build            # type-check + production build must pass
npx playwright test      # e2e smoke + privacy-network (no recognition network calls, SC-006)
```

**Expect**: repository/roster tests report 9 animals; each new `id` resolves a localized
(non-fallback) `uk` and `es` name; `privacy-network` confirms no speech-related network
requests were introduced.

## Success = all of

- [ ] 9 animals visible and speaking in Learn mode (SC-001/002/003)
- [ ] Every new animal cheers a valid answer or safely reveals — zero false "wrong" (SC-004)
- [ ] Localized names/sounds shown for every new animal in `uk` and `es` (SC-007)
- [ ] Broken image does not break the roster (FR-010)
- [ ] `npm test`, `npm run build`, and Playwright e2e all pass with no new speech network
      calls (SC-006), and no code changes were needed to add the animals (SC-005)
