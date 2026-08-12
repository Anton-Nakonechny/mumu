# Animal Sounds Game 🐮🐶

A browser learning game for young children (ages ~2–6). It shows friendly cartoon animals
and teaches the sound each one makes, then lets the child guess sounds out loud.

- **Learn mode** — shows an animal and says *"The cow says muuuu"*. Swipe or tap ◀ ▶ to
  move between animals; tap 🔊 to hear it again.
- **Quiz mode** — asks *"What does the cow say?"*, listens, and cheers a correct answer.
  After two misses it gently reveals the sound. Works even if the mic is unavailable.

Voice recognition runs **entirely on the device** — no recorded audio or transcript ever
leaves the browser.

## Run

```bash
npm install
npm run dev        # open the printed localhost URL
npm test           # unit + component tests (Vitest)
npm run build      # production build
```

## Add or change animals (no code needed)

Animals are defined by pictures plus a companion metadata file — edit data, not code.

1. Drop a picture into `public/assets/animals/` (e.g. `cat.png`).
2. Add an entry to `public/assets/animals.json`:

   ```json
   {
     "id": "cat",
     "name": "cat",
     "image": "assets/animals/cat.png",
     "soundWord": "meow",
     "acceptedAnswers": ["meow", "miaow", "meaow"]
   }
   ```

   - `soundWord` is what Learn mode says.
   - `acceptedAnswers` are the spoken answers Quiz mode accepts (matched leniently).
   - Optional `learnPhrase` / `quizPrompt` override the default sentences.

   The full shape is described in
   [`specs/001-animal-sounds-quiz/contracts/animals-metadata.schema.json`](specs/001-animal-sounds-quiz/contracts/animals-metadata.schema.json).

3. Reload — the new animal appears in rotation. Remove all entries and the app shows a
   friendly empty state.

## On-device speech recognition (Quiz mode)

Recognition uses a WebAssembly recognizer (`vosk-browser`) constrained to the expected
animal sounds. Place a Vosk model under `public/assets/models/` (see
`src/services/speechRecognition.ts` for the expected path). Without a model, Quiz mode
degrades gracefully: the child can still reveal the sound and move on.

## Project layout

- `src/domain/` — pure game logic (collection loop, answer matching, quiz rule), unit-tested.
- `src/services/` — browser adapters (speech synthesis, on-device recognition, content loader).
- `src/components/` — React views (AnimalCard, Learn/Quiz modes, ModeToggle, Feedback).
- `specs/001-animal-sounds-quiz/` — spec, plan, tasks, contracts, and validation guide.
