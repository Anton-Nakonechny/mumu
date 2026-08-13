# Contract: RecognitionService (updated + new implementation)

**File**: `src/services/speechRecognition.ts`

## Interface — unchanged

```ts
export interface RecognitionService {
  isAvailable(): boolean;
  requestPermission(): Promise<PermissionResult>;
  listenOnce(options: ListenOptions): Promise<RecognitionResult>;
  stop(): void;
}
```

The `RecognitionService` interface itself is not modified. This preserves all existing tests.

## OnDeviceRecognitionService — unchanged

Used for English (`'en'`). Uses Vosk WASM model (English only). No modifications.

## WebSpeechRecognitionService — new

Used for Ukrainian (`'uk'`) and Spanish (`'es'`). Wraps `window.SpeechRecognition` / `window.webkitSpeechRecognition`.

```ts
export class WebSpeechRecognitionService implements RecognitionService {
  constructor(private readonly lang: string) {}  // BCP-47 e.g. 'uk-UA'

  isAvailable(): boolean;        // true iff SpeechRecognition exists in window
  requestPermission(): Promise<PermissionResult>;  // requests mic; 'unsupported' if API absent
  listenOnce(options: ListenOptions): Promise<RecognitionResult>;
  stop(): void;
}
```

### listenOnce implementation notes

- Set `recognition.lang = this.lang` before starting.
- Set `recognition.interimResults = false`, `recognition.maxAlternatives = 1`.
- Resolve on `result` event with the best transcript.
- Resolve with `noSpeech: true` on `nomatch`, `error`, or timeout (`options.timeoutMs ?? 4000`).
- `stop()` calls `recognition.abort()` and resolves any pending promise with empty transcript.

### Availability

`SpeechRecognition` is cloud-based in Chrome/Edge/Safari. It requires network access after the first load and microphone permission. When the browser does not support the API, `isAvailable()` returns `false` and quiz mode degrades to reveal-after-two-misses (FR-008).

## Service selection in App.tsx

```ts
function makeRecognitionService(lang: Language): RecognitionService {
  if (lang === 'en') return new OnDeviceRecognitionService();
  const SpeechRecognitionCtor =
    window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
  if (!SpeechRecognitionCtor) return new OnDeviceRecognitionService(); // fallback (always unavailable for non-EN)
  const config = LANGUAGES.find(l => l.code === lang)!;
  return new WebSpeechRecognitionService(config.speechLang);
}
```

`App` re-creates the recognition service whenever `language` changes (via `useMemo` keyed on `language`). The previous service's `stop()` is called in the `QuizMode` cleanup effect, unchanged.
