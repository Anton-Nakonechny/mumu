# Contract: Answer Matcher (`src/domain/answerMatcher.ts`)

The public surface is unchanged; only the internal normalization becomes script-aware. This contract pins the observable behavior so tests can be written first.

## Signature (unchanged)

```ts
export function isAnswerCorrect(transcript: string, acceptedAnswers: string[]): boolean
```

- `transcript`: recognized text in the selected language's native script (may contain punctuation, extra words, repeated letters, mixed case).
- `acceptedAnswers`: the **selected language's** accepted answers only (caller guarantees single-language isolation).
- Returns `true` iff the transcript leniently matches any accepted answer.

## Behavioral contract

| # | Given (lang, acceptedAnswers) | transcript | Result | Requirement |
|---|-------------------------------|-----------|--------|-------------|
| C1 | uk `["му","муу"]` | `"муу"` | `true` | FR-004 Cyrillic survives normalization |
| C2 | uk `["му","муу"]` | `"МУУУУУ"` | `true` | FR-005 repeated letters + case in Cyrillic |
| C3 | uk `["гав","гав гав"]` | `"корова каже гав"` | `true` | FR-005 answer embedded in extra words |
| C4 | es `["mu","muu"]` | `"muu"` | `true` | FR-004 Spanish Latin answer |
| C5 | es `["mu","muu"]` | `"muuuuuu"` | `true` | FR-005 stretched sound |
| C6 | en `["moo","mu","mooo"]` | `"MOO!!!"` | `true` | FR-009 no English regression |
| C7 | en `["moo","mu"]` | `"the cow says moo"` | `true` | FR-009 existing leniency preserved |
| C8 | uk `["му","муу"]` | `"банан"` | `false` | FR-006 unrelated Cyrillic word rejected |
| C9 | es `["mu","muu"]` | `"hola"` | `false` | FR-006 unrelated Spanish word rejected |
| C10 | uk `["му","муу"]` | `"woof"` | `false` | FR-006 no cross-language accept |
| C11 | any | `""` / `"   "` | `false` | no-speech → not correct |

## Normalization contract (internal, asserted via the cases above)

- Lowercase, then **strip only non-letters** using the Unicode letter class (`\p{L}`), keeping Cyrillic and Latin letters; drop digits, punctuation, symbols.
- Collapse runs of the same letter to one (`мууу`→`му`, `mooo`→`mo`).
- Collapse whitespace; trim.
- Leniency after normalization is unchanged: exact match, substring match, and Levenshtein fuzz with threshold `max(1, floor(target.length · 0.3))`, applied to the whole string and each word.

## Non-goals

- The matcher does **not** take a language argument and does **not** perform cross-language comparison. Language isolation is the caller's responsibility (already provided by `resolveAnimal`).
