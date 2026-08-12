import { useEffect, useRef } from 'react';
import { learnPhraseFor, type Animal } from '../domain/animal';
import type { TtsService } from '../services/speechSynthesis';
import { AnimalCard } from './AnimalCard';

interface LearnModeProps {
  animal: Animal;
  tts: TtsService;
  onNext: () => void;
  onPrev: () => void;
}

/**
 * Learn mode (User Story 1): shows the animal and speaks "The {animal} says {sound}" on
 * each change; replay re-speaks; when TTS is unavailable the sentence is shown as text
 * (FR-002, FR-004, FR-012). Speech is cancelled before the next animal (R5).
 */
export function LearnMode({ animal, tts, onNext, onPrev }: LearnModeProps) {
  const phrase = learnPhraseFor(animal);
  const spokenAvailable = tts.isAvailable();
  const lastSpokenId = useRef<string | null>(null);

  useEffect(() => {
    if (lastSpokenId.current === animal.id) return;
    lastSpokenId.current = animal.id;
    void tts.speak(phrase);
    // No cleanup cancel: navigation cancels explicitly (see navigate) and speak() cancels
    // any in-flight utterance itself. Cancelling here would let StrictMode's double-mount
    // swallow the announcement (T039).
  }, [animal.id, phrase, tts]);

  const navigate = (fn: () => void) => {
    tts.cancel();
    lastSpokenId.current = null;
    fn();
  };

  return (
    <AnimalCard
      animal={animal}
      onNext={() => navigate(onNext)}
      onPrev={() => navigate(onPrev)}
      onReplay={() => void tts.speak(phrase)}
    >
      <p className="phrase-text" data-testid="learn-phrase">
        {phrase}
      </p>
      {!spokenAvailable && (
        <p className="audio-fallback" role="note">
          (Audio is off — read it out loud!)
        </p>
      )}
    </AnimalCard>
  );
}
