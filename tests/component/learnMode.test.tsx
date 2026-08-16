import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LearnMode } from '../../src/components/LearnMode';
import type { Animal } from '../../src/domain/animal';
import type { TtsService } from '../../src/services/speechSynthesis';
import { LANGUAGES, UI_STRINGS } from '../../src/domain/language';

const cow: Animal = {
  id: 'cow',
  name: 'cow',
  image: 'assets/animals/cow.webp',
  soundWord: 'muuuu',
  acceptedAnswers: ['moo'],
};
const dog: Animal = {
  id: 'dog',
  name: 'dog',
  image: 'assets/animals/dog.png',
  soundWord: 'woof',
  acceptedAnswers: ['woof'],
};

function makeTts(available = true): TtsService {
  return {
    isAvailable: () => available,
    speak: vi.fn().mockResolvedValue(undefined),
    cancel: vi.fn(),
  };
}

const enStrings = UI_STRINGS['en'];
const enConfig = LANGUAGES.find((l) => l.code === 'en')!;

describe('LearnMode (User Story 1)', () => {
  it('speaks the learn phrase on mount', () => {
    const tts = makeTts();
    render(
      <LearnMode animal={cow} tts={tts} strings={enStrings} langConfig={enConfig} onNext={vi.fn()} onPrev={vi.fn()} />,
    );
    expect(tts.speak).toHaveBeenCalledWith('The cow says muuuu', enConfig.ttsLang);
    expect(screen.getByTestId('learn-phrase')).toHaveTextContent('The cow says muuuu');
  });

  it('speaks again when the animal changes', () => {
    const tts = makeTts();
    const { rerender } = render(
      <LearnMode animal={cow} tts={tts} strings={enStrings} langConfig={enConfig} onNext={vi.fn()} onPrev={vi.fn()} />,
    );
    rerender(
      <LearnMode animal={dog} tts={tts} strings={enStrings} langConfig={enConfig} onNext={vi.fn()} onPrev={vi.fn()} />,
    );
    expect(tts.speak).toHaveBeenCalledWith('The dog says woof', enConfig.ttsLang);
  });

  it('re-speaks on replay', () => {
    const tts = makeTts();
    render(
      <LearnMode animal={cow} tts={tts} strings={enStrings} langConfig={enConfig} onNext={vi.fn()} onPrev={vi.fn()} />,
    );
    (tts.speak as ReturnType<typeof vi.fn>).mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Say it again' }));
    expect(tts.speak).toHaveBeenCalledWith('The cow says muuuu', enConfig.ttsLang);
  });

  it('cancels speech and calls onNext when navigating', () => {
    const tts = makeTts();
    const onNext = vi.fn();
    render(
      <LearnMode animal={cow} tts={tts} strings={enStrings} langConfig={enConfig} onNext={onNext} onPrev={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Next animal' }));
    expect(tts.cancel).toHaveBeenCalled();
    expect(onNext).toHaveBeenCalled();
  });

  it('shows the sentence as text when speech is unavailable (FR-012)', () => {
    const tts = makeTts(false);
    render(
      <LearnMode animal={cow} tts={tts} strings={enStrings} langConfig={enConfig} onNext={vi.fn()} onPrev={vi.fn()} />,
    );
    expect(screen.getByTestId('learn-phrase')).toHaveTextContent('The cow says muuuu');
    expect(screen.getByRole('note')).toBeInTheDocument();
  });
});
