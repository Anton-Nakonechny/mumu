# Feature Specification: Fix Mobile Layout

**Feature Branch**: `003-fix-mobile-markup`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "fix the markup on a mobile device"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Animal Card Fully Visible on Mobile (Priority: P1)

A child uses the app on a smartphone in portrait orientation. All interactive elements — the animal image, the previous and next navigation buttons, the replay button, and the phrase text — are visible on screen without horizontal scrolling or clipping.

**Why this priority**: The core interaction loop (browsing animals, hearing sounds) is completely broken on mobile if navigation buttons are off-screen. This is the minimum viable fix.

**Independent Test**: Open the app on any device with a viewport width ≤ 430 px and navigate to Learn mode. All four elements (prev button, next button, image, replay button) must be visible without scrolling sideways.

**Acceptance Scenarios**:

1. **Given** the app is opened on a phone in portrait mode (width ≤ 430 px), **When** the Learn screen is displayed, **Then** both navigation arrow buttons, the animal image, the replay button, and the phrase text are all visible within the viewport without horizontal scrolling.
2. **Given** the app is on a phone, **When** the user taps the next/previous buttons, **Then** the buttons respond correctly and the next/previous animal is shown.
3. **Given** the app is on a phone, **When** the user swipes left or right on the animal image, **Then** swipe navigation still works as before.

---

### User Story 2 - Layout Fills Screen Proportionally on Mobile (Priority: P2)

A child on a phone sees the animal image take up as much of the available screen as possible, with navigation controls clearly placed and easy to tap with small fingers.

**Why this priority**: Even if buttons are technically on-screen, a cramped or misaligned layout degrades usability for the target audience (young children).

**Independent Test**: On a 375 px wide viewport the animal image should be at least 55% of the viewport width and navigation buttons should each have at least 64 px touch targets.

**Acceptance Scenarios**:

1. **Given** a 375 px wide viewport, **When** the animal card is rendered, **Then** the animal image width is at least 55% of the viewport width.
2. **Given** a 375 px wide viewport, **When** the animal card is rendered, **Then** both nav buttons have a tappable area of at least 64 × 64 px.
3. **Given** a tablet or desktop viewport (width ≥ 768 px), **When** the animal card is rendered, **Then** the existing side-by-side layout (prev | image | next) is preserved unchanged.

---

### Edge Cases

- What happens when the viewport is very narrow (< 320 px)? Elements should not overlap and should remain tappable.
- What happens when the phrase text is very long (multi-word animal sounds)? Text should wrap cleanly, not push buttons out of view.
- What happens in landscape orientation on a phone? Layout should remain functional (buttons visible, image proportional).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: On viewport widths ≤ 600 px the animal card layout MUST stack navigation buttons and the animal stage so that all controls are visible within the viewport without horizontal scrolling.
- **FR-002**: On viewport widths > 600 px the animal card layout MUST remain the existing horizontal arrangement (previous button on left, animal stage in centre, next button on right).
- **FR-003**: The animal image MUST scale appropriately for small screens so it does not overflow the viewport width.
- **FR-004**: Navigation buttons MUST retain a minimum touch target of 64 × 64 px on all viewport sizes.
- **FR-005**: The replay button and phrase text MUST remain below the animal image on all viewport sizes.
- **FR-006**: Swipe gesture navigation on the animal image MUST continue to work correctly after the layout change.
- **FR-007**: All changes MUST be limited to CSS / layout — no functional behaviour (sound, navigation logic) may be altered.

### Key Entities

- **AnimalCard**: The component (`src/components/AnimalCard.tsx`) rendered in both Learn and Quiz modes that hosts the image, nav buttons, replay button, and mode-specific children.
- **app.css**: The single stylesheet (`src/styles/app.css`) that governs all layout, including `.animal-card` and `.animal-stage`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On a 375 × 667 px mobile viewport (iPhone SE size), all interactive controls are visible without horizontal scrolling.
- **SC-002**: On a 375 px wide viewport the animal image renders at a minimum of 55% of the viewport width.
- **SC-003**: Navigation buttons each maintain a touch target ≥ 64 × 64 px across all tested viewport widths (320 px, 375 px, 430 px, 768 px, 1280 px).
- **SC-004**: The desktop/tablet layout (≥ 768 px) is pixel-identical to the current layout — no visual regression for wider screens.
- **SC-005**: Swipe-to-navigate continues to work on touch devices after the change.

## Assumptions

- The fix is limited to CSS responsive layout changes; no redesign of the UI is required.
- "Mobile" refers to portrait-orientation phone viewports, primarily 320–430 px wide.
- The breakpoint for switching to a mobile layout is 600 px (a safe boundary between phones and tablets).
- The existing swipe gesture logic in `AnimalCard.tsx` does not need modification — only the CSS layout changes.
- Both Learn mode and Quiz mode use `AnimalCard`, so fixing the card layout fixes both modes simultaneously.
- The Quiz mode (`QuizMode.tsx`) may have additional mobile issues, but this feature focuses only on the `AnimalCard` layout and shared CSS.
