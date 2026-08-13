---
description: "Task list for Fix Mobile Layout feature"
---

# Tasks: Fix Mobile Layout

**Input**: Design documents from `specs/003-fix-mobile-markup/`

**Prerequisites**: plan.md, spec.md, research.md, quickstart.md

**Organization**: Tasks are grouped by user story (US1 = fully visible on mobile, US2 = proportional layout). TDD approach — tests are written first and must fail before implementation begins.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Exact file paths included in all descriptions

---

## Phase 1: Setup

**Purpose**: Confirm the test infrastructure is ready to run and observe failures.

- [x] T001 Verify Playwright runs against the dev server — run `npx playwright test` and confirm the existing smoke test passes before any changes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No shared infrastructure changes are required for this CSS-only feature. The existing `src/styles/app.css` and `tests/e2e/smoke.spec.ts` are the only files affected.

*(No tasks — existing codebase is the foundation.)*

**Checkpoint**: Existing tests pass → ready to add failing tests for each user story.

---

## Phase 3: User Story 1 — Animal Card Fully Visible on Mobile (Priority: P1) 🎯 MVP

**Goal**: All nav buttons and the animal image are visible on a 375 px wide phone viewport without horizontal scrolling.

**Independent Test**: `npx playwright test --grep "mobile nav buttons visible"` passes — both ◀ and ▶ buttons are within viewport at 375 × 667 px.

### Tests for User Story 1 ⚠️ Write first — must FAIL before T003

- [x] T002 [US1] Add a `mobile nav buttons visible` Playwright test to `tests/e2e/smoke.spec.ts` — sets viewport to `{ width: 375, height: 667 }`, loads `/`, asserts both `button[aria-label="Next animal"]` and `button[aria-label="Previous animal"]` are visible with `expect(btn).toBeInViewport()`; also clicks ▶ and asserts learn phrase changes. Run test — it MUST fail before proceeding.

### Implementation for User Story 1

- [x] T003 [US1] Add `@media (max-width: 600px)` block to `src/styles/app.css` — override `.animal-card` with `flex-direction: column; align-items: center`, add `.nav-row` flex container for the two nav buttons side-by-side below the animal stage. Add `nav-row` class to the nav button wrapper in `src/components/AnimalCard.tsx` — wrap the two `nav-button` elements in a `<div className="nav-row">` inside the column. Run Playwright test — it MUST now pass.

**Checkpoint**: `npx playwright test --grep "mobile nav buttons visible"` is green. Open `http://localhost:5173` at 375 × 667 in DevTools — ◀ and ▶ visible below the image, no horizontal scroll.

---

## Phase 4: User Story 2 — Layout Fills Screen Proportionally on Mobile (Priority: P2)

**Goal**: Animal image fills at least 55% of the mobile viewport width and nav buttons retain ≥ 64 × 64 px touch targets.

**Independent Test**: `npx playwright test --grep "mobile proportional layout"` passes — image width and nav button dimensions meet SC-002 and SC-003.

### Tests for User Story 2 ⚠️ Write first — must FAIL (or be checked) before T005

- [x] T004 [US2] Add a `mobile proportional layout` Playwright test to `tests/e2e/smoke.spec.ts` — sets viewport to `{ width: 375, height: 667 }`, asserts `img.animal-image` bounding box width ≥ 206 px (55% of 375), asserts each nav button bounding box is ≥ 64 × 64 px. Run test — confirm assertions or adjust threshold if current CSS already satisfies them.

### Implementation for User Story 2

- [x] T005 [US2] Adjust `.animal-image` sizing rule in `src/styles/app.css` inside the `@media (max-width: 600px)` block if the T004 test fails — set `width: min(80vw, 360px)` to guarantee ≥ 55% at 375 px. No nav-button size change needed since `--touch: 88px` already exceeds the 64 px requirement. Run Playwright test — it MUST now pass.

**Checkpoint**: Both `mobile nav buttons visible` and `mobile proportional layout` pass. Navigate in quiz mode on a 375 px viewport — all controls visible and functional.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Confirm desktop layout is pixel-identical to pre-fix state and no regressions in Vitest.

- [x] T006 [P] Add a `desktop layout unchanged` Playwright test to `tests/e2e/smoke.spec.ts` — sets viewport to `{ width: 1280, height: 800 }`, asserts `.animal-card` computed CSS `flex-direction` is `row` (via JS: `page.evaluate`) and both nav buttons are horizontally inline with the image (left button x < image x < right button x). Run and confirm green.
- [x] T007 [P] Run `npm test` (Vitest) and confirm all existing component/unit tests still pass — no changes to component logic should cause regressions.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately.
- **Foundational (Phase 2)**: N/A for this feature.
- **User Story 1 (Phase 3)**: Depends on Phase 1. T002 (test) before T003 (implementation).
- **User Story 2 (Phase 4)**: Depends on Phase 3 completion. T004 (test) before T005 (implementation).
- **Polish (Phase 5)**: Depends on all user story phases complete. T006 and T007 can run in parallel.

### User Story Dependencies

- **US1 (P1)**: Start after Phase 1. No dependency on US2.
- **US2 (P2)**: Start after US1 is checkpointed. May share the same media query block in `app.css`.

### Within Each User Story

- Test task written and failing BEFORE implementation task begins (TDD).
- Implementation task completes and test passes BEFORE moving to next story.

---

## Parallel Opportunities

```bash
# Phase 5 — run simultaneously:
Task T006: "Add desktop layout unchanged Playwright test to tests/e2e/smoke.spec.ts"
Task T007: "Run npm test (Vitest) and confirm no regressions"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Confirm Playwright runs.
2. Write failing mobile test (T002).
3. Add CSS media query + nav-row wrapper (T003).
4. **STOP and VALIDATE**: `npx playwright test --grep "mobile nav buttons visible"` is green.
5. Demo on phone — ◀ and ▶ visible, navigation works, swipe works.

### Incremental Delivery

1. MVP (US1): Mobile buttons visible → validates core fix.
2. US2: Image proportion + touch target check → polishes the layout.
3. Polish (T006/T007): Regression safety net for desktop and Vitest suite.

---

## Notes

- [P] tasks = can run in parallel (different concerns, no file conflicts).
- TDD is mandatory per project defaults: write failing test → implement → verify green.
- `AnimalCard.tsx` requires a minimal structural change (wrapping two buttons in a `div.nav-row`) — this is not a logic change and should not affect any existing Vitest tests.
- The `@media (max-width: 600px)` block must be additive — do not modify existing desktop rules above it.
- After T003, manually test swipe gesture on a touch device or DevTools touch emulation to confirm FR-006.
