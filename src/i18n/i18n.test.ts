import { describe, expect, it } from 'vitest';
import { defaultPlayerSide, resolveCombat } from '../logic/combat';
import { buildSetupSteps } from '../logic/setup';
import { validateConfig } from '../logic/rules';
import { initialState, reducer, storeReducer } from '../state/store';
import type { GameConfig, LogEntry } from '../types';
import { getGameData } from './data';
import { translateEndReason, translateLog } from './logs';
import { EN_MESSAGES, translate } from './messages';

const config: GameConfig = {
  players: [
    { id: 'one', name: 'Élodie : {year}', color: 'red', clan: 'bear' },
    { id: 'two', name: 'Clans', color: 'blue', clan: 'snake' },
    { id: 'three', name: 'Alex', color: 'green', clan: 'wolf' },
    { id: 'four', name: 'Sam', color: 'white', clan: 'raven' },
  ],
  modules: {
    ...initialState().config.modules,
    creatures: true,
    wildernessCreatures: ['draugrJotunn', 'eldthurs', 'hvedrung'],
    environmentTiles: true,
    envTiles: ['greatLake', 'swamp', 'ruins', 'poisonousSwamp', 'highPeaks', 'geyser', 'ancestralGraveyard', 'wyvernDen'],
    warchiefs: true,
    teamPlay: true,
  },
};

