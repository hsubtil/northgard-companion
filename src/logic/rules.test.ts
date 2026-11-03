import { describe, expect, it } from 'vitest';
import { initialState, reducer } from '../state/store';
import type { GameConfig, GameState, ModuleConfig } from '../types';
import {
  closedTerritoryHarvestFame,
  creatureDeck,
  devCardKindForYear,
  nextActivePlayer,
  phaseSequence,
  startingResources,
  winterCost,
} from './rules';
import { buildSetupSteps } from './setup';

const baseModules: ModuleConfig = initialState().config.modules;

function config(n: number, modules: Partial<ModuleConfig> = {}): GameConfig {
  const clans = ['bear', 'boar', 'goat', 'raven', 'snake'] as const;
  return {
    players: Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `J${i + 1}`, color: `c${i}`, clan: clans[i] })),
    modules: { ...baseModules, ...modules },
  };
}

describe('règles', () => {
  it('coût de l’Hiver', () => {
    expect(winterCost(3)).toEqual({ food: 0, wood: 0 });
    expect(winterCost(4)).toEqual({ food: 1, wood: 0 });
    expect(winterCost(7)).toEqual({ food: 2, wood: 0 });
    expect(winterCost(12)).toEqual({ food: 3, wood: 1 });
    expect(winterCost(14)).toEqual({ food: 4, wood: 2 });
  });

  it('ressources de départ par position', () => {
    expect(startingResources(1)).toEqual({ food: 2, wood: 2 });
    expect(startingResources(4)).toEqual({ food: 3, wood: 2 });
  });

  it('renommée des territoires fermés à la Récolte', () => {
    expect([1, 2, 3, 5].map(closedTerritoryHarvestFame)).toEqual([0, 1, 2, 2]);
  });

  it('cartes révélées selon l’année', () => {
    expect([1, 2, 3, 6, 7].map((y) => devCardKindForYear(y, baseModules))).toEqual([
      'early',
      'early',
      'advanced',
      'advanced',
      'achievement',
    ]);
    const long = { ...baseModules, longGame: true };
    expect([3, 4, 9, 10].map((y) => devCardKindForYear(y, long))).toEqual(['early', 'advanced', 'advanced', 'achievement']);
  });

  it('phase Créatures seulement avec le module', () => {
    expect(phaseSequence(baseModules)).not.toContain('creatures');
    expect(phaseSequence({ ...baseModules, creatures: true })).toContain('creatures');
  });

  it('pioche Créature : jamais de Guerrier spectral ni de Wyverne', () => {
    const deck = creatureDeck({ ...baseModules, creatures: true, wildernessCreatures: ['hvedrung', 'spectralWarrior', 'wyvern'] });
    expect(deck).toContain('hvedrung');
    expect(deck).not.toContain('spectralWarrior');
    expect(deck).not.toContain('wyvern');
  });

  it('ordre des tours en sautant les joueurs ayant passé', () => {
    expect(nextActivePlayer(0, [false, true, false])).toBe(2);
    expect(nextActivePlayer(2, [false, true, false])).toBe(0);
    expect(nextActivePlayer(1, [true, true, true])).toBeNull();
  });
});

describe('mise en place', () => {
  it('compte les cartes Développement selon le nombre de joueurs', () => {
    const steps = buildSetupSteps(config(4), 0);
    const d = steps.find((s) => s.id === 'D')!;
    expect(d.details[0]).toContain('8');
    expect(d.details[1]).toContain('16');
  });

  it('ajoute les étapes des modules', () => {
    const steps = buildSetupSteps(
      config(3, { creatures: true, environmentTiles: true, envTiles: ['wyvernDen', 'geyser'] }),
      1,
    );
    const ids = steps.map((s) => s.id);
    expect(ids).toContain('K2');
    expect(ids).toContain('L2');
    expect(steps.find((s) => s.id === 'L3')!.details[0]).toContain('9');
    expect(steps.find((s) => s.id === 'K2')!.details[1]).toContain('4 cartes');
  });

  it('ressources de départ à partir du premier joueur', () => {
    const k = buildSetupSteps(config(5), 3).find((s) => s.id === 'K')!;
    expect(k.details[0]).toContain('J4');
    expect(k.details[3]).toContain('J2 : 3 nourriture');
  });
});

describe('déroulement', () => {
  function started(n = 3, modules: Partial<ModuleConfig> = {}): GameState {
    let s = reducer(initialState(), { type: 'CONFIGURE', config: config(n, modules) });
    s = reducer(s, { type: 'SET_FIRST_PLAYER', player: 1 });
    return reducer(s, { type: 'START_GAME' });
  }

  it('le premier à passer prend le marqueur et la phase se termine quand tous ont passé', () => {
    let s = reducer(started(), { type: 'NEXT_PHASE' });
    expect(s.phase).toBe('actions');
    expect(s.current).toBe(1);
    s = reducer(s, { type: 'END_TURN', player: 1, text: 'joue' });
    expect(s.current).toBe(2);
    s = reducer(s, { type: 'PASS', player: 2 });
    expect(s.firstPlayer).toBe(2);
    expect(s.current).toBe(0);
    s = reducer(s, { type: 'PASS', player: 0 });
    expect(s.firstPlayer).toBe(2);
    expect(s.current).toBe(1);
    s = reducer(s, { type: 'PASS', player: 1 });
    expect(s.players.every((p) => p.passed)).toBe(true);
  });

  it('passe d’année en année puis termine après la 7e', () => {
    let s = started(2);
    for (let i = 0; i < 5 * 7; i++) s = reducer(s, { type: 'NEXT_PHASE' });
    expect(s.stage).toBe('final');
    expect(s.year).toBe(7);
  });

  it('Hvedrung insère la créature juste après lui', () => {
    let s = started(2, { creatures: true });
    s = reducer(s, { type: 'ADD_CREATURE', creatureId: 'hvedrung', color: 'beige', reason: 't' });
    s = reducer(s, { type: 'ADD_CREATURE', creatureId: 'wolf', color: 'beige', reason: 't' });
    s = reducer(s, { type: 'ADD_CREATURE', creatureId: 'draugr', color: 'beige', afterUid: s.creatureLine[0].uid, reason: 't' });
    expect(s.creatureLine.map((c) => c.creatureId)).toEqual(['hvedrung', 'draugr', 'wolf']);
  });

  it('cartes Troubles limitées à 10', () => {
    let s = started(2);
    for (let i = 0; i < 11; i++) s = reducer(s, { type: 'ADD_UNREST', player: 0 });
    expect(s.players[0].unrest).toBe(10);
    expect(s.unrestLeft).toBe(0);
    expect(s.log[0].text).toContain('−5');
  });
});
