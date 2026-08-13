# Contract: Per-Language On-Device Recognition (`src/services/speechRecognition.ts`)

## Interface (unchanged)

```ts
export interface RecognitionService {
  isAvailable(): boolean;
  requestPermission(): Promise<PermissionResult>;   // 'granted' | 'denied' | 'unsupported'
  listenOnce(options: ListenOptions): Promise<RecognitionResult>; // { transcript, noSpeech }
  stop(): void;
}
```

## Factory contract

```ts
export function makeRecognitionService(lang: Language): RecognitionService
```

| Given | Returns | Requirement |
|-------|---------|-------------|
| `lang = 'en'` | on-device service loading the **English** model | FR-011 on-device |
| `lang = 'uk'` | on-device service loading the **Ukrainian** model | FR-007 language-capable recognizer |
| `lang = 'es'` | on-device service loading the **Spanish** model | FR-007 |
| any `lang` | a service that **never** loads a different language's model | FR-007, FR-012 no silent English fallback |

- The factory MUST NOT return a cloud/Web-Speech recognizer and MUST NOT route audio off-device (FR-011).
- A model registry `MODEL_URLS: Record<Language, string>` maps each language to its same-origin bundled `.tar.gz`.

## Model-loading contract

| Behavior | Requirement |
|----------|-------------|
| Model for language L is loaded only when a service for L is used (permission requested) | FR-013 lazy |
| A parsed model is cached (module-level, keyed by language) and reused within the session with no re-download | FR-013 cache |
| Model tarballs are same-origin static assets under `public/assets/models/`, so the service worker persists them; recognition works offline after first load | FR-014 persistence |
| If the model is missing / fails to load / is still loading, the service does **not** substitute another language's model | FR-007, FR-012 |

## Availability & degradation contract

| State | `isAvailable()` | `requestPermission()` | `QuizMode` effect |
|-------|-----------------|-----------------------|-------------------|
| permission granted + model loaded | `true` | `'granted'` | listens on-device |
| permission granted + model missing/failed | `false` | `'unsupported'` | localized `micUnavailable` + reveal/advance (FR-008/FR-012) |
| permission denied | `false` | `'denied'` | localized `micUnavailable` + reveal/advance |
| no `getUserMedia` | `false` | `'unsupported'` | localized `micUnavailable` + reveal/advance |

- When unavailable, no false "wrong answer" is ever shown (SC-005): `QuizMode` sets `unavailable` and renders the notice instead of a result.

## Recognition-result contract

- `listenOnce({ expectedWords })` constrains the recognizer grammar to the animal's accepted words plus `[unk]` (existing behavior, now with native-script words for uk/es).
- Resolves `{ transcript, noSpeech }`; `noSpeech: true` on timeout/stop/empty. Audio buffers are processed only in-WASM and discarded.

## Language-switch contract

- `App` re-creates the service via `useMemo(..., [language])` (existing) so switching language selects the new language's model on the next interaction without reload (FR-010).

## Migration note

- `WebSpeechRecognitionService` is removed from the runtime factory path. Its unit tests are replaced by per-language on-device selection and no-fallback tests. If the class is kept for reference it MUST NOT be reachable from `makeRecognitionService`.