describe('translation catalogs', () => {
  it('covers every literal UI translation call', () => {
    const sources = import.meta.glob<string>(['../App.tsx', '../components/**/*.tsx'], {
      query: '?raw', import: 'default', eager: true,
    });
    for (const [path, source] of Object.entries(sources)) {
      for (const match of source.matchAll(/\bt\(\s*('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*")/g)) {
        const message = match[1].slice(1, -1).replace(/\\(['"\\])/g, '$1');
        expect(Object.hasOwn(EN_MESSAGES, message), `${path}: ${message}`).toBe(true);
      }
    }
  });

  it('keeps the same interpolation parameters in both languages', () => {
    const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    for (const [source, english] of Object.entries(EN_MESSAGES)) {
      expect(placeholders(english), source).toEqual(placeholders(source));
    }
  });

  it('interpolates once without interpreting player-provided placeholders', () => {
    expect(translate('en', 'Début de la partie. Premier joueur : {player}', { player: config.players[0].name }))
      .toBe('Game started. First player: Élodie : {year}');
    expect(translate('fr', 'Fin de la {year}e année.', { year: 7 })).toBe('Fin de la 7e année.');
  });

  it('covers all textual game data while retaining shared names and symbols', () => {
    const shared = new Set([
      'Borgild', 'Svarn', 'Halvard', 'Liv', 'Signy', 'Brand', 'Egil',
      'Draugr', 'Draugr Jötunn', 'Eldthurs', 'Hvedrung', 'Beige', 'Geyser (×2)',
      'Wilderness', 'Warchiefs', 'Uncharted Horizon', 'Clans', 'Forge',
      '🃏 Deck building', '2. Actions', '⚔️×2', '⚔️×3', '💀 / ⚔️', '⚔️×2 + 💀', '💀💀', '⚔️ + 💀',
    ]);
    function check(value: unknown, key = ''): void {
      if (['id', 'emoji', 'icon', 'source', 'colors', 'phases', 'css', 'CLAN_IDS', 'ENV_TILE_IDS'].includes(key)) return;
      if (typeof value === 'string') {
        if (!shared.has(value)) expect(Object.hasOwn(EN_MESSAGES, value), value).toBe(true);
      } else if (Array.isArray(value)) {
        value.forEach((item) => check(item, key));
      } else if (value !== null && typeof value === 'object') {
        for (const [childKey, child] of Object.entries(value)) check(child, childKey);
      }
    }
    check(getGameData('fr'));
  });

  it('does not mutate French data, identifiers, infinity, or rule values', () => {
    const fr = getGameData('fr');
    const en = getGameData('en');
    expect(en.CLANS.bear.name).toBe('Clan of the Bear');
    expect(fr.CLANS.bear.name).toBe('Clan de l’Ours');
    expect(en.CREATURES.wolf.id).toBe(fr.CREATURES.wolf.id);
    expect(en.CREATURES.wolf.colors).toEqual(fr.CREATURES.wolf.colors);
    expect(en.CREATURES.wolf.combatValue).toBe(5);
    expect(en.WINTER_COSTS.at(-1)?.max).toBe(Infinity);
    expect(en.ENV_TILES.wyvernDen.phases).toEqual(fr.ENV_TILES.wyvernDen.phases);
  });
});

describe('localized generated guidance', () => {
  it('translates setup without changing steps or player names', () => {
    const fr = buildSetupSteps(config, 0, 'fr');
    const en = buildSetupSteps(config, 0, 'en');
    expect(en.map((step) => step.id)).toEqual(fr.map((step) => step.id));
    expect(en.find((step) => step.id === 'G')?.details[0]).toContain(config.players[0].name);
    expect(en.find((step) => step.id === 'H')?.details[0]).toContain('Clan of the Bear');
    expect(en.find((step) => step.id === 'D')?.details[0]).toBe('Shuffle the Early Development cards and take 8 (2 per player), face down.');
    expect(en.find((step) => step.id === 'L3')?.details[0]).toContain('12 tiles');
    expect(en.find((step) => step.id === 'T')?.details[0]).toContain('Team 1');
    expect(en.find((step) => step.id === 'K2')?.details[0]).toContain('Wolf');
    expect(en.find((step) => step.id === 'M')?.details[0]).toContain('7 years');
  });

  it('covers long-game, five-player, and optional setup guidance', () => {
    const longConfig: GameConfig = {
      ...config,
      players: [...config.players, { id: 'five', name: 'Robin', color: 'yellow', clan: 'goat' }],
      modules: { ...config.modules, longGame: true, teamPlay: false, warchiefs: false, warchiefsExtraUpgrades: true },
    };
    const en = buildSetupSteps(longConfig, 3, 'en');
    expect(en.find((step) => step.id === 'B')?.details[0]).toContain('10-year');
    expect(en.find((step) => step.id === 'F')?.details[0]).toContain('With 5 players');
    expect(en.find((step) => step.id === 'H')?.details).toContain(
      'The Bear upgrade card mentions Borgild: ignore that part without the Warchiefs module.',
    );
    expect(en.find((step) => step.id === 'K')?.details[3]).toBe('4 — Clans: 3 food + 2 wood');
    expect(en.find((step) => step.id === 'M')?.details[0]).toContain('10 years');
  });

  it('translates validation and combat without changing their results', () => {
    expect(validateConfig({ ...config, players: [] }, 'en')[0]).toBe('You need between 2 and 5 players.');
    const a = { ...defaultPlayerSide(), warchief: 'wolf' as const, food: 20, scorchedEarth: true };
    const d = { ...defaultPlayerSide(), warchief: 'goat' as const, fortresses: 1 };
    const fr = resolveCombat(a, d, 'fr');
    const en = resolveCombat(a, d, 'en');
    expect(en.attacker.score).toBe(fr.attacker.score);
    expect(en.defender.score).toBe(fr.defender.score);
    expect(en.winner).toBe(fr.winner);
    expect(en.attacker.breakdown).toContain('Food: +4 (max 4)');
    expect(en.explanation).toContain('the attacker wins');
  });
});

describe('language-independent saved games and logs', () => {
  it('renders the same saved log in either language without translating names', () => {
    const state = reducer(initialState(), { type: 'CONFIGURE', config });
    const started = reducer(state, { type: 'START_GAME' });
    expect(translateLog(started.log[0], 'en')).toBe('Game started. First player: Élodie : {year}');
    expect(translateLog(started.log[0], 'fr')).toBe('Début de la partie. Premier joueur : Élodie : {year}');
    expect(started.config).toEqual(config);
    const passed = reducer(started, { type: 'PASS', player: 1 });
    expect(translateLog(passed.log[0], 'en')).toBe('Clans passes and takes the First Player marker.');
    const phase = reducer(started, { type: 'NEXT_PHASE' });
    expect(translateLog(phase.log[0], 'en')).toBe('→ 2. Actions');
  });

  it('keeps interpolation metadata through serialization and undo', () => {
    const configured = reducer(initialState(), { type: 'CONFIGURE', config });
    const store = storeReducer({ present: configured, past: [] }, { type: 'PASS', player: 0 });
    const restored = JSON.parse(JSON.stringify(store)) as typeof store;
    expect(translateLog(restored.present.log[0], 'en')).toContain('Élodie : {year} passes');
    expect(storeReducer(restored, { type: 'UNDO' }).present).toEqual(configured);
  });

  it('translates creature labels and end reasons', () => {
    let state = reducer(initialState(), { type: 'CONFIGURE', config });
    state = reducer(state, { type: 'ADD_CREATURE', creatureId: 'wolf', color: 'beige', reason: 'Créatures' });
    expect(translateLog(state.log[0], 'en')).toBe('🐾 Wolf appears (Creatures).');
    state = reducer({ ...state, year: 7, phase: 'end' }, { type: 'NEXT_PHASE' });
    expect(translateEndReason(state, 'en')).toBe('End of year 7.');
  });

  it('uses the captured player name and preserves game-over metadata', () => {
    let state = reducer(initialState(), { type: 'CONFIGURE', config });
    state = reducer(state, {
      type: 'END_TURN', player: 0, text: 'Dé : +{value}', values: { value: 3 },
    });
    expect(translateLog(state.log[0], 'en')).toBe('Élodie : {year} : Die: +3');
    state = reducer(state, { type: 'END_GAME', reason: 'Fin de la {year}e année.', values: { year: 7 } });
    expect(translateEndReason(state, 'en')).toBe('End of year 7.');
    expect(translateLog(state.log[0], 'en')).toBe('Game over: End of year 7.');
  });

  it('can display legacy logs and final reasons saved before localization', () => {
    const legacy = (text: string): LogEntry => ({ id: 1, year: 1, phase: 'start', text });
    expect(translateLog(legacy('Nouvelle partie : Élodie, Alex'), 'en')).toBe('New game: Élodie, Alex');
    expect(translateLog(legacy('Alex passe et prend le marqueur Premier joueur.'), 'en')).toBe('Alex passes and takes the First Player marker.');
    expect(translateLog(legacy('→ 4. Hiver'), 'en')).toBe('→ 4. Winter');
    expect(translateLog(legacy('🐾 Loup apparaît (Créatures).'), 'en')).toBe('🐾 Wolf appears (Creatures).');
    expect(translateEndReason({ ...initialState(), endReason: 'Fin de la 7e année.' }, 'en')).toBe('End of year 7.');
  });
});
