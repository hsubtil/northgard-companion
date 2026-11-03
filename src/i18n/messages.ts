import { DATA_EN } from './data.en';
import { LOGIC_EN } from './logic.en';
import { UI_EN } from './ui.en';

export type Language = 'fr' | 'en';
export type MessageValues = Record<string, string | number>;
export type Translator = (message: string, values?: MessageValues) => string;

export const EN_MESSAGES: Record<string, string> = { ...DATA_EN, ...LOGIC_EN, ...UI_EN };

export function translate(language: Language, message: string, values: MessageValues = {}): string {
  const template = language === 'en' ? (EN_MESSAGES[message] ?? message) : message;
  return template.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    Object.hasOwn(values, key) ? String(values[key]) : placeholder,
  );
}
