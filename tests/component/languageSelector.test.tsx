import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageSelector } from '../../src/components/LanguageSelector';
import { App } from '../../src/App';
import type { LocalizedAnimalData } from '../../src/domain/animal';
import type { AnimalsRepository } from '../../src/services/animalsRepository';
import type { TtsService } from '../../src/services/speechSynthesis';
import type { RecognitionService } from '../../src/services/speechRecognition';

describe('LanguageSelector — rendering', () => {
  it('renders a radiogroup container with correct test id', () => {
    render(<LanguageSelector language="uk" onChange={vi.fn()} />);
    const group = screen.getByRole('radiogroup');
    expect(group).toBeInTheDocument();
    expect(group).toHaveAttribute('data-testid', 'lang-selector');
  });

  it('renders three flag buttons', () => {
    render(<LanguageSelector language="uk" onChange={vi.fn()} />);
    const buttons = screen.getAllByRole('radio');
    expect(buttons).toHaveLength(3);
  });

  it('marks the active language uk with aria-checked="true"', () => {
    render(<LanguageSelector language="uk" onChange={vi.fn()} />);
    const ukBtn = screen.getByTestId('lang-uk');
    expect(ukBtn).toHaveAttribute('aria-checked', 'true');
    expect(ukBtn).toHaveClass('active');
  });

  it('marks inactive languages with aria-checked="false"', () => {
    render(<LanguageSelector language="uk" onChange={vi.fn()} />);
    expect(screen.getByTestId('lang-es')).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByTestId('lang-en')).toHaveAttribute('aria-checked', 'false');
  });

  it('shows the correct flag emojis', () => {
    render(<LanguageSelector language="uk" onChange={vi.fn()} />);
    expect(screen.getByTestId('lang-uk').textContent).toContain('🇺🇦');
    expect(screen.getByTestId('lang-es').textContent).toContain('🇪🇸');
    expect(screen.getByTestId('lang-en').textContent).toContain('🇺🇸');
  });

  it('marks es as active when language="es"', () => {
    render(<LanguageSelector language="es" onChange={vi.fn()} />);
    expect(screen.getByTestId('lang-es')).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByTestId('lang-uk')).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByTestId('lang-en')).toHaveAttribute('aria-checked', 'false');
  });
});

describe('LanguageSelector — interaction', () => {
  it('calls onChange with the tapped language code', async () => {
    const onChange = vi.fn();
    render(<LanguageSelector language="uk" onChange={onChange} />);
    await userEvent.click(screen.getByTestId('lang-es'));
    expect(onChange).toHaveBeenCalledWith('es');
  });

  it('does NOT call onChange when tapping the already-active flag', async () => {
    const onChange = vi.fn();
    render(<LanguageSelector language="uk" onChange={onChange} />);
    await userEvent.click(screen.getByTestId('lang-uk'));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('can switch through all three flags in sequence', async () => {
    const onChange = vi.fn();
    render(<LanguageSelector language="uk" onChange={onChange} />);
    await userEvent.click(screen.getByTestId('lang-es'));
    await userEvent.click(screen.getByTestId('lang-en'));
    expect(onChange).toHaveBeenNthCalledWith(1, 'es');
    expect(onChange).toHaveBeenNthCalledWith(2, 'en');
  });
});

describe('LanguageSelector — visible in both modes (US2)', () => {
  const cowLocalized: LocalizedAnimalData = {
    id: 'cow',
    image: 'assets/animals/cow.avif',
    translations: { en: { name: 'cow', soundWord: 'muuuu', acceptedAnswers: ['moo'] } },
  };
  const repo: AnimalsRepository = {
    loadAnimals: vi.fn().mockResolvedValue([]),
    loadLocalizedAnimals: vi.fn().mockResolvedValue([cowLocalized]),
  };
  const tts: TtsService = {
    isAvailable: () => true,
    speak: vi.fn().mockResolvedValue(undefined),
    cancel: vi.fn(),
  };
  const recognition: RecognitionService = {
    isAvailable: () => false,
    requestPermission: vi.fn().mockResolvedValue('denied'),
    listenOnce: vi.fn().mockResolvedValue({ transcript: '', noSpeech: true }),
    stop: vi.fn(),
  };

  it('data-testid="lang-selector" present in Learn mode', async () => {
    render(<App repository={repo} tts={tts} recognition={recognition} initialLanguage="en" />);
    await waitFor(() => expect(screen.getByTestId('learn-phrase')).toBeInTheDocument());
    expect(screen.getByTestId('lang-selector')).toBeInTheDocument();
  });

  it('data-testid="lang-selector" present in Quiz mode', async () => {
    render(<App repository={repo} tts={tts} recognition={recognition} initialLanguage="en" />);
    await waitFor(() => expect(screen.getByTestId('learn-phrase')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Quiz/ }));
    await waitFor(() => expect(screen.getByTestId('quiz-prompt')).toBeInTheDocument());
    expect(screen.getByTestId('lang-selector')).toBeInTheDocument();
  });
});
