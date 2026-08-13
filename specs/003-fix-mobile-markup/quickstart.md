# Quickstart: Validate Mobile Layout Fix

## Prerequisites

- Node.js installed, `npm install` already run in repo root
- Chromium Playwright browser installed: `npx playwright install chromium`

## Start the Dev Server

```bash
npm run dev
# App running at http://localhost:5173
```

## Scenario 1 — Manual Visual Check (phone viewport)

1. Open `http://localhost:5173` in Chrome DevTools.
2. Toggle device toolbar (⌘+Shift+M) and set dimensions to 375 × 667 (iPhone SE).
3. **Expected**: Both ◀ and ▶ buttons are visible below the animal image. No horizontal scrollbar.
4. Tap ▶ → animal changes. Tap ◀ → returns. Swipe left/right → navigates.
5. Rotate to landscape (667 × 375) → buttons still visible, layout remains functional.

## Scenario 2 — Desktop Layout Unchanged

1. In DevTools, set viewport to 1280 × 800.
2. **Expected**: Layout matches current state — ◀ button on left, animal in centre, ▶ button on right, all in one horizontal row.

## Scenario 3 — Playwright E2E (mobile viewport)

```bash
npx playwright test --project=chromium
```

The test suite includes a mobile viewport test (`mobile-layout` test in `smoke.spec.ts`) that:

1. Sets viewport to `{ width: 375, height: 667 }`.
2. Navigates to `/`.
3. Asserts `button[aria-label="Next animal"]` is visible within the viewport bounds.
4. Asserts `button[aria-label="Previous animal"]` is visible within the viewport bounds.
5. Clicks ▶ and asserts the learn phrase changes (navigation still works).

**Expected result**: All assertions pass.

## Scenario 4 — Touch Target Size Check

In DevTools mobile viewport:
1. Right-click the ▶ button → Inspect.
2. Computed size should be at least 88 × 88 px (set by `--touch` variable).

## What to Watch For

- Horizontal scroll appearing on the page → layout still overflowing.
- Next/prev button invisible or clipped → media query not firing at the right breakpoint.
- Swipe gesture not responding → pointer event wiring broken (should not happen; no JS changed).
- Desktop layout shifted → media query condition too broad.
