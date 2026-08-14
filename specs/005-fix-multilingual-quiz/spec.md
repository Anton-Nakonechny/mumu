# Feature Specification: Fix Multilingual Quiz (Localized Feedback + Non-English Recognition)

**Feature Branch**: `005-fix-multilingual-quiz`

**Created**: 2026-08-13

**Status**: Implemented (2026-08-14) — Ukrainian recognition bugfix via English acoustic model as phonetic approximator; consciously supersedes FR-007 (see research.md R5).

**Input**: User description: "in a multi-language feature the feedback is in English, also, it fails the check when I say 'muu' in Ukrainian/Spanish but succeeds in English. Is the other recognition model(s) needed to be wired?"

## Context & Problem Statement

The app teaches young children animal sounds in Ukrainian, Spanish, and English. The child picks a language (shown by a flag), sees an animal, and in Quiz mode is asked what the animal says (e.g., Spanish "¿Qué hace la vaca?"). The child speaks the sound and the app should cheer when it's close enough.

Two defects surface when the selected language is **not** English:

1. **Feedback text stays in English.** When Spanish is selected, the question appears in Spanish but the reaction/result line stays in English (e.g., *"It says \"mu\". Great trying! Tap ▶ for the next animal."* — see attached screenshot). The child (and a non-English-reading parent) sees mixed languages.

2. **The spoken-answer check fails in Ukrainian and Spanish but passes in English.** Saying the cow sound ("muu") is accepted in English but rejected in Ukrainian and Spanish. The user asks whether additional recognition model(s) need to be wired.

**Investigation confirmed two independent root causes behind defect #2** (documented here to bound scope; the *what*, not the *how*):

- Non-English answers can never match the child's spoken word because the answer-matching step discards every non-Latin (A–Z) character before comparing. Ukrainian accepted answers are written in Cyrillic (е.g. "му", "муу"), so they are erased to nothing and never match. Spanish answers are Latin letters and survive, but only match on the rare occasion recognition returns clean Latin text.
- Only one on-device recognition capability is bundled (English). For Ukrainian and Spanish the app depends entirely on the browser's built-in cloud speech service, which is unavailable or unreliable in common child-friendly contexts (e.g. the in-app browser used in the screenshot). When that service is missing, the app silently falls back to the English recognizer, which cannot understand Ukrainian or Spanish speech.

So the direct answer to the user's question: **yes — non-English recognition is not fully wired, AND the answer-matching logic must be made script-aware.** Fixing only the model wiring would still leave Ukrainian broken; fixing only the matcher would still leave languages without a working recognizer. **Decision recorded:** recognition stays on-device for every language, so Ukrainian and Spanish require their own bundled offline recognizers (see FR-011).

## Clarifications

### Session 2026-08-13

- Q: How should the Ukrainian and Spanish on-device recognizers be delivered to the child's device? → A: Lazy-load the recognizer for the currently selected language on demand, cache it after first load, and show the localized "unavailable" (reveal/skip) state until it is ready.
- Q: Once a language's recognizer has been downloaded, should it persist across app restarts or be re-downloaded each launch? → A: Persist across restarts — each language's model is fetched at most once per device and reused thereafter (usable offline after first load).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Localized quiz feedback (Priority: P1)

A parent sets the app to Ukrainian (or Spanish) for their child. Every piece of text the child and parent see during the quiz — the question, the cheer, the "try again" nudge, the reveal line, and the microphone-unavailable notice — appears in the selected language, with no English mixed in.

**Why this priority**: It is the most visible defect, affects 100% of non-English sessions regardless of microphone, and is low-risk to fix. It restores a coherent single-language experience even if recognition never runs.

**Independent Test**: Select each language, run through a quiz round forcing each feedback state (listening, correct, try-again, revealed, mic-unavailable), and confirm every line is in the selected language.

**Acceptance Scenarios**:

1. **Given** Spanish is selected, **When** the child answers correctly, **Then** the celebratory line is in Spanish.
2. **Given** Ukrainian is selected, **When** the child's answer is not recognized after the allowed attempts, **Then** the reveal line ("It says …, tap ▶ for the next animal") is in Ukrainian, including the animal's sound word.
3. **Given** Spanish is selected and the microphone is unavailable, **When** the quiz card loads, **Then** the unavailable-notice is in Spanish (this already works and MUST be preserved).
4. **Given** any language is selected, **When** the app is listening or waiting, **Then** the interim/listening feedback is in that language.

---

### User Story 2 - Ukrainian & Spanish answers are accepted (Priority: P1)

