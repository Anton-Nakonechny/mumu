import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { QuizMode } from '../../src/components/QuizMode';
import { CHEERS, AUTO_ADVANCE_DELAY_MS } from '../../src/domain/cheers';
import type { Animal } from '../../src/domain/animal';
import type { TtsService } from '../../src/services/speechSynthesis';
import type { RecognitionService, RecognitionResult } from '../../src/services/speechRecognition';
import { LANGUAGES, UI_STRINGS } from '../../src/domain/language';

const cow: Animal = {
  id: 'cow',
  name: 'cow',
  image: 'assets/animals/cow.avif',
  soundWord: 'muuuu',
  acceptedAnswers: ['moo', 'muuu'],
};

const enStrings = UI_STRINGS['en'];
const enConfig = LANGUAGES.find((l) => l.code === 'en')!;

function makeTts(available = true): TtsService {
  return { isAvailable: () => available, speak: vi.fn().mockResolvedValue(undefined), cancel: vi.fn() };
}

function makeRecognition(result: RecognitionResult): RecognitionService {
  return {
    isAvailable: () => true,
    requestPermission: vi.fn().mockResolvedValue('granted'),
    listenOnce: vi.fn().mockResolvedValue(result),
    stop: vi.fn(),
  };
}

const CORRECT: RecognitionResult = { transcript: 'moooo', noSpeech: false };
const MISS: RecognitionResult = { transcript: 'banana', noSpeech: false };

function isCheer(text: string): boolean {
  return Object.values(CHEERS).some((set) => (set as readonly string[]).includes(text));
}

/** Flush the mount → ask → listen → cheer microtask chain (no timers involved yet). */
async function settle(): Promise<void> {
  await act(async () => {
    for (let i = 0; i < 8; i++) await Promise.resolve();
  });
}

function renderQuiz(opts: { tts?: TtsService; recognition: RecognitionService; onNext?: () => void }) {
  const tts = opts.tts ?? makeTts();
  const onNext = opts.onNext ?? vi.fn();
  const utils = render(
    <QuizMode
      animal={cow}
      tts={tts}
      recognition={opts.recognition}
      lang="en"
      strings={enStrings}
      langConfig={enConfig}
      onNext={onNext}
      onPrev={vi.fn()}
    />,
  );
  return { tts, onNext, ...utils };
}

describe('QuizMode auto-advance after a correct answer (US2)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('auto-advances once after the cheer + delay (C3, FR-004)', async () => {
    const { onNext } = renderQuiz({ recognition: makeRecognition(CORRECT) });
    await settle();
    expect(onNext).not.toHaveBeenCalled();
    await act(async () => {
      vi.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS);
    });
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('does not advance until the cheer has finished (C2, FR-006 no overlap)', async () => {
    let resolveCheer: () => void = () => {};
    const cheerPromise = new Promise<void>((resolve) => {
      resolveCheer = resolve;
    });
    const tts = makeTts();
    (tts.speak as unknown as { mockImplementation: (fn: (t: string) => Promise<void>) => void }).mockImplementation(
      (text: string) => (isCheer(text) ? cheerPromise : Promise.resolve()),
    );
    const { onNext } = renderQuiz({ tts, recognition: makeRecognition(CORRECT) });
    await settle();
    // Cheer still "speaking" → timer not armed → advancing the clock does nothing.
    await act(async () => {
      vi.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS * 2);
    });
    expect(onNext).not.toHaveBeenCalled();
    // Finish the cheer, then the delay elapses.
    await act(async () => {
      resolveCheer();
      await Promise.resolve();
    });
    await act(async () => {
      vi.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS);
    });
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('manual Next during the pause advances once, cancelling the pending timer (C4, FR-005)', async () => {
    const { onNext, getByRole } = renderQuiz({ recognition: makeRecognition(CORRECT) });
    await settle();
    fireEvent.click(getByRole('button', { name: 'Next animal' }));
    expect(onNext).toHaveBeenCalledTimes(1);
    await act(async () => {
      vi.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS * 2);
    });
    expect(onNext).toHaveBeenCalledTimes(1); // no double-advance
  });

  it('cancels the pending advance on unmount / mode switch (C5, FR-007)', async () => {
    const { onNext, unmount } = renderQuiz({ recognition: makeRecognition(CORRECT) });
    await settle();
    unmount();
    await act(async () => {
      vi.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS * 2);
    });
    expect(onNext).not.toHaveBeenCalled();
  });

  it('cancels the pending advance when the tab becomes hidden (C5, FR-007)', async () => {
    const { onNext } = renderQuiz({ recognition: makeRecognition(CORRECT) });
    await settle();
    await act(async () => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await act(async () => {
      vi.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS * 2);
    });
    expect(onNext).not.toHaveBeenCalled();
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });

  it('still auto-advances when TTS is unavailable (C8 advance, FR-008)', async () => {
    const { onNext } = renderQuiz({ tts: makeTts(false), recognition: makeRecognition(CORRECT) });
    await settle();
    await act(async () => {
      vi.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS);
    });
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('never auto-advances after a miss or the reveal (C6/C7 advance, FR-003)', async () => {
    const { onNext } = renderQuiz({ recognition: makeRecognition(MISS) });
    await settle();
    await act(async () => {
      vi.advanceTimersByTime(AUTO_ADVANCE_DELAY_MS * 3);
    });
    expect(onNext).not.toHaveBeenCalled();
  });
});
