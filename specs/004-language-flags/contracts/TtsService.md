# Contract: TtsService (updated)

**File**: `src/services/speechSynthesis.ts`

## Interface change

```ts
export interface TtsService {
  isAvailable(): boolean;
  speak(text: string, lang?: string): Promise<void>;  // lang is BCP-47 tag
  cancel(): void;
}
```

The `lang` parameter is optional. When provided, `WebSpeechTtsService` sets `utterance.lang = lang` and attempts to select a matching installed voice. When absent, behavior is unchanged (browser default voice).

## WebSpeechTtsService voice-selection logic

1. Call `synth.getVoices()`.
2. Find first voice where `voice.lang.startsWith(lang.split('-')[0])` — e.g., `'uk'` matches `'uk-UA'`.
3. If found, set `utterance.voice = voice`.
4. If not found, leave `utterance.voice` unset (browser default) — not a failure.

## Invariants

- `speak()` always resolves (never rejects), matching the existing contract.
- `cancel()` is unchanged.
- Setting an unsupported `lang` produces no error — the browser speaks in its default voice.

## Callers to update

| Caller | Current call | Updated call |
|--------|-------------|--------------|
| `LearnMode.tsx` | `tts.speak(phrase)` | `tts.speak(phrase, langConfig.ttsLang)` |
| `QuizMode.tsx` (prompt) | `tts.speak(prompt)` | `tts.speak(prompt, langConfig.ttsLang)` |
| `QuizMode.tsx` (cheer) | `tts.speak(cheer)` | `tts.speak(cheer, langConfig.ttsLang)` |
| `QuizMode.tsx` (reveal) | `tts.speak(animal.soundWord)` | `tts.speak(animal.soundWord, langConfig.ttsLang)` |
