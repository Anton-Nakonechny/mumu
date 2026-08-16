# Feature Specification: Add More Animals

**Feature Branch**: `006-add-more-animals`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "look for similar pictures of the other animals on the internet like: duck, chicken, rooster, wolf, goat, sheep, turkey and add them to app"

## Clarifications

### Session 2026-08-16

- Q: How should the pictures for the seven new animals be obtained? → A: Web-search royalty-free — download public-domain / CC0 / royalty-free cartoon images from the internet, matching the existing cow & dog style.
- Q: Which languages must each new animal include? → A: All three (en + uk + es) per animal, matching the existing cow & dog entries.
- Q: How strict should Quiz voice-recognition be for the new English sounds? → A: Best-effort + fallback — prefer accepted answers known to be recognizable; where a sound isn't reliably recognized, rely on the existing child-safe reveal/skip path (no animal is blocked).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Learn the sounds of seven new animals (Priority: P1)

A young child opens the game in Learn mode and moves through the animals. Alongside
the cow and dog they already know, they now meet a duck, chicken, rooster, wolf,
goat, sheep, and turkey — each shown as a friendly cartoon picture consistent with
the existing artwork. As the child reaches each new animal, the game says the animal's
name and the sound it makes (e.g. *"The duck says quack quack"*).

**Why this priority**: The core value of the app is teaching animals and their sounds.
Simply seeing and hearing the new animals in Learn mode delivers the whole point of the
request — more animals to learn from — and works even without the microphone or Quiz mode.

**Independent Test**: Launch the app in Learn mode and swipe/tap through the full roster.
Confirm each of the seven new animals appears with a clear, child-friendly picture and
that the game speaks a correct name-and-sound phrase for each.

**Acceptance Scenarios**:

1. **Given** the app is in Learn mode, **When** the child navigates to the duck,
   **Then** a duck cartoon picture is shown and the game says the duck's name and sound.
2. **Given** the app is in Learn mode, **When** the child navigates through the whole
   roster, **Then** all nine animals (cow, dog, duck, chicken, rooster, wolf, goat,
   sheep, turkey) appear in rotation with no missing pictures or broken images.
3. **Given** any new animal is shown, **When** the child taps the replay control,
   **Then** the game repeats that animal's name-and-sound phrase.

---

### User Story 2 - Be quizzed on the new animals (Priority: P2)

