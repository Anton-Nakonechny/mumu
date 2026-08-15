/** Text-to-speech contract. `speak` resolves even when unavailable so callers fall back to text. */
export interface TtsService {
  isAvailable(): boolean;
  speak(text: string, lang?: string): Promise<void>;
  cancel(): void;
}

/** Web Speech API (`SpeechSynthesis`) implementation. Speaks locally (R1). */
export class WebSpeechTtsService implements TtsService {
  // Pending deferred-start timer (path 1: voices already loaded, setTimeout(start, 0)).
  private pendingTimer: ReturnType<typeof setTimeout> | undefined;
  // Pending 250 ms fallback timer (path 2: voices not yet loaded).
  private pendingFallbackTimer: ReturnType<typeof setTimeout> | undefined;
  // Pending voiceschanged listener (path 2).
  private pendingVoicesListener: (() => void) | undefined;
  // Resolve callback for the in-flight speak() promise — called by cancel() to un-block callers.
  private pendingResolve: (() => void) | undefined;

  private get synth(): SpeechSynthesis | undefined {
    return typeof window !== 'undefined' ? window.speechSynthesis : undefined;
  }

  isAvailable(): boolean {
    return !!this.synth && typeof SpeechSynthesisUtterance !== 'undefined';
  }

  // Cancel any deferred-but-not-yet-started utterance and resolve its promise so callers
  // don't hang. Safe to call when nothing is pending.
  private clearPending(synth: SpeechSynthesis | undefined): void {
    if (this.pendingTimer !== undefined) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = undefined;
    }
    if (this.pendingFallbackTimer !== undefined) {
      clearTimeout(this.pendingFallbackTimer);
      this.pendingFallbackTimer = undefined;
    }
    if (this.pendingVoicesListener !== undefined && synth) {
      synth.removeEventListener('voiceschanged', this.pendingVoicesListener);
      this.pendingVoicesListener = undefined;
    }
    if (this.pendingResolve !== undefined) {
      const resolve = this.pendingResolve;
      this.pendingResolve = undefined;
      resolve();
    }
  }

  speak(text: string, lang?: string): Promise<void> {
    const synth = this.synth;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
      // No speech engine: resolve immediately so the UI shows on-screen text (FR-012).
      return Promise.resolve();
    }

    // Cancel any previously pending (deferred but not yet started) utterance and resolve
    // its promise — prevents double-speak under React StrictMode's double-invoke of effects.
    this.clearPending(synth);

    return new Promise<void>((resolve) => {
      this.pendingResolve = resolve;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.15; // friendly, slightly higher voice for children
      utterance.onend = () => {
        this.pendingResolve = undefined;
        resolve();
      };
      utterance.onerror = () => {
        this.pendingResolve = undefined;
        resolve();
      };

      if (lang) {
        utterance.lang = lang;
      }

      // Reliable playback across engine quirks (research R9):
      const start = () => {
        // Clear pending references — the timer has now fired naturally.
        this.pendingTimer = undefined;
        this.pendingFallbackTimer = undefined;
        this.pendingVoicesListener = undefined;
        if (synth.paused) synth.resume(); // Chrome can leave the engine paused
        if (lang) {
          const voices = synth.getVoices();
          const match = voices.find((v) => v.lang.startsWith(lang.split('-')[0]));
          if (match) utterance.voice = match;
        }
        synth.speak(utterance);
      };
      // Clear any in-flight utterance, then start on a later tick so cancel() and speak()
      // don't run in the same tick — Chrome otherwise silently drops the new utterance.
      synth.cancel();
      if (synth.getVoices().length > 0) {
        this.pendingTimer = setTimeout(start, 0);
      } else {
        // Some browsers populate voices asynchronously; wait, with a timeout fallback.
        let started = false;
        const go = () => {
          if (started) return;
          started = true;
          start();
        };
        this.pendingVoicesListener = go;
        synth.addEventListener('voiceschanged', go, { once: true });
        this.pendingFallbackTimer = setTimeout(go, 250);
      }
    });
  }

  cancel(): void {
    const synth = this.synth;
    // Clear deferred timers/listeners and resolve any pending speak() promise so that
    // the effect cleanup in QuizMode (including React StrictMode's teardown) doesn't
    // leave a queued utterance that fires after the component re-mounts.
    this.clearPending(synth);
    synth?.cancel();
  }
}
