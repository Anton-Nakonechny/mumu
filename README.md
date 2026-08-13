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

- `src/domain/` — pure game logic (collection loop, answer matching, quiz rule, cheer picker), unit-tested.
- `src/services/` — browser adapters (speech synthesis, on-device recognition, content loader).
- `src/components/` — React views (AnimalCard, Learn/Quiz modes, ModeToggle, Feedback).
- `specs/001-animal-sounds-quiz/` — base game spec, plan, tasks, contracts, and validation guide.
- `specs/002-quiz-cheer-advance/` — quiz correct-answer cheer + auto-advance spec, plan, and tasks.
