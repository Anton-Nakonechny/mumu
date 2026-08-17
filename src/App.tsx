import { useEffect, useMemo, useState } from 'react';
import { resolveAnimals, type LocalizedAnimalData } from './domain/animal';
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

  const [localizedAnimals, setLocalizedAnimals] = useState<LocalizedAnimalData[] | null>(null);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<GameMode>('learn');

  useEffect(() => {
    let cancelled = false;
    void repo.loadLocalizedAnimals().then((localized) => {
      if (!cancelled) setLocalizedAnimals(localized);
    });
    return () => {
      cancelled = true;
    };
  }, [repo]);

  // Resolve the animal list for the active language in render, so language and the current
  // animal are always consistent within one commit — a flag switch produces a single render
  // with both updated (no stale intermediate that would speak the wrong-language text).
  const animals = useMemo(
    () => (localizedAnimals ? resolveAnimals(localizedAnimals, language) : []),
    [localizedAnimals, language],
  );

  const state: LoadState = localizedAnimals === null ? 'loading' : animals.length === 0 ? 'empty' : 'ready';
  // The animal list is the same set/order in every language, so the index carries the child's
  // place across a language switch without snapping back to the first animal.
  const current = animals.length > 0 ? animals[Math.min(index, animals.length - 1)] : null;

  const handleLanguageChange = (lang: Language) => {
    store.save(lang);
    ttsService.cancel();
    setLanguage(lang);
  };

  const goNext = () => setIndex((i) => (animals.length > 0 ? (i + 1) % animals.length : 0));
  const goPrev = () =>
    setIndex((i) => (animals.length > 0 ? (i - 1 + animals.length) % animals.length : 0));

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
