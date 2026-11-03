import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { translate, type Language, type Translator } from './messages';
import { LanguageContext } from './hooks';

const LANGUAGE_KEY = 'northgard-companion-language';

function loadLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    if (saved === 'en' || saved === 'fr') return saved;
  } catch (error) {
    console.error('Unable to read the saved language preference.', error);
  }
  return 'fr';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(loadLanguage);
  const value = useMemo(() => ({
    language,
    setLanguage,
    t: ((message, values) => translate(language, message, values)) satisfies Translator,
  }), [language]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = language === 'en' ? 'Northgard – Game Companion' : 'Northgard – Compagnon de jeu';
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute('content', language === 'en'
      ? 'Unofficial companion for Northgard: Uncharted Lands. Set up your game, track turns, and browse rules and expansions.'
      : 'Compagnon non officiel pour Northgard: Uncharted Lands. Préparez votre partie, suivez les tours et retrouvez les règles et extensions.');
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch (error) {
      console.error('Unable to save the language preference.', error);
    }
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
