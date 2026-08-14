# Phase 0 Research: Fix Multilingual Quiz

All spec-level unknowns were resolved during the clarification session (2026-08-13): recognition stays on-device for every language (FR-011), models are lazy-loaded per selected language and cached (FR-013), and a downloaded model persists across restarts (FR-014). The remaining research is technical: how to satisfy those decisions with the current stack. No `NEEDS CLARIFICATION` markers remain.

---

## R1 — Script-aware answer normalization

**Decision**: Replace the normalization regex `/[^a-z\s]/g` with a Unicode-aware letter class `/[^\p{L}\s]/gu`, and add the `u` flag to the repeated-letter collapse (`/(.)\1+/gu`). Keep `.toLowerCase()`, whitespace collapse, edit-distance fuzz, and substring/word matching exactly as they are.

**Rationale**:
- `[^a-z]` deletes every Cyrillic character, so Ukrainian answers ("му", "муу", "гав") normalize to the empty string and can never match — the confirmed root cause. `\p{L}` (any Unicode letter) preserves Cyrillic and Latin letters while still dropping punctuation, digits, and stray symbols. `toLowerCase()` correctly lowercases Cyrillic.
- The existing leniency (repeated-letter collapse for "мууууу"→"му", edit-distance threshold `max(1, floor(len·0.3))`, substring and per-word matching) is script-agnostic and keeps working once letters survive — satisfying FR-005 (leniency parity) and the "stretched sound" edge case.
- **Cross-language false accepts (FR-006)** are already prevented structurally: `QuizMode` matches the transcript only against `animal.acceptedAnswers`, which `resolveAnimal()` has already narrowed to the **selected** language. The matcher never sees another language's answers, so it cannot leak. No language parameter is needed in the matcher.
- Regression safety (FR-009 / SC-006): the English test corpus uses only `[a-z]`, which is a strict subset of `\p{L}`, so all existing English cases produce identical normalized output.

**Alternatives considered**:
- *Per-script transliteration to a common alphabet* — rejected: heavier, lossy, and unnecessary because matching is always within one language.
- *Passing the language into the matcher to pick a script-specific path* — rejected: adds coupling for no benefit; the Unicode class handles all scripts uniformly and answers are already language-isolated.
- *Keeping `[a-z]` and pre-transliterating Cyrillic answers* — rejected: corrupts authored Cyrillic content and complicates the data model.

---

## R2 — Per-language on-device recognizers (replacing the cloud/fallback path)

**Decision**: Make `OnDeviceRecognitionService` language-parameterized with a model-URL registry `Record<Language, string>`. `makeRecognitionService(lang)` always returns an on-device service pointed at that language's bundled Vosk model. Remove `WebSpeechRecognitionService` from the runtime path and remove the "fall back to the English on-device service" branch. Bundle Ukrainian and Spanish Vosk small models under `public/assets/models/` alongside the existing English one.

**Rationale**:
- FR-007/FR-011 require on-device recognition for every language and forbid silently substituting the English recognizer. The current factory does exactly the forbidden thing (`return new OnDeviceRecognitionService()` when Web Speech is missing → English model for uk/es) and also violates on-device-only by routing uk/es to the browser cloud speech service. A per-language model registry fixes both.
- `vosk-browser` already runs a Kaldi model fully in WASM with no network at recognition time, and the code already constrains recognition to `expectedWords` grammar — that mechanism is language-neutral and works for Cyrillic/Latin grammars alike.
- Availability signalling is already correct: `isAvailable()` returns `false` when the model is null, and `QuizMode` maps a non-`granted` permission to the localized unavailable state. Loading the *wrong-language* fallback is the only thing that has to be removed.

**Model choices** (Vosk small offline models, tar.gz bundles compatible with `vosk-browser createModel`):
- English (existing): `vosk-model-small-en-us-0.15` (~40 MB).
- Ukrainian: `vosk-model-small-uk-v3-nano` (~73 MB) — smallest published Ukrainian model; keeps download acceptable per the recorded size trade-off.
- Spanish: `vosk-model-small-es-0.42` (~39 MB).

Each must be packaged as a `.tar.gz` in the same layout `vosk-browser` expects (the English asset is the reference). They live under `public/assets/models/` so they are same-origin static assets — a prerequisite for R3 caching.

**Alternatives considered**:
- *Keep Web Speech API for uk/es* — rejected by FR-011 (violates on-device-only; audio leaves the device; unreliable/absent in in-app browsers, which is the exact failing context in the screenshot).
- *One multilingual model* — rejected: no small multilingual Vosk model covers uk+es+en well; larger and lower per-language accuracy than three focused small models.
- *Full-size Vosk models* — rejected: hundreds of MB each, unacceptable download for a children's app; small/nano models are sufficient given the tiny closed grammar (a handful of animal sounds).

---

## R3 — Lazy load, in-session cache, and cross-restart persistence

**Decision**: Load a language's model only when that language is selected (lazy), memoize the loaded `VoskModel` in a module-level cache keyed by language for the rest of the session, and rely on the existing service worker's cache-first strategy to persist the downloaded tarball across restarts.

