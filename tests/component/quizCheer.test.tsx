import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuizMode } from '../../src/components/QuizMode';
import { CHEERS } from '../../src/domain/cheers';
import type { Animal } from '../../src/domain/animal';
import type { TtsService } from '../../src/services/speechSynthesis';
import type { RecognitionService, RecognitionResult } from '../../src/services/speechRecognition';

const cow: Animal = {
  id: 'cow',
  name: 'cow',
  image: 'assets/animals/cow.avif',
  soundWord: 'muuuu',
  acceptedAnswers: ['moo', 'muuu'],
};

function makeTts(available = true): TtsService {
  return { isAvailable: () => available, speak: vi.fn().mockResolvedValue(undefined), cancel: vi.fn() };
}

function makeRecognition(
  result: RecognitionResult,
  opts: { permission?: 'granted' | 'denied' | 'unsupported'; available?: boolean } = {},
): RecognitionService {
  const { permission = 'granted', available = true } = opts;
  return {
    isAvailable: () => available,
    requestPermission: vi.fn().mockResolvedValue(permission),
    listenOnce: vi.fn().mockResolvedValue(result),
    stop: vi.fn(),
  };
}

/** True if any tts.speak call used a phrase from the celebratory CHEERS set (FR-002 criterion). */
function spokeACheer(tts: TtsService): boolean {
  const calls = (tts.speak as unknown as { mock: { calls: unknown[][] } }).mock.calls;
  return calls.some(([arg]) => typeof arg === 'string' && CHEERS.includes(arg));
}

describe('QuizMode cheer on correct answer (US1)', () => {
  it('speaks a celebratory cheer (a member of CHEERS) after a correct answer (C1, FR-001/FR-002)', async () => {
    const tts = makeTts();
    const recognition = makeRecognition({ transcript: 'moooo', noSpeech: false });
    render(
      <QuizMode animal={cow} tts={tts} recognition={recognition} onNext={vi.fn()} onPrev={vi.fn()} />,
    );
    await waitFor(() => expect(spokeACheer(tts)).toBe(true));
  });

  it('does not cheer on a single miss — shows try-again instead (C6, FR-003)', async () => {
    const tts = makeTts();
    const recognition = makeRecognition({ transcript: 'banana', noSpeech: false });
    render(
      <QuizMode animal={cow} tts={tts} recognition={recognition} onNext={vi.fn()} onPrev={vi.fn()} />,
    );
    await waitFor(() => expect(screen.getByTestId('feedback')).toHaveTextContent(/try/i));
    expect(spokeACheer(tts)).toBe(false);
  });

  it('does not cheer on the 2-miss reveal — only speaks the sound word (C7)', async () => {
    const tts = makeTts();
    const recognition = makeRecognition({ transcript: 'banana', noSpeech: false });
    render(
      <QuizMode animal={cow} tts={tts} recognition={recognition} onNext={vi.fn()} onPrev={vi.fn()} />,
    );
    // First miss auto-fires on mount; second via the Listen button → reveal.
    await waitFor(() => expect(screen.getByTestId('feedback')).toHaveTextContent(/try/i));
    fireEvent.click(screen.getByTestId('listen-button'));
    await waitFor(() => expect(screen.getByTestId('feedback')).toHaveTextContent(/muuuu/));
    expect(tts.speak).toHaveBeenCalledWith('muuuu');
    expect(spokeACheer(tts)).toBe(false);
  });

  it('shows a celebratory visual cheer on a correct answer when TTS is unavailable (C8 visual, FR-008)', async () => {
    const tts = makeTts(false);
    const recognition = makeRecognition({ transcript: 'moooo', noSpeech: false });
    render(
      <QuizMode animal={cow} tts={tts} recognition={recognition} onNext={vi.fn()} onPrev={vi.fn()} />,
    );
    await waitFor(() => expect(screen.getByTestId('feedback')).toHaveTextContent(/right|yay/i));
  });
});
