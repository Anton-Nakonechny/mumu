import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
const dog: Animal = {
  id: 'dog',
  name: 'dog',
  image: 'assets/animals/dog.png',
  soundWord: 'woof',
  acceptedAnswers: ['woof'],
};

describe('navigation cancels in-flight speech (R5, no overlapping audio)', () => {
  it('cancels TTS before speaking the next animal', async () => {
    const repo: AnimalsRepository = { loadAnimals: vi.fn().mockResolvedValue([cow, dog]) };
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

    render(<App repository={repo} tts={tts} recognition={recognition} />);
    await waitFor(() => expect(screen.getByTestId('learn-phrase')).toHaveTextContent('The cow says muuuu'));

    fireEvent.click(screen.getByRole('button', { name: 'Next animal' }));
    expect(tts.cancel).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByTestId('learn-phrase')).toHaveTextContent('The dog says woof'));
    expect(tts.speak).toHaveBeenCalledWith('The dog says woof');
  });
});
