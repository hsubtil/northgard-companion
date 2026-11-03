import { createContext, useContext } from 'react';
import { getGameData } from './data';
import type { Language, Translator } from './messages';

export const LanguageContext = createContext<{
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translator;
} | null>(null);

export function useI18n() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useI18n must be used within LanguageProvider.');
  return value;
}

export function useGameData() {
  return getGameData(useI18n().language);
}
