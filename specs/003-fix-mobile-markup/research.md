# Research: Fix Mobile Layout

## Breakpoint Value

**Decision**: 600 px max-width media query  
**Rationale**: Phones in portrait mode range from 320 px (SE 1st gen) to 430 px (iPhone 15 Pro Max). 600 px gives a clean gap before tablet widths (768 px+) while safely covering all phone sizes.  
**Alternatives considered**: 480 px (too narrow, misses some phablets), 768 px (too wide, changes tablet layout unnecessarily).

## Mobile Layout Strategy

**Decision**: On mobile, change `.animal-card` from horizontal flex row to vertical flex column. Place the nav buttons in a horizontal row (`nav-row`) beneath the animal stage.  
**Rationale**: Vertical stacking is the natural phone pattern — the animal image takes priority and fills the width; both nav buttons sit side-by-side below it at full touch-target size (88 px). This avoids squeezing the image.  
**Alternatives considered**:
- Overlaying nav buttons on top of the image: risks obscuring the animal; confusing for children.
- Stacking prev above image and next below: non-standard; breaks left=back / right=forward mental model.
- Shrinking buttons: violates FR-004 (64 px minimum); rejected.

## Image Sizing on Mobile

**Decision**: No change to `width: min(70vw, 420px)`.  
**Rationale**: At 375 px width, `70vw = 262 px` (≈ 70% of screen). Meets SC-002 (≥ 55%). The `420px` cap prevents overflow on wider phones. No change needed.

## Touch Targets

**Decision**: No change needed. `--touch: 88px` already exceeds the 64 px requirement in FR-004 and SC-003.  
**Rationale**: CSS variable is inherited by `.nav-button` via `min-width` / `min-height` already.

## Swipe Gesture Preservation

**Decision**: No changes to `AnimalCard.tsx`.  
**Rationale**: Swipe handlers (`onPointerDown` / `onPointerUp`) are attached to the `.animal-card` wrapper div. Changing the flex direction of that div does not affect pointer event registration. Verified by reading `src/components/AnimalCard.tsx`.

## Testing Approach

**Decision**: Extend `tests/component/animalCard.test.tsx` with a layout assertion that checks the computed flex-direction at a narrow container width.  
**Rationale**: Vitest + `@testing-library/react` runs in jsdom which doesn't evaluate media queries. The correct approach is a Playwright E2E test with `viewport: { width: 375, height: 667 }` that asserts the next button is visible within viewport bounds.  
**Alternatives considered**: jsdom CSS assertion — unreliable for media queries; rejected in favour of Playwright viewport test.
