/**
 * Celebratory reactions for a correct quiz answer, plus the post-cheer delay before
 * auto-advancing to the next animal (feature 002-quiz-cheer-advance).
 *
 * Framework-free and pure so the rotation/no-immediate-repeat rule is unit-testable.
 */

import type { Language } from './language';

/**
 * Short, exclamatory, TTS-pronounceable phrases per language. Membership in this dedicated
 * set (never used for questions or neutral prompts) is what makes a cheer "distinct" from
 * ordinary speech (FR-002).
 */
export const CHEERS: Record<Language, readonly string[]> = {
  uk: [
    'Ура! Молодець!',
    'Чудово!',
    'Так тримати!',
    'Браво!',
    'Відмінно!',
  ],
  es: [
    '¡Sí! ¡Muy bien!',
    '¡Genial!',
    '¡Fantástico!',
    '¡Bravo!',
    '¡Excelente!',
  ],
  en: [
    'Yay! Great job!',
    'Woohoo! Well done!',
    'Awesome!',
    'Hooray! You got it!',
    'Fantastic!',
  ],
};

/** Pause after the cheer finishes before auto-advancing (ms). Within the assumed 1.5–2.5s window. */
export const AUTO_ADVANCE_DELAY_MS = 2000;

/**
 * Pick a celebratory phrase for a correct answer in the given language.
 * Always returns a member of {@link CHEERS}[lang]; when `previous` is given and more than one phrase
 * exists, the result never equals `previous` (no back-to-back repeat). With a single phrase it
 * returns that phrase.
 */
export function nextCheer(lang: Language, previous?: string): string {
  const set = CHEERS[lang];
  const pool = previous == null ? set : set.filter((phrase) => phrase !== previous);
  const choices = pool.length > 0 ? pool : set;
  return choices[Math.floor(Math.random() * choices.length)];
}
