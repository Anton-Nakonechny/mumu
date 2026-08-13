# Contract: Localized Feedback Strings (`src/domain/language.ts` + `src/components/Feedback.tsx`)

## String-table contract

`UiStrings` gains four fields, defined for **every** language in `UI_STRINGS`:

```ts
type UiStrings = {
  // …existing fields (learn, quiz, listen, …, micUnavailable) unchanged…
  quizListening: string;   // interim "listening…" line
  quizCorrect: string;     // correct-answer celebration line
  quizTryAgain: string;    // "say it again" nudge
  quizRevealed: string;    // reveal template; MUST contain exactly one "{sound}" token
};
```

Rules:
- `Record<Language, UiStrings>` — a missing key for any language is a compile error.
- `quizRevealed` contains one `{sound}` placeholder and no fixed English scaffolding (FR-002).
- English values equal the strings currently hard-coded in `Feedback.tsx` (FR-009).
- `micUnavailable` is unchanged (FR-003).

Reference values (authored, may be refined for tone):

| key | en | uk | es |
|-----|----|----|----|
| `quizListening` | `👂 Listening…` | `👂 Слухаю…` | `👂 Escuchando…` |
| `quizCorrect` | `🎉 Yay! That's right!` | `🎉 Ура! Правильно!` | `🎉 ¡Sí! ¡Correcto!` |
| `quizTryAgain` | `🙂 Good try — say it again!` | `🙂 Майже! Спробуй ще раз!` | `🙂 ¡Casi! ¡Otra vez!` |
| `quizRevealed` | `It says "{sound}". Great trying! Tap ▶ for the next animal.` | `Каже «{sound}». Молодець! Натисни ▶ для наступної.` | `Hace «{sound}». ¡Bien hecho! Pulsa ▶ para el siguiente.` |

## Component contract (`Feedback.tsx`)

Props unchanged in shape (`phase`, `soundWord`, `listeningUnavailable`, `strings`).

| Condition | Rendered text |
|-----------|---------------|
| `listeningUnavailable` | `🎤 {strings.micUnavailable}` (unchanged) |
| `phase === 'correct'` | `{strings.quizCorrect}` |
| `phase === 'tryAgain'` | `{strings.quizTryAgain}` |
| `phase === 'revealed'` | `strings.quizRevealed` with `{sound}` replaced by `soundWord` |
| default (`listening`) | `{strings.quizListening}` |

Behavioral requirements:
- For every non-English language, **no English string** appears in any state (SC-001).
- The revealed line embeds the localized `soundWord` inside the localized sentence (FR-002); acceptance US1-2.
- Emoji/`▶` glyphs are language-neutral and may remain.

## Test hooks

- `data-testid="feedback"` is preserved so existing component tests keep selecting the line.
- New component test drives each phase per language and asserts the localized substring is present and known English fragments (e.g. `"It says"`, `"Yay"`) are absent for uk/es.
