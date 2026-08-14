import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuizMode } from '../../src/components/QuizMode';
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
      <QuizMode animal={cow} tts={tts} recognition={recognition} lang="en" strings={enStrings} langConfig={enConfig} onNext={vi.fn()} onPrev={vi.fn()} />,
    );
    expect(screen.getByTestId('quiz-prompt')).toHaveTextContent('What does the cow say?');
    await waitFor(() => expect(tts.speak).toHaveBeenCalledWith('What does the cow say?', enConfig.ttsLang));
  });

  it('celebrates a correct spoken answer', async () => {
    const tts = makeTts();
    const recognition = makeRecognition({ result: { transcript: 'moooo', noSpeech: false } });
    render(
      <QuizMode animal={cow} tts={tts} recognition={recognition} lang="en" strings={enStrings} langConfig={enConfig} onNext={vi.fn()} onPrev={vi.fn()} />,
    );
    await waitFor(() => expect(screen.getByTestId('feedback')).toHaveTextContent(/right/i));
  });

  it('reveals and speaks the sound after two misses (FR-008a)', async () => {
    const tts = makeTts();
    const recognition = makeRecognition({ result: { transcript: 'banana', noSpeech: false } });
    render(
      <QuizMode animal={cow} tts={tts} recognition={recognition} lang="en" strings={enStrings} langConfig={enConfig} onNext={vi.fn()} onPrev={vi.fn()} />,
    );
    await waitFor(() => expect(screen.getByTestId('feedback')).toHaveTextContent(/try/i));
    fireEvent.click(screen.getByTestId('listen-button'));
    await waitFor(() => expect(screen.getByTestId('feedback')).toHaveTextContent(/muuuu/));
    expect(tts.speak).toHaveBeenCalledWith('muuuu', enConfig.ttsLang);
  });

  it('shows the unavailable (reveal/skip) state while the recognizer is still loading (FR-012, FR-013)', () => {
    const tts = makeTts();
    // A permission request that never settles simulates a model still downloading.
    const recognition: RecognitionService = {
      isAvailable: () => false,
      requestPermission: vi.fn().mockReturnValue(new Promise(() => {})),
      listenOnce: vi.fn(),
      stop: vi.fn(),
    };
    render(
      <QuizMode animal={cow} tts={tts} recognition={recognition} lang="en" strings={enStrings} langConfig={enConfig} onNext={vi.fn()} onPrev={vi.fn()} />,
    );
    expect(screen.getByTestId('feedback')).toHaveTextContent(enStrings.micUnavailable.slice(0, 20));
    expect(screen.getByTestId('feedback')).not.toHaveTextContent(enStrings.quizListening);
    expect(screen.queryByTestId('listen-button')).toBeNull();
  });

  it('constrains the grammar for native-model languages (en/es) to preserve their accuracy', async () => {
    const recognition = makeRecognition({ result: { transcript: 'moo', noSpeech: false } });
    render(
      <QuizMode animal={cow} tts={makeTts()} recognition={recognition} lang="en" strings={enStrings} langConfig={enConfig} onNext={vi.fn()} onPrev={vi.fn()} />,
    );
    await waitFor(() =>
      expect(recognition.listenOnce).toHaveBeenCalledWith({ expectedWords: cow.acceptedAnswers }),
    );
  });

  it('free-forms Ukrainian (English acoustic model) to avoid closed-grammar collapse', async () => {
    const ukConfig = LANGUAGES.find((l) => l.code === 'uk')!;
    const recognition = makeRecognition({ result: { transcript: 'moo', noSpeech: false } });
    render(
      <QuizMode animal={cow} tts={makeTts()} recognition={recognition} lang="uk" strings={UI_STRINGS['uk']} langConfig={ukConfig} onNext={vi.fn()} onPrev={vi.fn()} />,
    );
    await waitFor(() => expect(recognition.listenOnce).toHaveBeenCalledWith({}));
  });

  it('never blocks when the microphone is denied (FR-011, SC-006)', async () => {
    const tts = makeTts();
    const onNext = vi.fn();
    const recognition = makeRecognition({ permission: 'denied', available: false });
    render(
      <QuizMode animal={cow} tts={tts} recognition={recognition} lang="en" strings={enStrings} langConfig={enConfig} onNext={onNext} onPrev={vi.fn()} />,
    );
    await waitFor(() =>
      expect(screen.getByTestId('feedback')).toHaveTextContent(/isn't available|not available|available/i),
    );
    expect(recognition.listenOnce).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Next animal' }));
    expect(onNext).toHaveBeenCalled();
  });
});
