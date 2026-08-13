export type Language = 'en' | 'uk' | 'es';

export interface LanguageConfig {
  code: Language;
  flag: string;
  label: string;
  ttsLang: string;
  speechLang: string;
}

export const LANGUAGES: readonly LanguageConfig[] = [
  { code: 'uk', flag: '🇺🇦', label: 'Ukrainian', ttsLang: 'uk-UA', speechLang: 'uk-UA' },
  { code: 'es', flag: '🇪🇸', label: 'Spanish', ttsLang: 'es-ES', speechLang: 'es-ES' },
  { code: 'en', flag: '🇺🇸', label: 'English', ttsLang: 'en-US', speechLang: 'en-US' },
];

export const DEFAULT_LANGUAGE: Language = 'uk';

type UiStrings = {
  learn: string;
  quiz: string;
  listen: string;
  loading: string;
  noAnimals: string;
  sayItAgain: string;
  prevAnimal: string;
  nextAnimal: string;
  audioOff: string;
  micUnavailable: string;
  quizListening: string;
  quizCorrect: string;
  quizTryAgain: string;
  quizRevealed: string;
};

export const UI_STRINGS: Record<Language, UiStrings> = {
  en: {
    learn: 'Learn',
    quiz: 'Quiz',
    listen: 'Listen',
    loading: 'Loading animals…',
    noAnimals: 'No animals to play with yet. Add some pictures!',
    sayItAgain: 'Say it again',
    prevAnimal: 'Previous animal',
    nextAnimal: 'Next animal',
    audioOff: 'Audio is off — read it out loud!',
    micUnavailable: "Listening isn't available — tap ▶ to see the next animal, or 🔊 to hear the sound.",
    quizListening: '👂 Listening…',
    quizCorrect: "🎉 Yay! That's right!",
    quizTryAgain: '🙂 Good try — say it again!',
    quizRevealed: 'It says "{sound}". Great trying! Tap ▶ for the next animal.',
  },
  uk: {
    learn: 'Навчання',
    quiz: 'Вікторина',
    listen: 'Слухати',
    loading: 'Завантаження…',
    noAnimals: 'Немає тваринок. Додай картинки!',
    sayItAgain: 'Ще раз',
    prevAnimal: 'Попередня тварина',
    nextAnimal: 'Наступна тварина',
    audioOff: 'Аудіо вимкнено — читайте вголос!',
    micUnavailable: 'Мікрофон недоступний — натисни ▶ для наступної тварини або 🔊 для звуку.',
    quizListening: '👂 Слухаю…',
    quizCorrect: '🎉 Ура! Правильно!',
    quizTryAgain: '🙂 Майже! Спробуй ще раз!',
    quizRevealed: 'Каже «{sound}». Молодець! Натисни ▶ для наступної.',
  },
  es: {
    learn: 'Aprender',
    quiz: 'Quiz',
    listen: 'Escuchar',
    loading: 'Cargando…',
    noAnimals: 'No hay animales. ¡Añade imágenes!',
    sayItAgain: 'Otra vez',
    prevAnimal: 'Animal anterior',
    nextAnimal: 'Animal siguiente',
    audioOff: 'Audio desactivado — ¡léelo en voz alta!',
    micUnavailable: 'Micrófono no disponible — pulsa ▶ para el siguiente animal o 🔊 para el sonido.',
    quizListening: '👂 Escuchando…',
    quizCorrect: '🎉 ¡Sí! ¡Correcto!',
    quizTryAgain: '🙂 ¡Casi! ¡Otra vez!',
    quizRevealed: 'Hace «{sound}». ¡Bien hecho! Pulsa ▶ para el siguiente.',
  },
};
