import { CLANS, CLAN_IDS, PLAYER_COLORS } from '../data/clans';
import { CREATURES, CREATURE_COLOR_LABEL, CREATURE_MOVE_RULES, CREATURE_PRIORITIES } from '../data/creatures';
import { ENV_TILES, ENV_TILE_IDS } from '../data/environment';
import { EXPANSIONS } from '../data/expansions';
import { PHASE_LABELS, TURN_OPTIONS, CARD_ACTIONS, BUILDINGS, WINTER_COSTS, DIE_FACES, REFERENCE } from '../data/reference';
import { DEV_KIND_LABEL } from '../logic/rules';
import { translate, type Language } from './messages';

const french = {
  CLANS, CLAN_IDS, PLAYER_COLORS, CREATURES, CREATURE_COLOR_LABEL, CREATURE_MOVE_RULES,
  CREATURE_PRIORITIES, ENV_TILES, ENV_TILE_IDS, EXPANSIONS, PHASE_LABELS, TURN_OPTIONS,
  CARD_ACTIONS, BUILDINGS, WINTER_COSTS, DIE_FACES, REFERENCE, DEV_KIND_LABEL,
};

// Only string values change; identifiers, object keys and numeric rule values are preserved.
function localize<T>(value: T, language: Language): T {
  if (typeof value === 'string') return translate(language, value) as T;
  if (Array.isArray(value)) return value.map((item: unknown) => localize(item, language)) as T;
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, localize(item, language)])) as T;
  }
  return value;
}

let english: typeof french | undefined;
export function getGameData(language: Language): typeof french {
  if (language === 'fr') return french;
  english ??= localize(french, 'en');
  return english;
}
