# Implementation Plan: Fix Mobile Layout

**Branch**: `003-fix-mobile-markup` | **Date**: 2026-08-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/003-fix-mobile-markup/spec.md`

## Summary

The `AnimalCard` component renders a horizontal flex row (prev button | animal stage | next button). On narrow phone viewports (≤ 430 px) the next button overflows off-screen and the image is shoved left. The fix adds a CSS media query breakpoint at 600 px that re-stacks the card into a vertical layout for mobile, while keeping the desktop layout unchanged. No JavaScript or component logic changes are required.

## Technical Context

**Language/Version**: TypeScript 5.5 / React 18.3

**Primary Dependencies**: Vite 5, React 18, `@testing-library/react` 16, Vitest 2, Playwright 1.62

**Storage**: N/A

**Testing**: Vitest (component/unit), Playwright (E2E)

**Target Platform**: Modern mobile browsers (iOS Safari, Android Chrome), served at `localhost:5173` via Vite

**Project Type**: Web application (single-page React app)

**Performance Goals**: No rendering performance impact expected; CSS-only change

**Constraints**: Must not alter swipe gesture behaviour; desktop layout must be pixel-identical after change

**Scale/Scope**: 2 files changed (`src/styles/app.css`, `tests/e2e/smoke.spec.ts` or a new component test); no new components

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

The project constitution file contains only template placeholders — no active principles are defined. No gate violations to check.

**Post-Phase-1 re-check**: Confirmed no violations. The change is a single-concern CSS addition with a test added in the existing testing framework.

## Project Structure

### Documentation (this feature)

```text
specs/003-fix-mobile-markup/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── styles/
│   └── app.css          # Add @media (max-width: 600px) block for .animal-card
└── components/
    └── AnimalCard.tsx   # No changes required

tests/
├── component/
│   └── animalCard.test.tsx   # Add viewport-width assertions
└── e2e/
    └── smoke.spec.ts    # Optionally extend with a mobile viewport smoke test
```

**Structure Decision**: Single project, CSS-only change. Existing source tree is unchanged; one stylesheet modified, existing test file extended.
