import type { GameState, LogEntry } from '../types';
import { EN_MESSAGES, translate, type Language, type MessageValues } from './messages';

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let legacyTemplates: { source: string; keys: string[]; pattern: RegExp }[] | undefined;

function translateLegacy(text: string, language: Language): string {
  if (language === 'fr') return text;
  if (Object.hasOwn(EN_MESSAGES, text)) return translate(language, text);
  legacyTemplates ??= Object.keys(EN_MESSAGES)
    .filter((source) => /\{\w+\}/.test(source))
    .map((source) => {
      const keys = [...source.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);
      const parts = source.split(/\{\w+\}/).map(escapeRegex);
      return { source, keys, pattern: new RegExp(`^${parts.join('([\\s\\S]*?)')}$`) };
    });
  for (const { source, keys, pattern } of legacyTemplates) {
    const match = pattern.exec(text);
    if (match) {
      const values = Object.fromEntries(keys.map((key, index) => [
        key,
        ['creature', 'reason', 'phase', 'kind', 'action'].includes(key)
          ? translateLegacy(match[index + 1], language)
          : match[index + 1],
      ]));
      return translate(language, source, values);
    }
  }
  const phase = text.match(/^→ (.+)$/);
  if (phase) return `→ ${translate(language, phase[1])}`;
  const playerAction = text.match(/^(.+?) : (.+)$/);
  if (playerAction) {
    const action = translateLegacy(playerAction[2], language);
    if (action !== playerAction[2]) return `${playerAction[1]} : ${action}`;
  }
  return text;
}

function translatedValues(values: MessageValues | undefined, keys: string[] | undefined, language: Language): MessageValues {
  return Object.fromEntries(Object.entries(values ?? {}).map(([key, value]) => [
    key, keys?.includes(key) && typeof value === 'string' ? translateLegacy(value, language) : value,
  ]));
}

export function translateLog(entry: LogEntry, language: Language): string {
  if (!entry.message) return translateLegacy(entry.text, language);
  const text = translate(language, entry.message, translatedValues(entry.values, entry.translatedValues, language));
  return `${entry.gameOver ? translate(language, 'Fin de la partie : ') : ''}${entry.player ? `${entry.player} : ` : ''}${text}`;
}

export function translateEndReason(state: GameState, language: Language): string {
  if (!state.endReason) return '';
  return state.endReasonValues
    ? translate(language, state.endReason, state.endReasonValues)
    : translateLegacy(state.endReason, language);
}
