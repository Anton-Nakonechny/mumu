import { useEffect, useRef, useState } from 'react';
import { quizPromptFor, type Animal } from '../domain/animal';
import { QuizSession, type QuizPhase } from '../domain/quizSession';
import { isAnswerCorrect } from '../domain/answerMatcher';
import type { TtsService } from '../services/speechSynthesis';
import type { RecognitionService } from '../services/speechRecognition';
import { AnimalCard } from './AnimalCard';
import { Feedback } from './Feedback';

interface QuizModeProps {
  animal: Animal;
  tts: TtsService;
  recognition: RecognitionService;
  onNext: () => void;
  onPrev: () => void;
}

/**
 * Quiz mode (User Story 2): asks "What does the {animal} say?", listens on-device, checks
 * the answer leniently, and after two misses reveals + speaks the sound (FR-006..FR-008a).
 * If listening is unavailable/denied the child is never blocked (FR-011, SC-006).
 */
export function QuizMode({ animal, tts, recognition, onNext, onPrev }: QuizModeProps) {
  const prompt = quizPromptFor(animal);
  const sessionRef = useRef(new QuizSession());
  const [phase, setPhase] = useState<QuizPhase>('listening');
  const [isListening, setIsListening] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  // Ask permission once; if not granted, quiz still works via reveal/skip.
  useEffect(() => {
    let cancelled = false;
    void recognition.requestPermission().then((result) => {
      if (!cancelled) setUnavailable(result !== 'granted');
    });
    return () => {
      cancelled = true;
    };
  }, [recognition]);

  const listen = async () => {
    if (!recognition.isAvailable()) {
      setUnavailable(true);
      return;
    }
    setIsListening(true);
    const result = await recognition.listenOnce({ expectedWords: animal.acceptedAnswers });
    setIsListening(false);
    const correct = isAnswerCorrect(result.transcript, animal.acceptedAnswers);
    const next = sessionRef.current.registerResult(correct);
    setPhase(next);
    if (next === 'revealed') void tts.speak(animal.soundWord);
  };

  // On each animal change: reset attempts, ask the question, then start listening.
  useEffect(() => {
    sessionRef.current.reset();
    setPhase('listening');
    let cancelled = false;
    void (async () => {
      await tts.speak(prompt);
      if (!cancelled && recognition.isAvailable()) void listen();
    })();
    return () => {
      cancelled = true;
      tts.cancel();
      recognition.stop();
    };
    // Intentionally keyed on animal.id only: re-run the ask/listen cycle per animal.
  }, [animal.id]);

  const navigate = (fn: () => void) => {
    tts.cancel();
    recognition.stop();
    fn();
  };

  const canListenAgain = !unavailable && !isListening && (phase === 'tryAgain' || phase === 'listening');

  return (
    <AnimalCard
      animal={animal}
      onNext={() => navigate(onNext)}
      onPrev={() => navigate(onPrev)}
      onReplay={() => void tts.speak(prompt)}
    >
      <p className="phrase-text" data-testid="quiz-prompt">
        {prompt}
      </p>
      <Feedback phase={phase} soundWord={animal.soundWord} listeningUnavailable={unavailable} />
      {canListenAgain && (
        <button
          type="button"
          className="listen-button"
          onClick={() => void listen()}
          data-testid="listen-button"
        >
          👂 Listen
        </button>
      )}
    </AnimalCard>
  );
}
