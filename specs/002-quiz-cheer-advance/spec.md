# Feature Specification: Quiz Cheer & Auto-Advance

**Feature Branch**: `002-quiz-cheer-advance`

**Created**: 2026-08-12

**Status**: Draft

**Input**: User description: "in a quiz mode I want TTS to cheer out loud after a correct answer and continue to the next animal after a short delay"

## User Scenarios & Testing *(mandatory)*

This feature enhances the existing Quiz mode of the Animal Sounds Game. Today, when a child
answers correctly the game gives a positive response and waits for the child (or a nearby
adult) to swipe or press Next. This feature makes a correct answer feel more rewarding and
keeps the game flowing hands-free for a young pre-reader: the game **speaks an enthusiastic
cheer out loud** the moment the answer is right, then **moves on to the next animal by itself**
after a short pause — so a child can keep playing a whole round without needing an adult to
tap between animals.

### User Story 1 - Hear a spoken cheer for a correct answer (Priority: P1)

A child in Quiz mode is asked what an animal says and answers with the expected sound. The
game recognizes the correct answer and immediately celebrates out loud with a short, happy
spoken cheer (for example, "Yay! Great job!"). The cheer is clearly celebratory and distinct
from the ordinary question/answer speech, so the child feels rewarded for getting it right.

**Why this priority**: The audible celebration is the heart of the request and the part a
pre-reading child perceives directly. It delivers standalone value — a more rewarding quiz —
even without any change to how animals are advanced.

**Independent Test**: In Quiz mode, answer an animal correctly and confirm the game speaks an
enthusiastic cheer aloud right after recognizing the answer; answer incorrectly and confirm
no cheer is spoken (the existing gentle retry behavior is unchanged).

**Acceptance Scenarios**:

1. **Given** Quiz mode has asked what an animal says, **When** the child speaks the expected sound and it is recognized as correct, **Then** the game speaks a short, enthusiastic cheer aloud.
2. **Given** the child answered correctly, **When** the cheer is spoken, **Then** it is audibly distinct from the neutral question/answer voice (celebratory in wording and/or delivery).
3. **Given** the child answered incorrectly, **When** the miss is registered, **Then** no cheer is spoken and the existing gentle "try again" feedback plays instead.
4. **Given** spoken output is unavailable on the device, **When** the child answers correctly, **Then** the game shows a celebratory visual/text cheer instead so the reward is never silently lost.

---

### User Story 2 - Automatically continue to the next animal (Priority: P2)

After a child answers correctly and the cheer plays, the game waits a short, child-friendly
pause and then automatically presents the next animal and asks its question — without needing
anyone to swipe or press Next. The pause is long enough for the child to enjoy the celebration
but short enough to keep the game moving.

**Why this priority**: Hands-free progression keeps a young child in flow, but it builds on the
correct-answer recognition and cheer from Story 1 and is a convenience layered on top of the
already-working manual advance.

**Independent Test**: In Quiz mode, answer an animal correctly and, without touching the screen,
confirm that after a short delay the next animal appears and its question is asked; confirm the
child can still manually swipe/press Next before the delay elapses.

**Acceptance Scenarios**:

1. **Given** the child answered correctly and the cheer has played, **When** the short delay elapses, **Then** the next animal is shown and its quiz question is asked, with no manual input required.
2. **Given** the game is counting down the short delay before auto-advancing, **When** the child swipes or presses Next first, **Then** the game advances immediately and does not also auto-advance a second time.
3. **Given** the child answered correctly, **When** the auto-advance occurs, **Then** the cheer for the previous animal and the question for the next animal do not overlap or talk over each other.
4. **Given** the child answered incorrectly (not the 2-miss reveal), **When** the miss is registered, **Then** the game does NOT auto-advance and waits for the child to retry or move on as it does today.

---

### Edge Cases

