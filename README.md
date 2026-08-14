# Animal Sounds Game 🐮🐶

A browser learning game for young children (ages ~2–6). It shows friendly cartoon animals
and teaches the sound each one makes, then lets the child guess sounds out loud.

- **Learn mode** — shows an animal and says *"The cow says muuuu"*. Swipe or tap ◀ ▶ to
  move between animals; tap 🔊 to hear it again.
- **Quiz mode** — asks *"What does the cow say?"*, listens, and **cheers a correct answer out
  loud** (e.g. *"Yay! Great job!"*) then **auto-advances to the next animal after a short pause**,
  so a child can play a whole round hands-free. Tapping ◀ ▶ during the pause advances immediately.
  After two misses it gently reveals the sound (and waits). Works even if the mic is unavailable.

Voice recognition runs **entirely on the device** — no recorded audio or transcript ever
leaves the browser.

## Run

```bash
npm install
npm run dev        # open the printed localhost URL
npm test           # unit + component tests (Vitest)
npm run build      # production build
```

## Play on another device over your local network

Quiz mode needs the microphone, which browsers only allow in a **secure context**
(`https://` or `localhost`). To reach the game from a phone or tablet on the same
Wi-Fi without certificate warnings, serve it over HTTPS with a
[mkcert](https://github.com/FiloSottile/mkcert) certificate that each device trusts
once. No account, no tunnel — nothing leaves your LAN.

**One-time setup on this machine:**

```bash
brew install mkcert nss   # nss only needed if you use Firefox
mkcert -install           # trust the local CA (prompts for your password)
npm run cert              # mint certs/ for anakon.local, localhost, and your LAN IP
```

`vite.config.ts` automatically serves HTTPS when `certs/dev-cert.pem` and
`certs/dev-key.pem` exist (and plain HTTP otherwise). The `certs/` folder is
gitignored. If your LAN IP changes, re-run `npm run cert` and restart — or just use
the `anakon.local` hostname, which doesn't change.

**One-time trust on each phone/tablet.** Copy the root CA to the device (its path is
`"$(mkcert -CAROOT)/rootCA.pem"`; AirDrop or email it), then:

- **iPhone / iPad:** open the file → install the profile under
  **Settings ▸ General ▸ VPN & Device Management**, then enable it under
  **Settings ▸ General ▸ About ▸ Certificate Trust Settings** (this last toggle is
  required, or iOS still warns).
- **Android:** **Settings ▸ Security ▸ Encryption & credentials ▸ Install a
  certificate ▸ CA certificate**.
- **Another Mac/PC:** install mkcert there and run `mkcert -install`, or add
  `rootCA.pem` to the system trust store manually.

**Then, each time:**

```bash
npm run dev
```

Open `https://anakon.local:5173` (or `https://<your-LAN-IP>:5173`) on any trusted
device — no warning, mic works, Quiz mode runs.

## Add or change animals (no code needed)

Animals are defined by pictures plus a companion metadata file — edit data, not code.

1. Drop a picture into `public/assets/animals/` (e.g. `cat.png`).
2. Add an entry to `public/assets/animals.json`:

   ```json
   {
     "id": "cat",
     "image": "assets/animals/cat.png",
     "translations": {
       "en": {
         "name": "cat",
         "soundWord": "meow",
         "acceptedAnswers": ["meow", "miaow", "meaow"]
       },
       "uk": {
         "name": "кіт",
         "soundWord": "мяу",
         "acceptedAnswers": ["мяу", "мяв", "meow", "meaw"],
         "learnPhrase": "Кіт каже... мяу!",
         "quizPrompt": "Що каже кіт?"
       }
     }
   }
   ```

   - `translations` holds one block per language (`en`, `uk`, `es`); add only the
     languages you want to support for that animal.
   - `name` / `soundWord` are the localized label and the sound Learn mode says.
   - `acceptedAnswers` are the spoken answers Quiz mode accepts (matched leniently).
     For `uk`, include **Latin sound-alikes** (e.g. `"meow"`) — the recognizer emits
     Latin text, so Cyrillic-only answers won't match (see the trade-off note below).
   - Optional `learnPhrase` / `quizPrompt` override the default sentences per language.
   - A language you omit falls back to the `en` block; an animal with no usable
     `en` (or requested) translation is dropped from the roster.

   The full shape is the `LocalizedAnimalData` / `LocalizedTranslation` types in
   [`src/domain/animal.ts`](src/domain/animal.ts).

3. Reload — the new animal appears in rotation. Remove all entries and the app shows a
   friendly empty state.

## On-device speech recognition (Quiz mode)

Recognition uses a WebAssembly recognizer (`vosk-browser`) constrained to the expected
animal sounds. Place a Vosk model under `public/assets/models/` (see
`src/services/speechRecognition.ts` for the expected path). Without a model, Quiz mode
degrades gracefully: the child can still reveal the sound and move on.

### Ukrainian goes through the English model (a deliberate trade-off)

Ukrainian sessions **reuse the English acoustic model** in free-form mode as a
cross-lingual phonetic approximator: it hears "муу" and emits its nearest English
word, "moo". The English model only ever produces **Latin** text, never Cyrillic.

**What this means when you add a Ukrainian animal:** it is only recognized if its
`acceptedAnswers` include **Latin sound-alikes** (e.g. cow → `"moo"`, dog → `"gov"`,
`"hob"`). Answers left **Cyrillic-only are unmatchable by design** — a Latin
transcript and a Cyrillic target never share a consonant skeleton, so the matcher
can't bridge them. This never produces a false "wrong": the worst case is a
near-miss that falls through to the child-safe reveal/skip path. Today this works
for exactly the two Ukrainian animals (cow, dog) that were given Latin variants.

Why not fix it the obvious ways?

- **A bigger Ukrainian model won't fit the target device.** The `-small` UK model's
  uncompressed in-memory footprint (~133 MB) risks crashing a mobile in-app browser
  tab — outside our device budget. (The nano UK model *does* fit but its lexicon
  lacks the onomatopoeia and `[unk]`, so its grammar collapses to empty transcripts.)
- **A cloud/backend recognizer is ruled out for this app.** It would break the
  on-device/offline guarantee, require a hosted proxy plus API keys (which can't ship
  in-client), add network latency and a multi-node architecture, and open a
  data-privacy/COPPA obligation for toddler voice.

Full rationale and rejected alternatives:
[`specs/005-fix-multilingual-quiz/research.md`](specs/005-fix-multilingual-quiz/research.md)
(section R5).

## Project layout

- `src/domain/` — pure game logic (collection loop, answer matching, quiz rule, cheer picker), unit-tested.
- `src/services/` — browser adapters (speech synthesis, on-device recognition, content loader).
- `src/components/` — React views (AnimalCard, Learn/Quiz modes, ModeToggle, Feedback).
- `specs/001-animal-sounds-quiz/` — base game spec, plan, tasks, contracts, and validation guide.
- `specs/002-quiz-cheer-advance/` — quiz correct-answer cheer + auto-advance spec, plan, and tasks.
