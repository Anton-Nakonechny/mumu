import { useEffect, useRef } from 'react';
import { learnPhraseFor, type Animal } from '../domain/animal';
import type { TtsService } from '../services/speechSynthesis';
import type { LanguageConfig, UI_STRINGS } from '../domain/language';
import { AnimalCard } from './AnimalCard';

interface LearnModeProps {
  animal: Animal;
  tts: TtsService;
  strings: typeof UI_STRINGS['en'];
  langConfig: LanguageConfig;
  onNext: () => void;
  onPrev: () => void;
}

/**
 * Learn mode (User Story 1): shows the animal and speaks "The {animal} says {sound}" on
 * each change; replay re-speaks; when TTS is unavailable the sentence is shown as text
 * (FR-002, FR-004, FR-012). Speech is cancelled before the next animal (R5).
 */
export function LearnMode({ animal, tts, strings, langConfig, onNext, onPrev }: LearnModeProps) {
  const phrase = learnPhraseFor(animal);
  const spokenAvailable = tts.isAvailable();
  const lastSpokenId = useRef<string | null>(null);

  useEffect(() => {
    if (lastSpokenId.current === animal.id) return;
    lastSpokenId.current = animal.id;
    void tts.speak(phrase, langConfig.ttsLang);
  }, [animal.id, phrase, tts, langConfig.ttsLang]);

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
      onReplay={() => void tts.speak(phrase, langConfig.ttsLang)}
    >
      <p className="phrase-text" data-testid="learn-phrase">
        {phrase}
      </p>
      {!spokenAvailable && (
        <p className="audio-fallback" role="note">
          ({strings.audioOff})
        </p>
      )}
    </AnimalCard>
  );
}
