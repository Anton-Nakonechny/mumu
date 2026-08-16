# Phase 0 Research: Add More Animals

All open questions from the spec were resolved in the 2026-08-16 clarification session.
This document records the decisions that drive Phase 1 design. There are **no remaining
NEEDS CLARIFICATION** items.

## R1 — How the app ingests a new animal (existing mechanism)

- **Decision**: Add each animal as one object in `public/assets/animals.json` plus one
  picture file in `public/assets/animals/`. No source code changes.
- **Rationale**: `HttpAnimalsRepository.loadLocalizedAnimals()` fetches `animals.json`,
  and `parseLocalizedAnimal` validates each entry: it requires a non-empty `id`, a
  non-empty `image`, a `translations` object, and a **valid `en` block** (non-empty
  `name`, `soundWord`, and ≥1 `acceptedAnswers`). Additional language blocks are read
  generically from `LANGUAGES` (`src/services/animalsRepository.ts:104`), so `uk`/`es`
  are picked up automatically. `resolveAnimals` then falls back to `en` per-language.
  `AnimalCollection` already wraps navigation around any roster size.
- **Alternatives considered**: Hard-coding animals in a TS module — rejected; it breaks
  the "edit data, not code" contract (SC-005) and the documented add-an-animal flow.

## R2 — Picture sourcing (license + style)

- **Decision**: Download friendly cartoon images for each of the seven animals from
  royalty-free / public-domain / CC0 sources, matching the existing cow and dog
  (PNG) cartoon style: single clear child-friendly subject, simple/transparent
  background, non-scary depiction (FR-002, FR-011).
- **Rationale**: Clarification A (2026-08-16) chose "web-search royalty-free". The
  existing assets are a cartoon vector cow and a cartoon dog PNG; new art should read as
  the same roster (SC-002 visual cohesion). Keep file sizes near the existing ~27–33 KB
  range to protect load/navigation performance (SC-006).
- **License hygiene**: Only use sources whose license permits use in this app
  (public-domain / CC0 / royalty-free with no attribution-in-app requirement, or record
  attribution where required). Reselect any picture whose style clashes with the roster.
- **Format**: `image` in JSON is just a relative path, so any browser-supported raster
  format works. The shipped set is a mix of PNG and WebP (see Asset Provenance); each
  file's extension matches its actual format. The wolf in particular must be a gentle,
  cartoonish depiction (not a menacing one) to stay child-appropriate.
- **Alternatives considered**: Generating images or commissioning art — out of scope and
  slower; the clarification explicitly chose sourcing existing royalty-free art.

## R3 — English accepted answers (recognizability)

- **Decision**: Use standard onomatopoeia as `soundWord` and provide `acceptedAnswers`
  biased toward common dictionary words the Vosk small English model is likely to emit.
  Working set:

  | Animal  | soundWord (en)      | Candidate acceptedAnswers (en)                          |
  |---------|---------------------|---------------------------------------------------------|
  | duck    | quack quack         | quack, quack quack, quackquack                           |
  | chicken | cluck cluck         | cluck, cluck cluck, bawk, buck, cluk                     |
  | rooster | cock-a-doodle-doo   | cockadoodledoo, cock a doodle doo, cock, doodle, crow    |
  | wolf    | awooo               | howl, awoo, ah woo, woo, owoo                             |
  | goat    | maa                 | maa, ma, mah, baa, meh                                   |
  | sheep   | baa                 | baa, ba, bah, maa                                        |
  | turkey  | gobble gobble       | gobble, gobble gobble, gobbles, wobble                   |

- **Rationale**: The recognizer is grammar-constrained to `expectedWords + [unk]`
  (`speechRecognition.ts:124`), and `answerMatcher` is lenient (letter-collapse +
  edit-distance + consonant-skeleton). Multi-word onomatopoeia should be listed both
  spaced and joined so either transcript form matches. Single-letter targets are rejected
  by the matcher, so every accepted answer is ≥2 chars.
