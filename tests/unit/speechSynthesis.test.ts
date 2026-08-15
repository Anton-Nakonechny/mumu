import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSpeechTtsService } from '../../src/services/speechSynthesis';

class FakeUtterance {
  text: string;
  lang = '';
  rate = 1;
  pitch = 1;
  voice: unknown = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(text: string) {
    this.text = text;
  }
}

describe('WebSpeechTtsService — cancel() clears deferred utterance (T030, FR-009, SC-006)', () => {
  let mockSynth: {
    cancel: ReturnType<typeof vi.fn>;
    speak: ReturnType<typeof vi.fn>;
    paused: boolean;
    getVoices: ReturnType<typeof vi.fn>;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    mockSynth = {
      cancel: vi.fn(),
      speak: vi.fn(),
      paused: false,
      getVoices: vi.fn().mockReturnValue([{ lang: 'en-US', name: 'Test Voice' }]),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    // @ts-expect-error jsdom lacks SpeechSynthesis; inject minimal mock
    window.speechSynthesis = mockSynth;
    // @ts-expect-error jsdom lacks SpeechSynthesisUtterance; inject minimal mock
    window.SpeechSynthesisUtterance = FakeUtterance;
  });

  afterEach(() => {
    vi.useRealTimers();
    // @ts-expect-error cleanup
    delete window.speechSynthesis;
  });

  it('cancel() before timer fires prevents synth.speak() from being called', async () => {
    const tts = new WebSpeechTtsService();
    const p = tts.speak('hello');
    tts.cancel();
    vi.runAllTimers();
    await expect(p).resolves.toBeUndefined();
    expect(mockSynth.speak).not.toHaveBeenCalled();
  });

  it('StrictMode remount: speak → cancel → speak results in exactly one synth.speak call', async () => {
    const tts = new WebSpeechTtsService();
    const p1 = tts.speak('hello'); // effect setup 1 (StrictMode first mount)
    tts.cancel();                   // effect cleanup 1
    const p2 = tts.speak('hello'); // effect setup 2 (StrictMode second mount)
    vi.runAllTimers();              // fire deferred timer(s)

    await p1; // p1 was cancelled — must resolve
    expect(mockSynth.speak).toHaveBeenCalledTimes(1);

    // Resolve p2 via its utterance's onend so the test doesn't leak
    const utterance = mockSynth.speak.mock.calls[0]![0] as FakeUtterance;
    utterance.onend?.();
    await p2;
  });

  it('normal speak — timer fires — synth.speak called once, promise resolves on onend', async () => {
    const tts = new WebSpeechTtsService();
    const p = tts.speak('hello');
    vi.runAllTimers();
    expect(mockSynth.speak).toHaveBeenCalledTimes(1);
    const utterance = mockSynth.speak.mock.calls[0]![0] as FakeUtterance;
    utterance.onend?.();
    await expect(p).resolves.toBeUndefined();
  });
});
