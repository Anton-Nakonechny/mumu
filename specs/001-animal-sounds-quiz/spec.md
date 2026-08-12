# Feature Specification: Animal Sounds Game

**Feature Branch**: `001-animal-sounds-quiz`

**Created**: 2026-08-11

**Status**: Draft

**Input**: User description: "the game described in spec.md with pictures like the cute cartoon dog and cow images"

## Clarifications

### Session 2026-08-11

- Q: Where is the child's recorded voice processed to check the animal sound — on-device or sent to an external/cloud speech service? → A: On-device only; no audio or transcript ever leaves the device.
- Q: How is each picture linked to its animal name and expected sound(s)? → A: A companion metadata file/list maps each image to its animal name, sound word, and accepted spoken answers.
- Q: In Quiz mode, after how many missed attempts should the game let the child move on? → A: After 2 misses, gently reveal and speak the correct sound, then allow advancing.
- Q: Should the spoken animal sound match its on-screen spelling? → A: Yes — each animal has one natural, text-to-speech-pronounceable sound word used for both display and speech (e.g., "moo", not "muuuu"), so the speech engine reads it correctly.
- Q: Must on-demand replay work every time it is tapped? → A: Yes — tapping replay must reliably re-speak the current sentence on every tap, and the app must tolerate speech-engine timing quirks so audio is never silently dropped (refines FR-004).

## User Scenarios & Testing *(mandatory)*

The game is a playful learning app for young children. It shows friendly cartoon animal
pictures (for example the smiling dog and the cheerful cow) one at a time. In the first
mode the game teaches the sound each animal makes; in the second mode it turns that
learning into a spoken guessing game. A parent or older sibling typically sets the game
going, and the child interacts by looking, listening, speaking, and swiping.

### User Story 1 - Learn animal sounds (Priority: P1)

A child is shown a large, colorful picture of one animal. The game speaks a short,
friendly sentence out loud that names the animal and the sound it makes (for example,
"The cow says muuuu"). The child can move to the next animal by swiping left or right
or by pressing a clearly visible Next/Previous button, and each new animal is announced
the same way.

**Why this priority**: This is the core, self-contained value of the game — a child (even
a pre-reader) can learn animals and their sounds with zero setup and no need to speak or
be understood. It is a complete, demonstrable experience on its own and forms the MVP.

**Independent Test**: Launch the game in Learn mode, confirm the first animal picture is
displayed and its sentence is spoken aloud, swipe/press to advance through several animals,
and confirm each new animal's picture appears and its sentence is spoken.

**Acceptance Scenarios**:

1. **Given** the game is opened in Learn mode, **When** the first animal appears, **Then** its picture fills the screen and the game speaks a sentence naming the animal and its sound (e.g., "The cow says muuuu").
2. **Given** an animal is shown, **When** the child swipes left (or presses Next), **Then** the next animal's picture is shown and its sentence is spoken.
3. **Given** an animal is shown, **When** the child swipes right (or presses Previous), **Then** the previous animal's picture is shown and its sentence is spoken.
4. **Given** the last animal is shown, **When** the child advances, **Then** the game wraps to the first animal (the collection is a continuous loop).
5. **Given** an animal is shown, **When** the child taps the picture or a "say it again" control, **Then** the animal's sentence is spoken again.

---

### User Story 2 - Guess the sound (voice quiz) (Priority: P2)

A child is shown an animal picture and the game asks out loud, "What does the cow say?"
The child answers by speaking the sound (e.g., "muuuu") into the device. The game listens,
checks whether the child's answer contains the expected sound, and gives friendly
encouraging feedback (a happy reaction for a match, a gentle "try again" otherwise). The
child can move to the next animal by swiping or pressing a button.

**Why this priority**: This builds on the learning experience to make it interactive and
rewarding, but it depends on the animal collection and playback already established in
Story 1 and requires microphone access, so it is the second slice.

**Independent Test**: Launch the game in Quiz mode, confirm an animal is shown and the
question is spoken, speak the expected sound and confirm a positive reaction, speak an
unrelated sound and confirm a gentle retry prompt, then swipe/press to move to the next
animal.

**Acceptance Scenarios**:

