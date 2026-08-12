import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuizMode } from '../../src/components/QuizMode';
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

function makeTts(): TtsService {
  return { isAvailable: () => true, speak: vi.fn().mockResolvedValue(undefined), cancel: vi.fn() };
}

function makeRecognition(opts: {
  permission?: 'granted' | 'denied' | 'unsupported';
  available?: boolean;
  result?: RecognitionResult;
}): RecognitionService {
  const {
    permission = 'granted',
    available = true,
    result = { transcript: '', noSpeech: true },
  } = opts;
  return {
    isAvailable: () => available,
    requestPermission: vi.fn().mockResolvedValue(permission),
    listenOnce: vi.fn().mockResolvedValue(result),
    stop: vi.fn(),
  };
}

describe('QuizMode (User Story 2)', () => {
  it('asks the question for the current animal', async () => {
    const tts = makeTts();
    const recognition = makeRecognition({ result: { transcript: 'moo', noSpeech: false } });
    render(
      <QuizMode animal={cow} tts={tts} recognition={recognition} onNext={vi.fn()} onPrev={vi.fn()} />,
    );
    expect(screen.getByTestId('quiz-prompt')).toHaveTextContent('What does the cow say?');
    await waitFor(() => expect(tts.speak).toHaveBeenCalledWith('What does the cow say?'));
  });

  it('celebrates a correct spoken answer', async () => {
    const tts = makeTts();
    const recognition = makeRecognition({ result: { transcript: 'moooo', noSpeech: false } });
    render(
      <QuizMode animal={cow} tts={tts} recognition={recognition} onNext={vi.fn()} onPrev={vi.fn()} />,
    );
    await waitFor(() => expect(screen.getByTestId('feedback')).toHaveTextContent(/right/i));
  });

  it('reveals and speaks the sound after two misses (FR-008a)', async () => {
    const tts = makeTts();
    const recognition = makeRecognition({ result: { transcript: 'banana', noSpeech: false } });
    render(
      <QuizMode animal={cow} tts={tts} recognition={recognition} onNext={vi.fn()} onPrev={vi.fn()} />,
    );
    // First miss happens automatically on mount.
    await waitFor(() => expect(screen.getByTestId('feedback')).toHaveTextContent(/try/i));
    // Second attempt via the Listen button → reveal.
    fireEvent.click(screen.getByTestId('listen-button'));
    await waitFor(() => expect(screen.getByTestId('feedback')).toHaveTextContent(/muuuu/));
    expect(tts.speak).toHaveBeenCalledWith('muuuu');
  });

  it('never blocks when the microphone is denied (FR-011, SC-006)', async () => {
    const tts = makeTts();
    const onNext = vi.fn();
    const recognition = makeRecognition({ permission: 'denied', available: false });
    render(
      <QuizMode animal={cow} tts={tts} recognition={recognition} onNext={onNext} onPrev={vi.fn()} />,
    );
    await waitFor(() =>
      expect(screen.getByTestId('feedback')).toHaveTextContent(/isn’t available|not available|available/i),
    );
    expect(recognition.listenOnce).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Next animal' }));
    expect(onNext).toHaveBeenCalled();
  });
});
