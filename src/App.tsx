import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimalCollection, type Animal } from './domain/animal';
import {
  HttpAnimalsRepository,
  type AnimalsRepository,
} from './services/animalsRepository';
import { WebSpeechTtsService, type TtsService } from './services/speechSynthesis';
import {
  OnDeviceRecognitionService,
  type RecognitionService,
} from './services/speechRecognition';
import { LearnMode } from './components/LearnMode';
import { QuizMode } from './components/QuizMode';
import { ModeToggle, type GameMode } from './components/ModeToggle';

interface AppProps {
  repository?: AnimalsRepository;
  tts?: TtsService;
  recognition?: RecognitionService;
}

type LoadState = 'loading' | 'ready' | 'empty';

export function App({ repository, tts, recognition }: AppProps = {}) {
  const repo = useMemo(() => repository ?? new HttpAnimalsRepository(), [repository]);
  const ttsService = useMemo(() => tts ?? new WebSpeechTtsService(), [tts]);
  const recognitionService = useMemo(
    () => recognition ?? new OnDeviceRecognitionService(),
    [recognition],
  );

  const collectionRef = useRef<AnimalCollection | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [current, setCurrent] = useState<Animal | null>(null);
  const [mode, setMode] = useState<GameMode>('learn');

  useEffect(() => {
    let cancelled = false;
    void repo.loadAnimals().then((animals) => {
      if (cancelled) return;
      const collection = new AnimalCollection(animals);
      collectionRef.current = collection;
      if (collection.isEmpty) {
        setState('empty');
        return;
      }
      setCurrent(collection.current() ?? null);
      setState('ready');
    });
    return () => {
      cancelled = true;
    };
  }, [repo]);

  const goNext = () => setCurrent(collectionRef.current?.next() ?? null);
  const goPrev = () => setCurrent(collectionRef.current?.prev() ?? null);

  if (state === 'loading') {
    return <main className="app app-loading">Loading animals…</main>;
  }
  if (state === 'empty' || !current) {
    return (
      <main className="app app-empty">
        <p>No animals to play with yet. Add some pictures to get started! 🐾</p>
      </main>
    );
  }

  return (
    <main className="app">
      <ModeToggle mode={mode} onChange={setMode} />
      {mode === 'learn' ? (
        <LearnMode animal={current} tts={ttsService} onNext={goNext} onPrev={goPrev} />
      ) : (
        <QuizMode
          animal={current}
          tts={ttsService}
          recognition={recognitionService}
          onNext={goNext}
          onPrev={goPrev}
        />
      )}
    </main>
  );
}
