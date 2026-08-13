import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimalCollection, type Animal, resolveAnimals, type LocalizedAnimalData } from './domain/animal';
import {
  HttpAnimalsRepository,
  type AnimalsRepository,
} from './services/animalsRepository';
import { WebSpeechTtsService, type TtsService } from './services/speechSynthesis';
import {
  makeRecognitionService,
  type RecognitionService,
} from './services/speechRecognition';
import {
  LANGUAGES,
  UI_STRINGS,
  type Language,
} from './domain/language';
import { LocalStorageLanguageStore } from './services/languageStore';
import { LearnMode } from './components/LearnMode';
import { QuizMode } from './components/QuizMode';
import { ModeToggle, type GameMode } from './components/ModeToggle';
import { LanguageSelector } from './components/LanguageSelector';

interface AppProps {
  repository?: AnimalsRepository;
  tts?: TtsService;
  recognition?: RecognitionService;
  initialLanguage?: Language;
}

type LoadState = 'loading' | 'ready' | 'empty';

export function App({ repository, tts, recognition, initialLanguage }: AppProps = {}) {
  const repo = useMemo(() => repository ?? new HttpAnimalsRepository(), [repository]);
  const ttsService = useMemo(() => tts ?? new WebSpeechTtsService(), [tts]);

  const store = useMemo(() => new LocalStorageLanguageStore(), []);
  const [language, setLanguage] = useState<Language>(
    () => initialLanguage ?? store.load(),
  );
  const strings = UI_STRINGS[language];
  const langConfig = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  const recognitionService = useMemo(
    () => recognition ?? makeRecognitionService(language),
    // Re-create when language changes so the correct speech API is used
    [recognition, language],
  );

  const localizedAnimalsRef = useRef<LocalizedAnimalData[]>([]);
  const collectionRef = useRef<AnimalCollection | null>(null);
  const [state, setState] = useState<LoadState>('loading');
  const [current, setCurrent] = useState<Animal | null>(null);
  const [mode, setMode] = useState<GameMode>('learn');

  useEffect(() => {
    let cancelled = false;
    void repo.loadLocalizedAnimals().then((localized) => {
      if (cancelled) return;
      localizedAnimalsRef.current = localized;
      const animals = resolveAnimals(localized, language);
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
    // language intentionally omitted: only reload animals on repo change; language switching re-derives below
  }, [repo]);

  useEffect(() => {
    if (localizedAnimalsRef.current.length === 0) return;
    const animals = resolveAnimals(localizedAnimalsRef.current, language);
    // Preserve the child's place: the animal list is the same set/order in every language,
    // so carry the current index over instead of snapping back to the first animal.
    const prevIndex = collectionRef.current?.currentIndex ?? 0;
    const collection = new AnimalCollection(animals, prevIndex);
    collectionRef.current = collection;
    if (collection.isEmpty) {
      setState('empty');
      setCurrent(null);
      return;
    }
    setState('ready');
    setCurrent(collection.current() ?? null);
  }, [language]);

  const handleLanguageChange = (lang: Language) => {
    store.save(lang);
    ttsService.cancel();
    setLanguage(lang);
  };

  const goNext = () => setCurrent(collectionRef.current?.next() ?? null);
  const goPrev = () => setCurrent(collectionRef.current?.prev() ?? null);

  if (state === 'loading') {
    return <main className="app app-loading">{strings.loading}</main>;
  }
  if (state === 'empty' || !current) {
    return (
      <main className="app app-empty">
        <p>{strings.noAnimals}</p>
      </main>
    );
  }

  return (
    <main className="app">
      <LanguageSelector language={language} onChange={handleLanguageChange} />
      <ModeToggle mode={mode} onChange={setMode} strings={strings} />
      {mode === 'learn' ? (
        <LearnMode
          animal={current}
          tts={ttsService}
          strings={strings}
          langConfig={langConfig}
          onNext={goNext}
          onPrev={goPrev}
        />
      ) : (
        <QuizMode
          animal={current}
          tts={ttsService}
          recognition={recognitionService}
          lang={language}
          strings={strings}
          langConfig={langConfig}
          onNext={goNext}
          onPrev={goPrev}
        />
      )}
    </main>
  );
}