1. **Given** the game is opened in Quiz mode, **When** an animal appears, **Then** its picture is shown and the game asks aloud what that animal says (e.g., "What does the cow say?").
2. **Given** the question has been asked, **When** the child speaks the expected sound (e.g., "muuuu"), **Then** the game recognizes a match and gives a positive, celebratory response.
3. **Given** the question has been asked, **When** the child speaks something that does not contain the expected sound, **Then** the game gives gentle, encouraging feedback and lets the child try again.
4. **Given** the child has missed twice on the same animal, **When** the second miss is registered, **Then** the game gently reveals and speaks the correct sound and allows the child to move on.
5. **Given** any quiz result, **When** the child swipes or presses Next, **Then** the next animal is shown and its question is asked.
6. **Given** the game needs to listen, **When** microphone permission has not yet been granted, **Then** the child/parent is prompted to allow it, and the game clearly indicates listening is unavailable if declined.

---

### User Story 3 - Switch between modes (Priority: P3)

A parent or child can switch between Learn mode and Quiz mode at any time using a simple,
clearly labeled control, without restarting or reloading the game.

**Why this priority**: Being able to move between teaching and testing improves the overall
experience, but each mode delivers value independently, so mode switching is a convenience
layered on top of the first two stories.

**Independent Test**: From Learn mode, use the mode control to switch to Quiz mode and
confirm the quiz behavior begins; switch back and confirm Learn behavior resumes.

**Acceptance Scenarios**:

1. **Given** the game is in Learn mode, **When** the child/parent selects Quiz mode, **Then** the current animal is presented as a quiz question.
2. **Given** the game is in Quiz mode, **When** the child/parent selects Learn mode, **Then** the current animal's teaching sentence is spoken.

---

### Edge Cases

- **Spoken output unavailable**: If the device cannot speak text aloud, the game still shows the picture and displays the sentence/question as on-screen text so play can continue.
- **Microphone unavailable or denied**: Quiz mode clearly indicates that listening is unavailable and offers a way to continue (e.g., a "reveal the answer" / tap-to-pass control) instead of blocking the child.
- **No speech detected**: If the child says nothing within a short listening window, the game gently re-asks or invites another try rather than failing silently; a listening window that ends with no recognizable answer counts as a missed attempt toward the 2-miss reveal.
- **Unclear or partial speech**: A recognizable partial match to the expected sound (e.g., "mooo" vs "muuuu") is treated leniently as correct; unrelated words are treated as a miss.
- **Rapid swiping**: Quickly swiping multiple times does not stack overlapping speech; the game speaks only the currently displayed animal.
- **Repeated replay taps**: Tapping the replay control repeatedly must re-speak the sentence every time; the game must work around speech-engine quirks (e.g., interrupt/restart timing, delayed voice availability) so a tap never results in silence.
- **Empty or unreadable picture collection**: If no valid animal pictures are available, the game shows a friendly message explaining there are no animals to play with instead of a blank screen.
- **Picture without a known sound**: An animal picture that has no defined sound is either skipped or shown with a neutral prompt, and never crashes the game.
- **Background noise**: Loud ambient noise should not be misread as a correct answer for an unrelated animal.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game MUST present animals one at a time as a large, child-friendly cartoon picture (such as the sample dog and cow images).
- **FR-002**: In Learn mode, the game MUST speak aloud a short sentence that names the currently shown animal and the sound it makes (e.g., "The cow says moo").
- **FR-002a**: Each animal's sound word MUST be a natural, pronounceable spelling so that text-to-speech reads it correctly (e.g., "moo" rather than "muuuu"); the same sound word is used both on screen and for speech.
- **FR-003**: Users MUST be able to advance to the next animal and return to the previous animal using both a swipe gesture (left/right) and an on-screen button.
- **FR-004**: The game MUST announce (speak) each animal when it becomes the currently shown animal, and MUST allow the child to replay that announcement on demand.
- **FR-005**: The animal collection MUST be sourced from a set of picture files paired with a companion metadata file that maps each image to its animal name, sound word/phrase, and accepted spoken answers; adding or removing an animal (a picture plus its metadata entry) MUST change the animals available in the game without code changes to game logic.
- **FR-006**: In Quiz mode, the game MUST ask aloud what the currently shown animal says (e.g., "What does the cow say?").
- **FR-007**: In Quiz mode, the game MUST listen to the child's spoken answer and determine whether it contains the expected sound for that animal, processing the audio entirely on the device so that no recorded audio or transcript ever leaves the device.
- **FR-008**: The game MUST give immediate, child-appropriate feedback: a positive celebratory response for a correct answer and gentle encouragement to retry for an incorrect one.
- **FR-008a**: After 2 missed attempts on the same animal, the game MUST gently reveal and speak the correct sound and allow the child to move on, so the child is never stuck.
- **FR-009**: Users MUST be able to move between animals in Quiz mode using both swipe gestures and on-screen buttons, regardless of whether the current animal was answered correctly.
- **FR-010**: Users MUST be able to switch between Learn mode and Quiz mode at any time without restarting the game.
- **FR-011**: The game MUST request microphone access before listening and MUST continue to function (with listening disabled and a clear indication) if access is denied.
- **FR-012**: The game MUST remain usable when spoken output is unavailable by showing the sentence/question as on-screen text.
- **FR-013**: Sound matching MUST be lenient enough to accept a young child's approximate pronunciation of the expected sound while rejecting clearly unrelated answers.
- **FR-014**: The game MUST present controls (Next, Previous, replay, mode switch, listen/answer) as large, clearly distinguishable targets suitable for young children.
- **FR-015**: The animal collection MUST loop continuously so the child can keep playing without reaching a dead end.

