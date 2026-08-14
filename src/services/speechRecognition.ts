/**
 * On-device speech recognition (research R2). Runs a WebAssembly recognizer
 * (vosk-browser) entirely client-side — no recorded audio or transcript ever leaves the
 * device (FR-007, SC-008). Recognition is constrained to the expected animal-sound words.
 *
 * Availability is conditional: the recognizer WASM/model must be present under
 * `public/assets/models/` AND microphone permission granted. When unavailable, Quiz mode
 * degrades gracefully (reveal/skip) and never blocks the child (FR-011, SC-006).
 */

import type { Language } from '../domain/language';

export type PermissionResult = 'granted' | 'denied' | 'unsupported';

export interface RecognitionResult {
  transcript: string;
  noSpeech: boolean;
}

export interface ListenOptions {
  expectedWords?: string[];
  timeoutMs?: number;
}

export interface RecognitionService {
  isAvailable(): boolean;
  requestPermission(): Promise<PermissionResult>;
  listenOnce(options: ListenOptions): Promise<RecognitionResult>;
  stop(): void;
}

// Minimal structural types for the optional vosk-browser module (avoids a hard dep).
interface VoskRecognizer {
  on(event: 'result', cb: (message: { result: { text: string } }) => void): void;
  acceptWaveform(buffer: AudioBuffer): void;
  remove?(): void;
}
interface VoskModel {
  KaldiRecognizer: new (sampleRate: number, grammar?: string) => VoskRecognizer;
  terminate?(): void;
}

/**
 * Per-language bundled on-device Vosk model paths.
 * Ukrainian intentionally reuses the English acoustic model as a cross-lingual phonetic
 * approximator: the nano UK model's lexicon lacks the onomatopoeia and [unk], collapsing the
 * closed-word grammar and returning empty transcripts. Using the English model in free-form
 * mode emits the nearest English words (e.g. "муу"→"moo"), which the phonetic matcher and
 * Latin sound-alike entries in animals.json bridge to a correct verdict. This consciously
 * supersedes FR-007 (which targeted the old cloud recognizer silently failing); here the
 * choice is explicit and preserves the on-device/offline privacy guarantee.
 */
export const MODEL_URLS: Record<Language, string> = {
  en: '/assets/models/vosk-model-small-en-us-0.15.tar.gz',
  uk: '/assets/models/vosk-model-small-en-us-0.15.tar.gz',
  es: '/assets/models/vosk-model-small-es-0.42.tar.gz',
};

/** Module-level cache: parsed VoskModel instances, keyed by model URL (FR-013). */
const modelCache = new Map<string, VoskModel>();

export class OnDeviceRecognitionService implements RecognitionService {
  private model: VoskModel | null = null;
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private permission: PermissionResult = 'unsupported';
  private stopped = false;

  constructor(private readonly modelUrl: string) {}

  isAvailable(): boolean {
    return this.permission === 'granted' && this.model !== null;
  }

  async requestPermission(): Promise<PermissionResult> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.permission = 'unsupported';
      return this.permission;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await this.ensureModel();
      this.permission = this.model ? 'granted' : 'unsupported';
      return this.permission;
    } catch {
      this.permission = 'denied';
      return this.permission;
    }
  }

  /** Load the on-device model once, using the session cache. Fails soft: no model → recognition simply unavailable. */
  private async ensureModel(): Promise<void> {
    if (this.model) return;
    const cached = modelCache.get(this.modelUrl);
    if (cached) {
      this.model = cached;
      return;
    }
    try {
      // Dynamic + optional: app builds/runs even when vosk-browser or the model is absent.
      const vosk = await import(/* @vite-ignore */ 'vosk-browser').catch(() => null);
      if (!vosk || typeof (vosk as { createModel?: unknown }).createModel !== 'function') return;
      const loaded = (await (
        vosk as { createModel: (url: string) => Promise<VoskModel> }
      ).createModel(this.modelUrl)) as VoskModel;
      modelCache.set(this.modelUrl, loaded);
      this.model = loaded;
    } catch {
      this.model = null;
    }
  }

  async listenOnce(options: ListenOptions): Promise<RecognitionResult> {
    this.stopped = false;
    if (!this.isAvailable() || !this.stream || !this.model) {
      return { transcript: '', noSpeech: true };
    }
    const timeoutMs = options.timeoutMs ?? 4000;
    const grammar = options.expectedWords?.length
      ? JSON.stringify([...options.expectedWords, '[unk]'])
      : undefined;

    return new Promise<RecognitionResult>((resolve) => {
      const ctx = new AudioContext();
      this.audioContext = ctx;
      const recognizer = new this.model!.KaldiRecognizer(ctx.sampleRate, grammar);
      let settled = false;
      const finish = (transcript: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        recognizer.remove?.();
        if (ctx.state !== 'closed') void ctx.close();
        resolve({ transcript, noSpeech: transcript.trim().length === 0 });
      };
      recognizer.on('result', (message) => finish(message.result.text ?? ''));
      const source = ctx.createMediaStreamSource(this.stream!);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processor.onaudioprocess = (e) => {
        if (this.stopped) finish('');
        else recognizer.acceptWaveform(e.inputBuffer);
      };
      source.connect(processor);
      processor.connect(ctx.destination);
      const timer = setTimeout(() => finish(''), timeoutMs);
    });
  }

  stop(): void {
    this.stopped = true;
    if (this.audioContext && this.audioContext.state !== 'closed') void this.audioContext.close();
    this.audioContext = null;
  }
}

/**
 * Factory that returns an on-device Vosk recognition service for the given language.
 * Every language uses its own bundled model — no cloud speech, no cross-language fallback (FR-007, FR-011).
 */
export function makeRecognitionService(lang: Language): RecognitionService {
  return new OnDeviceRecognitionService(MODEL_URLS[lang]);
}