A child switches to Quiz mode and is asked what each new animal says (e.g. *"What does
the goat say?"*). The child answers out loud; a correct answer is cheered and the game
auto-advances, exactly as it does today for the cow and dog. If the microphone is
unavailable or the answer is not recognized, the game still gently reveals the sound
and lets the child move on.

**Why this priority**: Quiz mode is the second half of the app's value, but it depends
on the animals existing first (P1). It also inherits the existing on-device recognition
constraints, so it carries more nuance than simply displaying the animals.

**Independent Test**: In Quiz mode, cycle through the new animals and confirm each one
produces a spoken prompt, accepts a reasonable spoken answer as correct (in English),
and falls back to the child-safe reveal/skip path when no answer is recognized.

**Acceptance Scenarios**:

1. **Given** the app is in Quiz mode, **When** the duck is presented, **Then** the game
   asks what the duck says and waits for an answer.
2. **Given** the child says a recognized English sound for the presented animal, **When**
   it matches an accepted answer, **Then** the game cheers and auto-advances.
3. **Given** no answer is recognized after the allowed attempts, **When** the fallback
   triggers, **Then** the game reveals the sound and lets the child continue — never
   showing a harsh "wrong" state.

---

### User Story 3 - New animals respect the selected language (Priority: P3)

A parent sets the app to Ukrainian or Spanish. The new animals show their localized
names and sounds in Learn mode, and Quiz prompts appear in the chosen language, matching
how the cow and dog already behave across languages.

**Why this priority**: Multilingual coverage broadens reach but is an enhancement over
the core English experience; the app already falls back to English for any missing
translation, so the feature is usable even if some localizations are incomplete.

**Independent Test**: Switch the app language to Ukrainian, then Spanish, and confirm each
new animal shows a localized name/sound where provided and cleanly falls back to English
otherwise, with no crashes or blank labels.

**Acceptance Scenarios**:

1. **Given** the language is set to Spanish, **When** the child views the sheep, **Then**
   its name and sound are shown in Spanish.
2. **Given** the language is set to Ukrainian and a new animal has no Ukrainian block,
   **When** the animal is shown, **Then** it falls back to the English name and sound
   without error.

---

### Edge Cases

- **Missing or slow-loading image**: If a new animal's picture fails to load, the app
  must not crash and the rest of the roster must remain playable.
- **Onomatopoeia that is hard to voice-recognize**: Some new sounds (e.g. a turkey's
  "gobble") may be poorly recognized by the on-device recognizer. Quiz mode must still
  behave safely — cheering only genuine matches and otherwise falling through to the
  reveal/skip path, never a false "wrong".
- **Ukrainian recognition limits**: Ukrainian Quiz answers only match when Latin
  sound-alikes are provided (a documented existing constraint). New Ukrainian animals
  without Latin sound-alikes are recognizable only via the reveal/skip path, which is
  acceptable and never produces a false failure.
- **Incomplete translation for an animal**: An animal missing a valid English (or
  requested-language) entry must be dropped from the roster rather than shown broken.
- **Visual consistency**: A picture whose style clashes badly with the existing cartoon
  animals should be reselected so the roster feels cohesive.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST include seven new animals — duck, chicken, rooster, wolf,
  goat, sheep, and turkey — in addition to the existing cow and dog.
- **FR-002**: Each new animal MUST have a friendly cartoon picture obtained from the
  internet under a public-domain / CC0 / royalty-free license that permits use in this
  app, and visually consistent with the existing cow/dog artwork (child-appropriate,
  clear subject, simple background).
- **FR-003**: Each new animal MUST appear in the same navigable rotation as existing
  animals in Learn mode, with wrap-around navigation preserved.
- **FR-004**: Each new animal MUST have an English name, sound word, and a set of
  accepted spoken answers suitable for Quiz mode. Accepted answers SHOULD favor words
  known to be recognizable by the on-device recognizer; where a sound is not reliably
  recognized, the animal MUST still be playable via the child-safe reveal/skip path
  rather than being blocked.
- **FR-005**: Each new animal MUST produce a correct Learn-mode phrase and Quiz-mode
  prompt following the app's existing sentence patterns.
- **FR-006**: New animals MUST be added through the app's existing data-driven animal
  definition mechanism (picture asset + metadata entry), without requiring changes to
  core game logic.
- **FR-007**: Quiz mode MUST handle the new animals with the same correct-answer cheer,
  auto-advance, and child-safe reveal/skip fallback behavior used for existing animals.
- **FR-008**: The app MUST continue to run entirely on-device for speech; adding these
  animals MUST NOT introduce any network dependency for recognition or send audio off
  the device.
- **FR-009**: Each new animal MUST provide English, Ukrainian, and Spanish translation
  blocks (name, sound, and prompts), matching the existing cow/dog entries. The app MUST
  still fall back to English without error if any block is later removed or invalid.
- **FR-010**: If any new animal's picture fails to load, the app MUST remain functional
  and continue presenting the other animals.
- **FR-011**: The chosen pictures and sounds MUST be appropriate for children ages ~2–6
  (non-scary depictions, familiar onomatopoeia).

### Key Entities *(include if feature involves data)*

- **Animal (new entries)**: A playable animal defined by a stable identifier, a picture
  reference, and one or more localized translation blocks. Each translation carries a
  name, a sound word, accepted spoken answers, and optional learn/quiz sentence overrides.
  Seven new instances are added: duck, chicken, rooster, wolf, goat, sheep, turkey.
- **Animal picture asset**: The image file for each new animal, styled to match the
  existing cartoon roster and cleared for use in the app.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The playable roster grows from 2 to 9 animals, with all seven new animals
  (duck, chicken, rooster, wolf, goat, sheep, turkey) appearing in Learn mode.
- **SC-002**: 100% of the new animals display a picture (no broken/missing images) when
  navigating the full roster.
- **SC-003**: 100% of the new animals produce an intelligible spoken name-and-sound phrase
  in Learn mode and a spoken prompt in Quiz mode.
- **SC-004**: In Quiz mode, every new animal either accepts a reasonable English spoken
  answer as correct or safely falls back to the reveal/skip path — with zero false
  "wrong" outcomes observed across a full test round.
- **SC-005**: An adult can add or adjust a new animal by editing only picture assets and
  the metadata file (no code changes), consistent with the documented add-an-animal flow.
- **SC-006**: Adding the animals introduces no new network calls for speech recognition
  and no measurable regression in load or navigation responsiveness — navigation stays at
  60 fps and each new picture asset stays within the existing budget (~27–35 KB, matching
  cow ≈ 32 KB / dog ≈ 27 KB).
- **SC-007**: 100% of the new animals provide English, Ukrainian, and Spanish
  translations, verified by switching the app to each language and seeing localized
  (non-English-fallback) names and sounds for every new animal.

## Assumptions

- **Picture sourcing** (clarified 2026-08-16): Pictures will be downloaded from the
  internet under a public-domain / CC0 / royalty-free license that permits use in this
  app, chosen to match the friendly, simple cartoon style of the existing cow and dog
  images. Exact files and formats (PNG, AVIF, etc.) follow the existing asset conventions.
  Sourcing requires web access at implementation time.
- **Language coverage** (clarified 2026-08-16): Every new animal ships full trilingual
  coverage — English, Ukrainian, and Spanish — mirroring the existing cow/dog entries.
  English fallback remains as a safety net but is not the intended delivery state.
- **Ukrainian Quiz recognition**: The documented cross-lingual recognition trade-off still
  applies. Ukrainian answers are only voice-matched when Latin sound-alikes are supplied;
  otherwise the animal remains fully usable via Learn mode and the Quiz reveal/skip path.
- **Sounds** (clarified 2026-08-16): Standard, widely recognized onomatopoeia will be
  used for each animal (e.g. duck "quack", sheep "baa", goat "maa", rooster
  "cock-a-doodle-doo", turkey "gobble", chicken "cluck", wolf "howl/awoo"). Accepted
  answers are chosen best-effort to favor words the on-device recognizer can match;
  animals whose sound is not reliably recognized stay playable through the reveal/skip
  path and are never blocked.
- **No new speech models required**: Existing on-device recognition models are reused;
  this feature does not add or require new acoustic models.
- **Scope boundary**: This feature only adds animals and their data/pictures. It does not
  change game modes, navigation mechanics, scoring, or the recognition pipeline.
