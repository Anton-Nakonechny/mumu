import { useEffect, useRef, useState } from 'react';
import { quizPromptFor, type Animal } from '../domain/animal';
import { QuizSession, type QuizPhase } from '../domain/quizSession';
import { isAnswerCorrect } from '../domain/answerMatcher';
import { nextCheer, AUTO_ADVANCE_DELAY_MS } from '../domain/cheers';
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
  const lastCheerRef = useRef<string | undefined>(undefined);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Bumped whenever a pending advance is disarmed (navigation, unmount, tab hidden). An
  // in-flight listen() snapshots this before awaiting the cheer and refuses to arm a timer
  // if it changed — otherwise the resumed continuation could bounce the child forward after
  // they already navigated away during the cheer.
  const advanceGenRef = useRef(0);
  const [phase, setPhase] = useState<QuizPhase>('listening');
  const [isListening, setIsListening] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  // Disarm any pending auto-advance so it never fires after the child leaves this animal.
  const clearAutoAdvance = () => {
    advanceGenRef.current += 1;
    if (advanceTimerRef.current !== null) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  };

  // Cancel a pending auto-advance if the tab is hidden (FR-007).
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') clearAutoAdvance();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

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
    // Snapshot the auto-advance generation before any await; if the child navigates away
    // while we're listening or cheering, clearAutoAdvance() bumps it and we bail below.
    const gen = advanceGenRef.current;
    setIsListening(true);
    const result = await recognition.listenOnce({ expectedWords: animal.acceptedAnswers });
    setIsListening(false);
    const correct = isAnswerCorrect(result.transcript, animal.acceptedAnswers);
    const next = sessionRef.current.registerResult(correct);
    setPhase(next);
    if (next === 'correct') {
      // Cheer out loud for a correct answer (FR-001/FR-002); a rotating phrase avoids repeats.
      const cheer = nextCheer(lastCheerRef.current);
      lastCheerRef.current = cheer;
      await tts.speak(cheer);
      // If the child navigated away during the cheer, the awaited tts.cancel() resolved this
      // continuation — don't schedule an advance that would bounce them off the new animal.
      if (advanceGenRef.current !== gen) return;
      // After the cheer finishes (no overlap, FR-006), auto-advance after a short pause (FR-004).
      clearAutoAdvance();
      advanceTimerRef.current = setTimeout(() => {
        advanceTimerRef.current = null;
        onNext();
      }, AUTO_ADVANCE_DELAY_MS);
    } else if (next === 'revealed') {
      void tts.speak(animal.soundWord);
    }
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
      clearAutoAdvance();
      tts.cancel();
      recognition.stop();
    };
    // Intentionally keyed on animal.id only: re-run the ask/listen cycle per animal.
  }, [animal.id]);

  const navigate = (fn: () => void) => {
    clearAutoAdvance(); // manual navigation takes precedence over any pending auto-advance (FR-005)
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
