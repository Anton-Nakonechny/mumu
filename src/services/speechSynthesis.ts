/** Text-to-speech contract. `speak` resolves even when unavailable so callers fall back to text. */
export interface TtsService {
  isAvailable(): boolean;
  speak(text: string): Promise<void>;
  cancel(): void;
}

/** Web Speech API (`SpeechSynthesis`) implementation. Speaks locally (R1). */
export class WebSpeechTtsService implements TtsService {
  private get synth(): SpeechSynthesis | undefined {
    return typeof window !== 'undefined' ? window.speechSynthesis : undefined;
  }

  isAvailable(): boolean {
    return !!this.synth && typeof SpeechSynthesisUtterance !== 'undefined';
  }

  speak(text: string): Promise<void> {
    const synth = this.synth;
    if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
      // No speech engine: resolve immediately so the UI shows on-screen text (FR-012).
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.15; // friendly, slightly higher voice for children
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      // Reliable playback across engine quirks (research R9):
      const start = () => {
        if (synth.paused) synth.resume(); // Chrome can leave the engine paused
        synth.speak(utterance);
      };
      // Clear any in-flight utterance, then start on a later tick so cancel() and speak()
      // don't run in the same tick — Chrome otherwise silently drops the new utterance.
      synth.cancel();
      if (synth.getVoices().length > 0) {
        setTimeout(start, 0);
      } else {
        // Some browsers populate voices asynchronously; wait, with a timeout fallback.
        let started = false;
        const go = () => {
          if (started) return;
          started = true;
          start();
        };
        synth.addEventListener('voiceschanged', go, { once: true });
        setTimeout(go, 250);
      }
    });
  }

  cancel(): void {
    this.synth?.cancel();
  }
}
