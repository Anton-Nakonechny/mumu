import { LANGUAGES, type Language } from '../domain/language';
import './LanguageSelector.css';

interface LanguageSelectorProps {
  language: Language;
  onChange: (lang: Language) => void;
}

export function LanguageSelector({ language, onChange }: LanguageSelectorProps) {
  return (
    <div role="radiogroup" aria-label="Language" data-testid="lang-selector" className="lang-selector">
      {LANGUAGES.map((config) => (
        <button
          key={config.code}
          role="radio"
          type="button"
          aria-checked={language === config.code}
          aria-label={config.label}
          data-testid={`lang-${config.code}`}
          className={`lang-button${language === config.code ? ' active' : ''}`}
          onClick={() => {
            if (language !== config.code) onChange(config.code);
          }}
        >
          {config.flag}
        </button>
      ))}
    </div>
  );
}
