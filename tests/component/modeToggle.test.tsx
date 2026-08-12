import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ModeToggle } from '../../src/components/ModeToggle';
import { App } from '../../src/App';
import type { Animal } from '../../src/domain/animal';
import type { AnimalsRepository } from '../../src/services/animalsRepository';
import type { TtsService } from '../../src/services/speechSynthesis';
import type { RecognitionService } from '../../src/services/speechRecognition';

const cow: Animal = {
  id: 'cow',
  name: 'cow',
  image: 'assets/animals/cow.avif',
  soundWord: 'muuuu',
  acceptedAnswers: ['moo'],
};

describe('ModeToggle', () => {
  it('reports the selected mode', () => {
    const onChange = vi.fn();
    render(<ModeToggle mode="learn" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /Quiz/ }));
    expect(onChange).toHaveBeenCalledWith('quiz');
  });

  it('marks the active mode pressed', () => {
    render(<ModeToggle mode="quiz" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /Quiz/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Learn/ })).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('App mode switching (User Story 3)', () => {
  const repo: AnimalsRepository = { loadAnimals: vi.fn().mockResolvedValue([cow]) };
  const tts: TtsService = {
    isAvailable: () => true,
    speak: vi.fn().mockResolvedValue(undefined),
    cancel: vi.fn(),
  };
  const recognition: RecognitionService = {
    isAvailable: () => false,
    requestPermission: vi.fn().mockResolvedValue('denied'),
    listenOnce: vi.fn().mockResolvedValue({ transcript: '', noSpeech: true }),
    stop: vi.fn(),
  };

  it('switches Learn ↔ Quiz on the same animal without reload', async () => {
    render(<App repository={repo} tts={tts} recognition={recognition} />);
    await waitFor(() => expect(screen.getByTestId('learn-phrase')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Quiz/ }));
    await waitFor(() => expect(screen.getByTestId('quiz-prompt')).toHaveTextContent('What does the cow say?'));

    fireEvent.click(screen.getByRole('button', { name: /Learn/ }));
    await waitFor(() => expect(screen.getByTestId('learn-phrase')).toHaveTextContent('The cow says muuuu'));
  });
});