- **Best-effort caveat (clarification A)**: Some sounds (turkey "gobble", rooster
  "cock-a-doodle-doo") are unreliable for the small model. Per FR-004, these stay fully
  playable via the child-safe reveal/skip path after two misses — **never blocked, never a
  false "wrong"** (`QuizMode` reveal behavior is unchanged).
- **Alternatives considered**: Restricting the roster to only easily-recognized sounds —
  rejected; the spec requires all seven, and the reveal/skip fallback already covers
  hard-to-recognize sounds safely.

## R4 — Ukrainian accepted answers (Latin sound-alike requirement)

- **Decision**: Every `uk` block MUST include Latin sound-alike `acceptedAnswers` in
  addition to Cyrillic ones, plus a `learnPhrase` and `quizPrompt` in Ukrainian.
  Provisional Latin sound-alikes:

  | Animal  | uk name  | uk soundWord | Latin sound-alikes to include        |
  |---------|----------|--------------|--------------------------------------|
  | duck    | качка    | кря кря      | krya, krja, krha, kra                |
  | chicken | курка    | ко-ко-ко     | ko ko, koko, kho                     |
  | rooster | півень   | кукуріку     | kukuriku, cook a rico, kukuriko      |
  | wolf    | вовк     | у-у-у        | oo oo, woo, awoo                     |
  | goat    | коза     | ме-ме        | meh meh, me, meeh                   |
  | sheep   | вівця    | бе-бе        | beh beh, be, beeh                   |
  | turkey  | індик    | ґел-ґел      | gel gel, gil gil, glue glue          |

- **Rationale**: Ukrainian sessions reuse the **English** acoustic model, which only ever
  emits Latin text (`MODEL_URLS.uk` → the en-us model; documented in `speechRecognition.ts`
  and README). Cyrillic-only answers are unmatchable by design; the `consonantSkeleton`
  matcher bridges a Latin transcript to a Latin target only. Following the existing
  cow (`"moo"`) / dog (`"gov"`,`"hob"`) precedent, each new `uk` animal gets Latin
  variants. Where a plausible Latin sound-alike is weak (rooster, turkey), the animal
  still degrades safely to reveal/skip.
- **Alternatives considered**: Bigger/nano UK model or a cloud recognizer — both rejected
  in spec 005 (see `specs/005-fix-multilingual-quiz/research.md` R5) for device-budget and
  privacy/COPPA reasons.

## R5 — Spanish accepted answers

- **Decision**: Each `es` block gets a Spanish `name`, `soundWord`, `acceptedAnswers`,
  `learnPhrase`, and `quizPrompt`, matching the existing vaca/perro entries. Spanish runs
  on a dedicated Spanish Vosk model (`vosk-model-small-es-0.42`), so answers can be
  authored in normal Spanish orthography.

  | Animal  | es name  | es soundWord | Candidate acceptedAnswers (es)     |
  |---------|----------|--------------|------------------------------------|
  | duck    | pato     | cuac cuac    | cuac, cua, cuac cuac               |
  | chicken | gallina  | coc coc      | coc, cocorococo, clo clo           |
  | rooster | gallo    | quiquiriquí  | quiquiriqui, kikiriki, quiquiriquí |
  | wolf    | lobo     | auuu         | auu, au, aullido                   |
  | goat    | cabra    | be be        | be, bee, mee                       |
  | sheep   | oveja    | bee          | bee, be, mee                       |
  | turkey  | pavo     | glugú        | glugu, gluglu, glu                 |

- **Rationale**: FR-009 / SC-007 require full trilingual coverage with non-fallback
  localized names & sounds verifiable by switching language. Spanish onomatopoeia differs
  from English (e.g. rooster "quiquiriquí"), so authoring native Spanish words is correct
  and recognizable by the Spanish model.
- **Alternatives considered**: Reusing English answers for Spanish — rejected; it would
  show English fallback names and violate SC-007.

## R6 — Failure & edge-case handling (already covered by existing code)

