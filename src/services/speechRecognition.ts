/**
 * On-device speech recognition (research R2). Runs a WebAssembly recognizer
 * (vosk-browser) entirely client-side — no recorded audio or transcript ever leaves the
 * device (FR-007, SC-008). Recognition is constrained to the expected animal-sound words.
 *
 * Availability is conditional: the recognizer WASM/model must be present under
 * `public/assets/models/` AND microphone permission granted. When unavailable, Quiz mode
 * degrades gracefully (reveal/skip) and never blocks the child (FR-011, SC-006).
 */

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

const MODEL_URL = 'assets/models/vosk-model-small-en-us-0.15.tar.gz';

export class OnDeviceRecognitionService implements RecognitionService {
  private model: VoskModel | null = null;
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private permission: PermissionResult = 'unsupported';
  private stopped = false;

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

  /** Load the on-device model once. Fails soft: no model → recognition simply unavailable. */
  private async ensureModel(): Promise<void> {
    if (this.model) return;
    try {
      // Dynamic + optional: app builds/runs even when vosk-browser or the model is absent.
      const vosk = await import(/* @vite-ignore */ 'vosk-browser').catch(() => null);
      if (!vosk || typeof (vosk as { createModel?: unknown }).createModel !== 'function') return;
      this.model = (await (
        vosk as { createModel: (url: string) => Promise<VoskModel> }
      ).createModel(MODEL_URL)) as VoskModel;
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
        void ctx.close();
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
    void this.audioContext?.close();
    this.audioContext = null;
  }
}
