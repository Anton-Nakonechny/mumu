# Feature Specification: Multi-Language Flag Selector

**Feature Branch**: `004-language-flags`

**Created**: 2026-08-13

**Status**: Draft

**Input**: User description: "add support of ukrainian and spanish languages with three country flags to toggle between speech and text, ukrainian must be default."

## Clarifications

### Session 2026-08-17

- Q: When the language is changed while in Quiz mode, what should happen immediately? → A: Cancel any current audio, speak the current quiz question in the new language, then restart the mode's listen cycle (reveal/skip when voice recognition is unavailable).
- Q: If audio is already playing (a learn phrase, quiz prompt, or a cheer) when a flag is tapped, should it be cut off? → A: Yes — cancel the in-progress audio and immediately speak the current context in the new language.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ukrainian Default on First Launch (Priority: P1)

A parent opens the app for the first time. The app launches in Ukrainian — all animal names, prompts, spoken words, and interface labels are in Ukrainian. No setup is needed.

**Why this priority**: Ukrainian is the required default language. Every subsequent feature depends on the correct initial state. If the default is wrong, all other language behavior is affected.

**Independent Test**: Open the app without any prior settings. Verify all visible text and all spoken audio is in Ukrainian, and the Ukrainian flag is visually selected.

**Acceptance Scenarios**:

1. **Given** the app has never been opened before, **When** the app loads, **Then** all interface text, animal sound prompts, and spoken audio are in Ukrainian, and the Ukrainian flag indicator is in the active/selected state.
2. **Given** Ukrainian is the active language, **When** the app speaks a phrase (e.g., "The dog says…"), **Then** the phrase is spoken in Ukrainian.

---

### User Story 2 - Switch Language via Flag (Priority: P2)

A parent or child taps one of three visible country flag buttons (🇺🇦 Ukrainian, 🇪🇸 Spanish, 🇺🇸 English). The entire app immediately updates: all text and all spoken audio switch to the selected language. The chosen flag becomes visually highlighted.

**Why this priority**: Language selection is the core interaction of this feature. It must work reliably across all three languages and persist within the session.

**Independent Test**: With the app open in any state (Learn or Quiz mode), tap the Spanish flag. Verify all text and audio switch to Spanish, and 🇪🇸 becomes highlighted. Tap 🇺🇦 and verify all text and audio switch to Ukrainian.

**Acceptance Scenarios**:

1. **Given** the app is in Learn mode in Ukrainian, **When** the user taps the Spanish flag, **Then** all on-screen text switches to Spanish and the app immediately speaks the current animal's learn phrase in Spanish.
2. **Given** the app is in Learn mode in Spanish, **When** the user taps the English flag, **Then** all on-screen text switches to English and the app immediately speaks the current animal's learn phrase in English.
3. **Given** any language is active, **When** the user taps the currently selected flag, **Then** nothing changes (no flicker or reset).
4. **Given** the app is in Quiz mode and listening for a voice answer, **When** the user taps a different flag, **Then** listening stops, the language switches, the quiz question is immediately spoken in the new language, and the listen cycle restarts (reveal/skip if the mic is unavailable).
5. **Given** a cheer is playing after a correct answer in Quiz mode, **When** the user taps a different flag, **Then** the cheer is cut off, any pending auto-advance is cancelled, and the current question is immediately spoken in the new language.

---

### User Story 3 - Language Persists Across Sessions (Priority: P3)

A child played yesterday in Spanish. Today they open the app and it remembers Spanish — they don't need to switch again.

**Why this priority**: Persistence improves the experience for returning users, especially children who cannot operate settings menus. However, the app is still fully usable without persistence (Story 1 and 2 remain independent).

**Independent Test**: Switch to Spanish, close the browser tab, reopen the app. Verify Spanish is still active.

**Acceptance Scenarios**:

1. **Given** the user selected Spanish during a previous session, **When** the app is reopened, **Then** Spanish is active and the Spanish flag is highlighted.
2. **Given** the user selected Ukrainian during a previous session, **When** the app is reopened, **Then** Ukrainian is active.

