import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Feedback } from '../../src/components/Feedback';
import { UI_STRINGS } from '../../src/domain/language';

const ukStrings = UI_STRINGS['uk'];
const esStrings = UI_STRINGS['es'];
const enStrings = UI_STRINGS['en'];

const ENGLISH_FRAGMENTS = ['It says', 'Yay', 'Good try', 'Listening'];

describe('Feedback — localized rendering (FR-002, SC-001)', () => {
  describe('Ukrainian strings', () => {
    it('phase=correct: shows quizCorrect, no English fragments', () => {
      render(
        <Feedback phase="correct" soundWord="мяу" listeningUnavailable={false} strings={ukStrings} />,
      );
      const el = screen.getByTestId('feedback');
      expect(el.textContent).toContain(ukStrings.quizCorrect);
      for (const frag of ENGLISH_FRAGMENTS) expect(el.textContent).not.toContain(frag);
    });

    it('phase=tryAgain: shows quizTryAgain, no English fragments', () => {
      render(
        <Feedback phase="tryAgain" soundWord="мяу" listeningUnavailable={false} strings={ukStrings} />,
      );
      const el = screen.getByTestId('feedback');
      expect(el.textContent).toContain(ukStrings.quizTryAgain);
      for (const frag of ENGLISH_FRAGMENTS) expect(el.textContent).not.toContain(frag);
    });

    it('phase=revealed: embeds soundWord in localized sentence, no English', () => {
      render(
        <Feedback phase="revealed" soundWord="мяу" listeningUnavailable={false} strings={ukStrings} />,
      );
      const el = screen.getByTestId('feedback');
      expect(el.textContent).toContain('мяу');
      expect(el.textContent).not.toContain('{sound}');
      for (const frag of ENGLISH_FRAGMENTS) expect(el.textContent).not.toContain(frag);
    });

    it('phase=listening: shows quizListening, no English fragments', () => {
      render(
        <Feedback phase="listening" soundWord="мяу" listeningUnavailable={false} strings={ukStrings} />,
      );
      const el = screen.getByTestId('feedback');
      expect(el.textContent).toContain(ukStrings.quizListening);
      for (const frag of ENGLISH_FRAGMENTS) expect(el.textContent).not.toContain(frag);
    });

    it('listeningUnavailable: shows micUnavailable (unchanged)', () => {
      render(
        <Feedback phase="listening" soundWord="мяу" listeningUnavailable={true} strings={ukStrings} />,
      );
      const el = screen.getByTestId('feedback');
      expect(el.textContent).toContain(ukStrings.micUnavailable);
    });
  });

  describe('Spanish strings', () => {
    it('phase=correct: shows quizCorrect, no English fragments', () => {
      render(
        <Feedback phase="correct" soundWord="muu" listeningUnavailable={false} strings={esStrings} />,
      );
      const el = screen.getByTestId('feedback');
      expect(el.textContent).toContain(esStrings.quizCorrect);
      for (const frag of ENGLISH_FRAGMENTS) expect(el.textContent).not.toContain(frag);
    });

    it('phase=tryAgain: shows quizTryAgain, no English fragments', () => {
      render(
        <Feedback phase="tryAgain" soundWord="muu" listeningUnavailable={false} strings={esStrings} />,
      );
      const el = screen.getByTestId('feedback');
      expect(el.textContent).toContain(esStrings.quizTryAgain);
      for (const frag of ENGLISH_FRAGMENTS) expect(el.textContent).not.toContain(frag);
    });

    it('phase=revealed: embeds soundWord in localized sentence, no English', () => {
      render(
        <Feedback phase="revealed" soundWord="muu" listeningUnavailable={false} strings={esStrings} />,
      );
      const el = screen.getByTestId('feedback');
      expect(el.textContent).toContain('muu');
      expect(el.textContent).not.toContain('{sound}');
      for (const frag of ENGLISH_FRAGMENTS) expect(el.textContent).not.toContain(frag);
    });

    it('phase=listening: shows quizListening, no English fragments', () => {
      render(
        <Feedback phase="listening" soundWord="muu" listeningUnavailable={false} strings={esStrings} />,
      );
      const el = screen.getByTestId('feedback');
      expect(el.textContent).toContain(esStrings.quizListening);
      for (const frag of ENGLISH_FRAGMENTS) expect(el.textContent).not.toContain(frag);
    });
  });

  describe('English strings (FR-009 — no regression)', () => {
    it('phase=revealed: embeds soundWord', () => {
      render(
        <Feedback phase="revealed" soundWord="moo" listeningUnavailable={false} strings={enStrings} />,
      );
      const el = screen.getByTestId('feedback');
      expect(el.textContent).toContain('moo');
      expect(el.textContent).not.toContain('{sound}');
    });
  });
});
