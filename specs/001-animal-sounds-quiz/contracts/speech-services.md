# Internal Service Contracts

The two browser capabilities and content loading are wrapped behind these interfaces so game
logic and components are unit-tested with mocks, and the real browser implementations are
swapped in at runtime. Signatures are TypeScript-style contracts (implementation lives in
`src/services/`).

## TtsService — text-to-speech (R1)

Speaks short phrases aloud using the native `SpeechSynthesis` API.

```ts
interface TtsService {
  /** True if the environment can speak. When false, callers show on-screen text (FR-012). */
  isAvailable(): boolean;

  /** Speak the phrase. Resolves when speech ends; rejects/resolves-fast if unavailable.
   *  Implementations MUST cancel any in-flight utterance before speaking (R5). */
  speak(text: string): Promise<void>;

  /** Immediately stop any current/queued speech (used on navigation, R5). */
  cancel(): void;
}
```

**Contract notes**: `speak` never throws for "no voice"; it resolves so the UI can fall back
to text. Exactly one animal is spoken at a time (rapid-swipe edge case).

## RecognitionService — on-device speech recognition (R2)

Listens to the microphone and returns a text hypothesis produced **entirely on-device**
(WASM recognizer in a Web Worker). No audio or transcript leaves the device (FR-007, SC-008).

```ts
interface RecognitionService {
  /** Permission/support state. */
  isAvailable(): boolean;                 // engine loaded AND mic permitted
  requestPermission(): Promise<PermissionResult>; // 'granted' | 'denied' | 'unsupported'

  /** Listen for one answer, optionally biased toward expectedWords (the animal's accepted
   *  answers) to improve small-vocabulary accuracy. Resolves with a transcript hypothesis,
   *  or a no-speech result after the timeout window (counts as a miss, R2). */
  listenOnce(options: {
    expectedWords?: string[];
    timeoutMs?: number;                   // default ~4000
  }): Promise<RecognitionResult>;

  /** Stop an in-progress listen (used on navigation/mode change, R5). */
  stop(): void;
}

type PermissionResult = 'granted' | 'denied' | 'unsupported';

interface RecognitionResult {
  transcript: string;   // '' when nothing recognized
  noSpeech: boolean;    // true if the window elapsed with no recognizable speech
}
```

**Contract notes**: When `isAvailable()` is false or permission is `denied`/`unsupported`,
Quiz mode must still allow the child to continue (reveal/skip), never blocking (FR-011,
SC-006). The service guarantees no network transmission of captured audio/transcript.

## AnswerMatcher — pure logic (R3), not a browser service

```ts
/** Returns true if `transcript` is a lenient match for any accepted answer.
 *  Normalizes case/punctuation/repeated vowels; accepts on token substring match OR
 *  normalized edit distance within threshold (FR-013, tuned for SC-004 ≥90% / SC-005 <5%). */
function isAnswerCorrect(transcript: string, acceptedAnswers: string[]): boolean;
```

## AnimalsRepository — content loading (R6)

```ts
interface AnimalsRepository {
  /** Fetch + validate animals.json against the metadata schema; drop invalid entries;
   *  lowercase acceptedAnswers. Returns a possibly-empty list (empty → empty-state UI). */
  loadAnimals(): Promise<Animal[]>;
}
```

## Consumers

- `LearnMode` → `TtsService.speak(learnPhrase)` on each animal change; `cancel()` before next.
- `QuizMode` → `TtsService.speak(quizPrompt)` → `RecognitionService.listenOnce(...)` →
  `isAnswerCorrect(...)` → `QuizSession.registerResult(...)`; on `revealed`, speak `soundWord`.
- `App` → `AnimalsRepository.loadAnimals()` → builds `AnimalCollection`.