---

### Edge Cases

- What happens when the device does not support speech synthesis in Ukrainian or Spanish? The app must fall back gracefully — text remains visible in the selected language; a silent or absent voice is acceptable, but no error crashes the game.
- What happens when the browser does not support voice recognition in the selected language? Quiz mode falls back to its existing "mic unavailable" behavior: reveal-after-two-misses mode activates, no crash.
- What if the user rapidly taps multiple flags in succession? The app must end up in the state of the last tapped flag without broken intermediate states.
- What if the app is mid-phrase or mid-cheer when the language is switched? The ongoing audio is cut off and the app immediately speaks the current context in the new language; any pending Quiz auto-advance is cancelled.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display three country flag controls — Ukrainian (🇺🇦), Spanish (🇪🇸), and English (🇺🇸) — persistently visible in both Learn mode and Quiz mode.
- **FR-002**: System MUST default to Ukrainian on first launch and whenever no saved preference exists.
- **FR-003**: System MUST switch ALL interface text (animal names, prompts, mode labels, button labels) to the selected language immediately when a flag is tapped.
- **FR-004**: When a tapped flag changes the active language, the System MUST cancel any audio currently playing and immediately speak the current context in the newly selected language — in Learn mode, the current animal's learn phrase; in Quiz mode, the current quiz question, after which the listen cycle restarts (falling back to reveal/skip when voice recognition is unavailable).
- **FR-005**: System MUST visually distinguish the currently active language flag from the inactive ones (e.g., highlighted, enlarged, or marked).
- **FR-006**: System MUST recognize spoken answers in the selected language when voice recognition is active in Quiz mode.
- **FR-007**: System MUST save the user's language choice and restore it when the app is next opened.
- **FR-008**: System MUST handle the case where speech synthesis or voice recognition is unavailable in a selected language without crashing or blocking gameplay.
- **FR-009**: System MUST provide translated content for all three languages: Ukrainian, Spanish, and English — covering all animal names, all animal sounds, all prompts, and all cheer phrases.
- **FR-010**: Tapping the flag of the already-active language MUST be a no-op — no speech is (re)started and no state changes.

### Key Entities

- **Language**: Identified by a code (e.g., "uk", "es", "en") with associated flag, display name, animal sound translations, UI string translations, and speech synthesis voice preference.
- **Language Preference**: The user's currently selected language, persisted across sessions via local storage.
- **Localized Content Set**: For each language, a complete mapping of animal names → animal sounds → game prompts → cheer phrases.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can switch languages in under 2 taps from any screen.
- **SC-002**: Within 1 second of tapping a flag, all interface text updates and the app begins speaking the current context (Learn phrase or Quiz question) in the newly selected language.
- **SC-003**: 100% of app text visible during normal gameplay (Learn and Quiz modes) is displayed in the selected language — no untranslated strings remain visible.
- **SC-004**: The selected language is correctly restored on next session open for 100% of cases where a preference was previously saved.
- **SC-005**: When speech synthesis or recognition is unavailable for the selected language, the app continues to function in at least text-only mode with no error message blocking gameplay.

## Assumptions

- The app currently supports English only; Ukrainian and Spanish are new additions. English remains supported as the third language option alongside Ukrainian and Spanish.
- "Three country flags" refers to 🇺🇦 (Ukrainian), 🇪🇸 (Spanish), and 🇺🇸 (English) — the current language plus the two new additions.
- "Toggle between speech and text" means the language selection controls both the displayed text AND the spoken audio simultaneously, not independently.
- All animal content (names and sounds) that currently exists in English will need Ukrainian and Spanish equivalents; new animals are out of scope for this feature.
- The flag selector UI is always visible and does not require navigating to a settings screen.
- Voice recognition language setting follows the selected language (e.g., switching to Spanish sets recognition to Spanish speech input).
- Local browser storage is used to persist language preference; no server-side account or login is required.
- Children aged 2–6 are the primary users; the flag selector must be large enough to tap easily on a touch screen.