A child playing in Ukrainian or Spanish says the animal sound the way a toddler would ("muu", "гав", "guau"). The app accepts a reasonably close attempt and cheers, just as it does in English.

**Why this priority**: This is the core promise of the feature — the child must be able to "win" in their own language. It is tied with Story 1 as P1 because a quiz that never accepts a correct answer is not usable.

**Independent Test**: Feed representative recognized transcripts (in each language's native script and common near-misses) into the answer check against that language's accepted answers, and confirm correct sounds pass while clearly unrelated words fail — matching the leniency English already enjoys.

**Acceptance Scenarios**:

1. **Given** Ukrainian is selected and the cow's accepted answers include "му"/"муу", **When** the child says the Cyrillic cow sound, **Then** the answer is accepted.
2. **Given** Spanish is selected, **When** the child says "muu" for the cow (accepted answers include "mu"/"muu"), **Then** the answer is accepted.
3. **Given** any language, **When** the child says a clearly unrelated word, **Then** the answer is not accepted.
4. **Given** English is selected, **When** the child says "muu"/"moo", **Then** the answer is still accepted (no regression).
5. **Given** a child stretches the sound ("мууууу" / "muuuuu"), **When** it is checked, **Then** repeated letters are tolerated and the answer is accepted.

---

### User Story 3 - A recognizer that actually works in each language (Priority: P2)

When a child plays in Ukrainian or Spanish on a typical target device, spoken answers are actually captured — the app does not silently fall back to an English-only recognizer that cannot understand them, and it does not pretend to listen while being incapable of matching.

**Why this priority**: Stories 1 and 2 make the app *correct*; this story makes recognition *effective* on real devices. It is P2 because if a working recognizer for a language cannot be provided, the app must still degrade honestly (Story 4) rather than frustrate the child — so this can ship after the correctness fixes.

**Independent Test**: On a target device/browser for each language, speak the sound and confirm a matching transcript is produced by a recognizer appropriate to that language (not the English fallback).

**Acceptance Scenarios**:

1. **Given** Ukrainian is selected, **When** the child speaks, **Then** recognition is performed by a Ukrainian-capable recognizer, not the English-only one.
2. **Given** Spanish is selected, **When** the child speaks, **Then** recognition is performed by a Spanish-capable recognizer.
3. **Given** the app cannot provide a working recognizer for the selected language on the current device, **When** the quiz loads, **Then** the app does not silently use the English recognizer for that language.

---

### User Story 4 - Honest graceful degradation per language (Priority: P2)

If no working recognizer exists for the selected language on the child's device, the quiz still works: the child is shown the localized "listening isn't available" notice and can reveal the sound and move on — never stuck, never blamed for a wrong answer the app couldn't have heard.

**Why this priority**: Guarantees the app is never broken for a child even when speech capture is impossible. P2 because it builds on the localized-string work (Story 1) and the recognizer-availability signal (Story 3).

**Independent Test**: Simulate "no recognizer available" for Ukrainian/Spanish and confirm the localized unavailable notice shows and reveal/skip navigation works without any false "wrong answer" state.

**Acceptance Scenarios**:

1. **Given** the selected language has no usable recognizer on this device, **When** the quiz card loads, **Then** the localized unavailable notice is shown and the child can reveal/advance.
2. **Given** the unavailable state, **When** the child taps advance, **Then** navigation works and no incorrect-answer feedback is ever shown.

### Edge Cases

- Child stretches or repeats the sound ("муууу", "moo moo") — tolerated as a match.
- Recognition returns mixed scripts or extra words (e.g., "the cow says mu") — the correct sound within it should still match.
- Recognition returns nothing / times out / permission denied — treated as no-answer, leading to a localized retry then reveal, never a crash.
- A language is missing a translation for an animal — the existing English fallback for *content* remains; this feature does not change animal-content fallback, only feedback text and recognition behavior.
- Switching language mid-quiz — subsequent feedback and recognition use the newly selected language.
- Accepted answers differ in script between languages (Cyrillic vs Latin) — matching must be correct for each without cross-language leakage causing false accepts of unrelated words.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All quiz feedback states — listening/interim, correct, try-again, revealed, and microphone-unavailable — MUST be presented in the currently selected language.
- **FR-002**: The revealed-answer feedback MUST embed the animal's localized sound word within a fully localized sentence (no fixed English scaffolding around it).
- **FR-003**: The existing localized microphone-unavailable notice MUST be preserved and continue to work across all languages.
- **FR-004**: The spoken-answer check MUST correctly compare a recognized transcript against the selected language's accepted answers regardless of script, including non-Latin (e.g. Cyrillic) characters.
- **FR-005**: The answer check MUST retain its child-friendly leniency in every language: tolerate stretched/repeated letters, minor mispronunciations, and surrounding extra words, consistent with how English already behaves.
- **FR-006**: The answer check MUST still reject clearly unrelated words in every language, and MUST NOT accept an answer valid only in a different language than the one selected.
- **FR-007**: For each supported language, when the child speaks, the app MUST use a recognizer capable of that language and MUST NOT silently substitute the English-only recognizer for a non-English language.
- **FR-008**: When no capable recognizer is available for the selected language on the current device, the app MUST degrade gracefully: show the localized unavailable notice and allow reveal/advance, never presenting a false incorrect-answer result.
- **FR-009**: Correct behavior in English MUST be preserved (no regression to recognition, matching, or feedback).
- **FR-010**: Language switching MUST take effect for both feedback text and recognition on the next quiz interaction, without requiring a reload.
- **FR-011**: All speech recognition MUST run on-device for every supported language; recorded audio and transcripts MUST NOT leave the device. Ukrainian and Spanish recognition MUST be provided by bundled on-device recognizers (not the browser's cloud speech service), matching the existing English privacy guarantee.
- **FR-012**: When a supported language's on-device recognizer is not yet available on the device (e.g. still downloading, failed to load, or not bundled), the app MUST degrade per FR-008 (localized unavailable notice + reveal/advance) rather than fall back to a different language's recognizer.
- **FR-013**: The recognizer for a language MUST be loaded on demand — when that language is the selected one — rather than all recognizers up front, and once loaded MUST be cached for the rest of the session so repeat use incurs no additional wait.
- **FR-014**: A downloaded recognizer MUST persist across app restarts so each language's model is fetched at most once per device; after a language's first successful load, its recognition MUST work without re-downloading, including with no network connection.

### Key Entities *(include if feature involves data)*

- **Language**: A supported language the child plays in (Ukrainian, Spanish, English), each with a display flag, the language used to speak prompts/cheers, and the language used for recognition.
- **Localized feedback strings**: The set of quiz reaction/result messages (listening, correct, try-again, revealed template, unavailable) for each language.
- **Accepted answers**: Per-animal, per-language list of spoken words that count as correct (may be in the language's native script).
- **Recognizer capability**: For a given language on a given device, whether a working recognizer exists and where recognition happens (on-device vs off-device).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In 100% of non-English quiz sessions, every feedback line shown to the child is in the selected language (0 English strings observed across all feedback states).
- **SC-002**: A child speaking a correct animal sound in Ukrainian or Spanish is accepted at a rate comparable to English (within 10 percentage points) across the sample animal set.
- **SC-003**: Clearly unrelated words are rejected in at least 95% of trials in every language (no drop in strictness versus English).
- **SC-004**: 0 sessions silently use the English recognizer while a non-English language is selected.
- **SC-005**: In every "no recognizer available" case, the child can still reveal the sound and advance, with 0 false "wrong answer" outcomes.
- **SC-006**: English quiz pass/reject behavior is unchanged (0 regressions in the existing English test suite).
- **SC-007**: A language's recognizer model is downloaded at most once per device; on the second and later app launches for that language, recognition becomes available with no additional download and works with the network disabled.

## Assumptions

- The three supported languages remain Ukrainian, Spanish, and English; no new languages are added by this feature.
- Accepted answers continue to be authored per language in each language's natural script (Cyrillic for Ukrainian, Latin for Spanish/English).
- The target usage includes child-friendly/in-app browsers (e.g. the one in the screenshot) where the browser's built-in cloud speech recognition may be absent — so "it works in my desktop browser" is not sufficient acceptance.
- Animal *content* fallback to English (when a translation is missing) is existing, intended behavior and is out of scope here; this feature only fixes feedback-text language and recognition behavior.
- The child is a young learner, so recognition leniency and never-blocking degradation are more important than strict accuracy.
- **Decision (recorded):** all recognition stays on-device for every language; Ukrainian and Spanish require bundling their own on-device recognizers rather than relying on the browser's cloud speech service (FR-011). Larger app download for these models is accepted in exchange for a uniform privacy guarantee and reliability inside in-app browsers.

## Dependencies

- Existing language selection, localized UI strings, text-to-speech, and animal-content resolution remain in place and are reused.
- User Story 3 depends on obtaining/bundling on-device Ukrainian and Spanish recognizers (per the FR-011 on-device-only decision); availability of suitable offline models constrains the plan.