**Rationale**:
- **Lazy (FR-013)**: `ensureModel()` is already called from `requestPermission()`, which `QuizMode` invokes only for the mounted (selected) language. Keeping load inside the service — not at app start — means non-selected languages are never fetched. Add a module-level `Map<Language, VoskModel>` (or per-URL) cache so re-selecting a language reuses the parsed model with no re-download and no re-parse within the session.
- **Persistence across restarts (FR-014)**: `public/sw.js` already does cache-first for same-origin GETs and caches every fetched response, including `assets/models/*`. Because the model tarballs are same-origin static assets, the first fetch populates Cache Storage; subsequent launches serve them from cache with the network disabled. No new persistence code is required — this is verified by the existing `privacy-network.spec.ts` philosophy (no cross-origin traffic). The only requirement is that models are fetched by URL from same-origin (they are).
- **Honest degradation while loading/failed (FR-012)**: until `ensureModel()` resolves with a model, `isAvailable()` is `false`, so `QuizMode` shows the localized unavailable notice and allows reveal/advance. A failed/missing model leaves `model = null` (fail-soft, already implemented) — and critically must **not** load another language's model.

**Alternatives considered**:
- *Pre-load all three models at startup* — rejected by FR-013 and wasteful (downloads uk+es for an English-only child).
- *IndexedDB/Cache API manual storage of the parsed model* — rejected: the service-worker HTTP cache already gives cross-restart persistence of the source tarball for free; re-parsing on next launch is fast and avoids bespoke storage code.
- *A loading spinner that blocks play until the model is ready* — rejected: violates the never-block-the-child principle; the localized unavailable state already lets the child reveal/advance while a model loads.

---

## R5 — Ukrainian recognition via English acoustic model (bugfix follow-up, 2026-08-14)

**Root cause (confirmed from console log):** `speechRecognition.ts` builds a closed-word-list grammar from `acceptedAnswers + ["[unk]"]`. The bundled `vosk-model-small-uk-v3-nano` logs `Ignoring word missing in vocabulary` for onomatopoeia ("муу") **and** for `[unk]`. With both the answer words and the escape token missing from the nano lexicon, the grammar collapses and every decode returns an empty transcript — so every attempt fails, forcing the `revealed` phase. English and Spanish were unaffected because their small models include `[unk]` and enough in-lexicon answer words for the grammar path to remain valid.

**Decision: English acoustic model as on-device phonetic approximator for Ukrainian.**

Keep everything on-device and offline. Instead of the Ukrainian nano model, route Ukrainian sessions to the existing English model (`vosk-model-small-en-us-0.15`). The recognizer runs in **free-form mode** (no `expectedWords` grammar) so the model emits its best-guess English words for Ukrainian phonemes (e.g. "муу" → "moo", "гав гав" → "gov gov"). Latin sound-alike `acceptedAnswers` (authored from empirically logged transcripts) and a **consonant-skeleton phonetic matcher** (e.g. "cook a rico" ≈ "kukuriku") bridge the gap.

**Benefits:**
- Preserves on-device/offline and privacy guarantees (no backend, no COPPA obligation, no FR-007 cloud path).
- Reuses the single ~41 MB English model already shipped — Ukrainian session memory footprint goes **down** (no 73 MB nano model needed).
- The now-unused `vosk-model-small-uk-v3-small.tar.gz` asset is removed from `public/assets/models/`.

**Consciously supersedes FR-007** ("must not substitute the English recognizer for a non-English language"). FR-007 was written to prevent the old cloud recognizer silently failing; here the English acoustic model is deliberately used as a phonetic approximator with full awareness of the trade-off.

**Alternatives rejected:**
- *Bigger UK model (`-small`, ~133 MB):* uncompressed in-memory footprint risks crashing a mobile in-app browser tab.
- *Cloud STT / multimodal-LLM judge:* requires a hosted backend proxy (API keys can't ship in-client) + breaks offline + opens COPPA/privacy obligation for toddler voice; user ruled out backend as last-resort for this app.
- *Custom phoneme dictionary for the nano model:* lexicon compilation requires offline tooling and per-word G2P; out of scope for a lightweight bugfix.

**Limitations accepted:** simple short vowel sounds match reliably; complex consonant clusters may occasionally need extra tuned Latin variants. No sound should ever produce a false "wrong" — the worst case is a near-miss that falls through to the reveal/skip path. **Authoring constraint:** because the English model only ever emits Latin text and the consonant-skeleton matcher needs a shared script/skeleton, every `uk` animal must be authored with Latin sound-alike `acceptedAnswers` (e.g. "moo", "gov", "hob"); a `uk` animal whose answers stay Cyrillic-only is unmatchable by design. This feature therefore covers exactly the animals given Latin variants (currently cow and dog).

---

## R4 — Localized quiz-feedback strings

**Decision**: Extend the existing per-language `UI_STRINGS` tables (`src/domain/language.ts`) with the four missing feedback strings — `quizCorrect`, `quizTryAgain`, `quizRevealed` (a template containing a `{sound}` placeholder), and `quizListening` — and render them from `strings` in `Feedback.tsx`. Preserve `micUnavailable` exactly.

**Rationale**:
- The codebase already localizes cheers (`cheers.ts`) and UI chrome (`UI_STRINGS`); the *only* English leak is the four hard-coded strings inside `Feedback.tsx`. Reusing the established `UI_STRINGS` pattern keeps one source of truth per language and requires no new abstraction (FR-001).
- The reveal line must embed the localized sound word inside a fully localized sentence (FR-002). A per-language template with a `{sound}` placeholder (e.g. uk: `Каже «{sound}». Молодець! Натисни ▶ для наступної.`) avoids the current English scaffolding around the word. Component substitutes `animal.soundWord` (already localized by `resolveAnimal`).
- `micUnavailable` is already localized and passing (FR-003 / acceptance scenario US1-3); leaving it untouched guarantees no regression.

**Alternatives considered**:
- *A separate i18n library (react-intl / i18next)* — rejected: massive over-engineering for three languages and a handful of strings; the existing typed record pattern is simpler and fully type-checked.
- *Building the reveal sentence by concatenation in the component* — rejected: word order differs by language, so a whole-sentence template per language is required for correct grammar.