- **Decision**: No new code needed for edge cases.
- **Rationale**:
  - Missing/broken image (FR-010): `<img>` in `AnimalCard` renders `alt` text on error;
    the rest of the roster stays navigable — no crash.
  - Invalid/incomplete entry: `parseLocalizedAnimal` drops any animal lacking a valid
    `en` block; `resolveAnimals` skips unresolved ones; duplicate `id`s are de-duplicated
    (first wins). This satisfies the "drop, don't show broken" edge case.
  - Hard-to-recognize sounds: `QuizMode` reveal/skip fallback already prevents false
    "wrong" (FR-007).

## Asset Provenance (T010)

> **Note (2026-08-16):** The originally-sourced Fluent UI Emoji pictures were **manually
> replaced** with a different cartoon set after review (the first set was rejected on
> aesthetics). Source and license for the replacement images are **not yet verified** —
> see Open Items below. The table records the files as they now exist on disk.

The set is a mix of PNG and WebP, all browser-native raster formats. Two files carry a
`.png` extension but are actually WebP-encoded (`wolf.webp`, `sheep.webp`), so the extension
no longer matches the real format for those two — the browser sniffs content, so they
still render, but the names are misleading. Embedded metadata on some files indicates
stock-illustration origins rather than a single repository.

| Animal  | File                          | Format | Dimensions | Size   |
|---------|-------------------------------|--------|------------|--------|
| duck    | `assets/animals/duck.webp`    | WebP   | 980×980    | 202 KB |
| chicken | `assets/animals/chicken.png`  | PNG    | 360×360    | 32 KB  |
| rooster | `assets/animals/rooster.png`  | PNG    | 360×360    | 24 KB  |
| wolf    | `assets/animals/wolf.webp`     | WebP   | 945×1280   | 172 KB |
| goat    | `assets/animals/goat.webp`    | WebP   | 980×980    | 390 KB |
| sheep   | `assets/animals/sheep.webp`    | WebP   | 1280×1280  | 193 KB |
| turkey  | `assets/animals/turkey.png`   | PNG    | 360×360    | 37 KB  |

Style: flat cartoon illustrations at mixed resolutions (360 px up to ~1280 px), mixed
transparent/white backgrounds — a coherent child-friendly roster but **no longer the
256×256 3D-render style** of the original set. The larger WebP files are the perf-budget
outliers (SC-006): `goat.webp` (390 KB), `duck.webp` (202 KB), `sheep.webp` (193 KB) and
`wolf.webp` (172 KB) all sit well above the cow/dog ~27–33 KB budget, while the PNGs
(`chicken`, `rooster`, `turkey`) stay in the 24–37 KB range. The wolf is a gentle cartoon
depiction — non-scary, child-appropriate (FR-011).

## Open Items

- **Image provenance/license unverified (2026-08-16):** The seven pictures were manually
  replaced with a new cartoon set; their source site(s) and license are not yet recorded.
  Verify each image is CC0 / royalty-free / properly licensed for app use (and capture any
  required attribution) **before release**. Reselect any that cannot be license-cleared.
- **Oversized images (SC-006):** several files are well above the ~27–33 KB asset budget —
  `goat.webp` (390 KB, 980×980), `cow.webp` (359 KB, 980×980), `duck.webp` (202 KB,
  980×980), `sheep.webp` (193 KB, 1280×1280, WebP-encoded) and `wolf.webp` (172 KB,
  945×1280, WebP-encoded). Consider re-compressing/resizing toward the roster budget if
  load/navigation perf regresses.
- **Backgrounds not transparent — re-source `duck` and `chicken` (2026-08-16):** Neither
  file has an alpha channel. `duck.webp` has a solid white background; `chicken.png` has a
  painted gray checkerboard (fake-transparency) background **and visible "pngtree"
  watermarks** over the bird — i.e. it is a watermarked preview/comp, not a licensed final
  (reinforces the provenance/license item above). Decision: **re-source both** as
  properly-licensed, already-transparent PNGs matching the roster, rather than editing the
  current files (in-place background removal would punch holes through the animals' own
  white areas and cannot remove the chicken's watermarks). FR-002 asks for simple/
  transparent backgrounds consistent with the existing cow/dog art.

Exact accepted-answer lists may be tuned after quickstart validation (R3–R5 are
starting points, not frozen contracts).
