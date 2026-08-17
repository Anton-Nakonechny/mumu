import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { App } from '../../src/App';
import { type LocalizedAnimalData } from '../../src/domain/animal';
import type { AnimalsRepository } from '../../src/services/animalsRepository';
import type { TtsService } from '../../src/services/speechSynthesis';
import type { RecognitionService } from '../../src/services/speechRecognition';
import { UI_STRINGS } from '../../src/domain/language';

// One animal fully translated in all three languages, each with an explicit learnPhrase and
// quizPrompt so the assertions pin the exact data-model text spoken per language.
const fixture: LocalizedAnimalData[] = [
  {
    id: 'cow',
    image: 'assets/animals/cow.webp',
    translations: {
      en: {
        name: 'cow',
        soundWord: 'moo',
        acceptedAnswers: ['moo'],
        learnPhrase: 'The cow says moo',
        quizPrompt: 'What does the cow say?',
      },
      uk: {
        name: 'корова',
        soundWord: 'муу',
        acceptedAnswers: ['muu'],
        learnPhrase: 'Корова каже муу',
        quizPrompt: 'Що каже корова?',
      },
      es: {
        name: 'vaca',
        soundWord: 'mu',
        acceptedAnswers: ['mu'],
        learnPhrase: 'La vaca hace mu',
        quizPrompt: '¿Qué hace la vaca?',
      },
    },
  },
];

function makeRepo(): AnimalsRepository {
  return {
    loadLocalizedAnimals: vi.fn().mockResolvedValue(fixture),
    // App must localize via loadLocalizedAnimals; a call here would mean a regression to English-only
    // data, so fail loudly instead of silently masking it.
    loadAnimals: vi.fn(() => {
      throw new Error('unexpected loadAnimals call');
    }),
  };
}

function makeTts(): TtsService {
  return { isAvailable: () => true, speak: vi.fn().mockResolvedValue(undefined), cancel: vi.fn() };
}

function makeRecognition(): RecognitionService {
  return {
    isAvailable: () => true,
    requestPermission: vi.fn().mockResolvedValue('granted'),
    // Resolve with no speech so the quiz stays put (tryAgain) — one listenOnce per ask cycle.
    listenOnce: vi.fn().mockResolvedValue({ transcript: '', noSpeech: true }),
    stop: vi.fn(),
  };
}

// Recognition whose first listenOnce stays pending (controlled via resolveFirst) while every later
// call resolves immediately as a miss. Lets a test hold an old-language listen in flight across a
// language switch and then resolve it, reproducing the stale-continuation race.
function makeDeferredRecognition() {
  let resolveFirst!: (r: { transcript: string; noSpeech: boolean }) => void;
  const firstPromise = new Promise<{ transcript: string; noSpeech: boolean }>((res) => {
    resolveFirst = res;
  });
  let calls = 0;
  const listenOnce = vi.fn(() => {
    calls += 1;
    return calls === 1 ? firstPromise : Promise.resolve({ transcript: '', noSpeech: true });
  });
  const recognition: RecognitionService = {
    isAvailable: () => true,
    requestPermission: vi.fn().mockResolvedValue('granted'),
    listenOnce,
    stop: vi.fn(),
  };
  return { recognition, resolveFirst: () => resolveFirst({ transcript: '', noSpeech: true }) };
}

describe('Language switch re-speaks in the new language (Phase 7 convergence)', () => {
  it('T026: Learn mode re-speaks the current animal in the selected language on flag tap (FR-004, US2 AC1, SC-002)', async () => {
    const tts = makeTts();
    render(
      <App repository={makeRepo()} tts={tts} recognition={makeRecognition()} initialLanguage="en" />,
    );

    // Mount speaks the English learn phrase in en-US.
    await waitFor(() => expect(tts.speak).toHaveBeenCalledWith('The cow says moo', 'en-US'));

    // Tap the Ukrainian flag → re-speak the Ukrainian learn phrase in uk-UA.
    fireEvent.click(screen.getByTestId('lang-uk'));
    await waitFor(() => expect(tts.speak).toHaveBeenCalledWith('Корова каже муу', 'uk-UA'));

    // Tap the Spanish flag → re-speak the Spanish learn phrase in es-ES.
    fireEvent.click(screen.getByTestId('lang-es'));
    await waitFor(() => expect(tts.speak).toHaveBeenCalledWith('La vaca hace mu', 'es-ES'));
  });

  it('T027: Quiz mode re-asks and restarts listening in the new language on flag tap (FR-004, US2 AC4)', async () => {
    const tts = makeTts();
    const recognition = makeRecognition();
    render(
      <App repository={makeRepo()} tts={tts} recognition={recognition} initialLanguage="uk" />,
    );

    // Enter Quiz mode (Ukrainian label).
    await screen.findByTestId('lang-selector');
    fireEvent.click(screen.getByRole('button', { name: new RegExp(UI_STRINGS['uk'].quiz) }));

    // Ukrainian quiz prompt is asked and listening starts.
    await waitFor(() => expect(tts.speak).toHaveBeenCalledWith('Що каже корова?', 'uk-UA'));
    await waitFor(() => expect(recognition.listenOnce).toHaveBeenCalledTimes(1));

    // Tap the Spanish flag → re-ask the Spanish prompt in es-ES and listen again.
    fireEvent.click(screen.getByTestId('lang-es'));
    await waitFor(() => expect(tts.speak).toHaveBeenCalledWith('¿Qué hace la vaca?', 'es-ES'));
    await waitFor(() => expect(recognition.listenOnce).toHaveBeenCalledTimes(2));
  });

  it('T028: a language switch mid-listen never lets the old-language listen score or reveal in the old language (FR-004)', async () => {
    const tts = makeTts();
    const { recognition, resolveFirst } = makeDeferredRecognition();
    render(
      <App repository={makeRepo()} tts={tts} recognition={recognition} initialLanguage="uk" />,
    );

    // Enter Quiz mode (Ukrainian label); the first (uk) listen is left in flight (pending).
    await screen.findByTestId('lang-selector');
    fireEvent.click(screen.getByRole('button', { name: new RegExp(UI_STRINGS['uk'].quiz) }));
    await waitFor(() => expect(tts.speak).toHaveBeenCalledWith('Що каже корова?', 'uk-UA'));
    await waitFor(() => expect(recognition.listenOnce).toHaveBeenCalledTimes(1));

    // Switch to Spanish mid-listen: a fresh es cycle asks and listens, and the es listen resolves
    // as a miss (session now at one miss, "listen again" offered).
    fireEvent.click(screen.getByTestId('lang-es'));
    await waitFor(() => expect(tts.speak).toHaveBeenCalledWith('¿Qué hace la vaca?', 'es-ES'));
    await waitFor(() => expect(recognition.listenOnce).toHaveBeenCalledTimes(2));
    await screen.findByTestId('listen-button');

    // The stale uk listen finally resolves. It must not charge a phantom miss against the fresh es
    // session (which would make this the 2nd miss and reveal the sound) nor speak in the old uk voice.
    await act(async () => {
      resolveFirst();
      await Promise.resolve();
      await Promise.resolve();
    });

    // FR-004: nothing is spoken in the language just switched away from — no uk reveal…
    expect(tts.speak).not.toHaveBeenCalledWith('муу', 'uk-UA');
    // …and the es session was not polluted, so the child is still offered another try, not a reveal.
    expect(screen.queryByTestId('listen-button')).not.toBeNull();
  });
});