### Key Entities *(include if feature involves data)*

- **Animal**: One playable animal. Key attributes: a display picture, the animal's name (e.g., "cow"), the sound it makes as a short spoken word/phrase (e.g., "muuuu"), and the acceptable spoken answers used to judge a quiz response.
- **Animal Collection**: The ordered set of animals available to play, derived from the picture files and their companion metadata entries (name, sound word, accepted answers); supports moving forward, backward, and looping.
- **Game Session**: The current state of play — which mode is active (Learn or Quiz), which animal is currently shown, and the most recent quiz result/feedback.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time child can start the game and reach the first spoken animal announcement in under 5 seconds without adult help beyond opening the app.
- **SC-002**: In Learn mode, 100% of animals in the collection display a picture and produce a spoken (or, if audio is unavailable, on-screen) sentence naming the animal and its sound.
- **SC-003**: Advancing to the next or previous animal (by swipe or button) shows the new animal and begins its announcement within 1 second of the interaction.
- **SC-004**: In Quiz mode, a child who speaks the expected animal sound receives a correct-answer response at least 90% of the time in a normal quiet-room setting.
- **SC-005**: In Quiz mode, a clearly unrelated spoken answer is accepted as correct less than 5% of the time.
- **SC-006**: When microphone or spoken-output capabilities are unavailable, the game never blocks play and always presents a way to continue, verified for both conditions.
- **SC-007**: Children aged 2–6 can, after one short demonstration, independently advance animals and trigger replays in at least 80% of observed attempts.
- **SC-008**: No child voice audio or transcript leaves the device during Quiz mode — verifiable by observing zero outbound network transmission of recorded audio/transcript data.

## Assumptions

- **Target users**: Children roughly ages 2–6, usually with a parent nearby for initial setup and microphone permission; children are pre-readers, so audio and pictures carry the experience.
- **Language**: Spoken sentences, questions, and expected sounds are in a single language (English) for the first version; multilingual support is out of scope for v1.
- **Animal source**: Each animal picture in the collection has a matching entry in a companion metadata file that provides the animal name, its sound word/phrase, and the accepted spoken answers, since a raw image alone does not convey the sound.
- **Provided images**: The sample cartoon dog and cow images are representative of the picture style; the actual collection is a folder of similar child-friendly animal pictures.
- **Device & environment**: The game runs on a common web-capable device (tablet, phone, or computer) with a screen, a speaker for spoken output, and a microphone for the quiz; a reasonably quiet room is assumed for voice recognition.
- **Voice recognition scope**: The quiz checks for the presence of the expected sound within the child's spoken answer with lenient matching; it is not expected to perform precise transcription or handle heavy background noise.
- **Sound-word data**: A default set of common animals and their sounds (cow/moo, dog/woof, cat/meow, etc.) is used, with natural TTS-pronounceable spellings, and this list can be extended by adding pictures with their name/sound information.
- **Single player, no accounts**: The game is a single-child, no-login experience for v1; progress tracking, scoring history, and user accounts are out of scope.