- **Rapid correct answers / fast manual advance**: If the child (or adult) advances manually during the post-correct delay, the pending auto-advance is cancelled so the game never skips an extra animal.
- **Cheer and next question overlap**: Auto-advance must not let the outgoing cheer and the incoming question speak simultaneously; the next question waits until the cheer has finished (or is cleanly interrupted) before speaking.
- **Spoken output unavailable**: When the device cannot speak, the cheer is presented visually and the auto-advance still occurs after the short delay so play continues.
- **Mode switch during the delay**: If the mode is switched (e.g., to Learn) or the app is backgrounded during the post-correct delay, the pending auto-advance is cancelled and does not fire later unexpectedly.
- **Correct answer reached via the 2-miss reveal**: When the game reveals and speaks the correct sound after 2 misses, it is treated as a "move on" prompt, not a celebrated correct answer — see Assumptions for whether it auto-advances.
- **Looping past the last animal**: Auto-advancing from the last animal wraps to the first, consistent with the existing continuous-loop behavior.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: In Quiz mode, when a child's answer is recognized as correct, the game MUST speak an enthusiastic celebratory cheer aloud (e.g., "Yay! Great job!").
- **FR-002**: The correct-answer cheer MUST be perceptibly celebratory and distinguishable from the neutral question/answer speech, refining the existing "positive celebratory response" requirement (001-animal-sounds-quiz FR-008). Distinctiveness is met by drawing each cheer from a dedicated set of short, exclamatory celebratory phrases that are never used as questions or neutral prompts (so membership in that celebratory set is the objective, testable criterion — not merely being different from the current prompt string).
- **FR-003**: The game MUST NOT speak a cheer for an incorrect answer; the existing gentle retry feedback MUST remain unchanged for misses.
- **FR-004**: After a correct answer and its cheer, the game MUST automatically advance to the next animal and ask its question after a short, child-appropriate delay, with no manual input required.
- **FR-005**: The auto-advance MUST be cancellable: if the child swipes or presses Next (or Previous) during the delay, the game advances on that input and MUST NOT also auto-advance afterward.
- **FR-006**: The game MUST prevent the correct-answer cheer and the next animal's question from playing over each other; the next question MUST begin only after the cheer has finished or been cleanly stopped.
- **FR-007**: A pending auto-advance MUST be cancelled if the child leaves the current animal by other means before it fires (e.g., manual navigation, switching modes, or the app being backgrounded), so it never advances an unexpected animal later.
- **FR-008**: When spoken output is unavailable, the game MUST present the cheer as a celebratory visual/text cue and MUST still perform the auto-advance after the short delay.
- **FR-009**: Auto-advancing past the last animal MUST wrap to the first animal, consistent with the game's continuous-loop behavior (001-animal-sounds-quiz FR-015).

### Key Entities *(include if feature involves data)*

- **Cheer**: A short, celebratory spoken (and, as a fallback, visual/text) reaction played on a correct quiz answer; drawn from a small set of encouraging phrases so it does not feel repetitive.
- **Quiz Result (extended)**: The outcome of a quiz attempt (correct / miss / revealed). Only a *correct* result triggers a cheer and a scheduled auto-advance; this extends the existing quiz result state in 001-animal-sounds-quiz.
- **Pending Auto-Advance**: The scheduled, cancellable transition to the next animal that is armed after a correct answer and disarmed by any manual navigation, mode switch, or app backgrounding.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In Quiz mode, 100% of recognized correct answers produce a celebratory cheer — spoken when audio is available, and a visual/text cheer when it is not.
- **SC-002**: After a correct answer, the game presents the next animal and begins its question automatically, with no manual input, in every correct-answer case.
- **SC-003**: The child perceives the celebration before the next animal appears: the cheer begins immediately (within about 1 second of the answer being recognized) and the next question does not start until the cheer has finished or been cleanly stopped, with no overlapping speech in any observed correct answer.
- **SC-004**: When the child manually advances during the post-correct delay, no extra animal is ever skipped (0 double-advances across repeated trials).
- **SC-005**: Incorrect answers never trigger a cheer or an auto-advance (0 occurrences across repeated trials).
- **SC-006**: A child can complete a full loop of the animal collection in Quiz mode using only their voice for correct answers, without any adult taps to move between correctly answered animals.

## Assumptions

- **Builds on existing Quiz mode**: This feature extends the Quiz mode defined in `001-animal-sounds-quiz` (correct/incorrect recognition, the 2-miss reveal, manual swipe/button navigation, and on-device speech) rather than redefining it.
- **Short delay length**: "A short delay" is assumed to be roughly 1.5–2.5 seconds *after the cheer finishes*, chosen to let the child enjoy the celebration without stalling the game; the exact value is a tunable detail, not a fixed requirement.
- **Cheer content**: The cheer is a short encouraging phrase (e.g., "Yay!", "Great job!", "Well done!") selected from a small rotating set so repeated correct answers do not always sound identical; wording is English for v1, consistent with the existing single-language assumption.
- **Correct answers only**: Only a recognized correct answer triggers the cheer and auto-advance. The 2-miss reveal path speaks the correct sound as today and is assumed to NOT auto-advance (the child chooses when to move on), keeping this feature scoped to genuine correct answers.
- **Manual navigation preserved**: Existing swipe and Next/Previous controls continue to work at all times, including during the post-correct delay, and take precedence over the pending auto-advance.
- **No new scoring or accounts**: This feature adds no scoring history, streak tracking, or accounts; it only changes the immediate reaction and progression after a correct answer.
