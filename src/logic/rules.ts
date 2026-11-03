import { CREATURES } from '../data/creatures';
import { WINTER_COSTS } from '../data/reference';
import { translate, type Language } from '../i18n/messages';
import type { CreatureId, GameConfig, ModuleConfig, Phase } from '../types';

export function totalYears(m: ModuleConfig): number {
  return m.longGame ? 10 : 7;
}

export function earlyPerPlayer(m: ModuleConfig): number {
  return m.longGame ? 3 : 2;
}

export function advancedPerPlayer(m: ModuleConfig): number {
  return m.longGame ? 6 : 4;
}

export type DevCardKind = 'early' | 'advanced' | 'achievement';

/** Type de cartes révélées au début de l'année (le deck est empilé Précoces au-dessus). */
export function devCardKindForYear(year: number, m: ModuleConfig): DevCardKind {
  if (year >= totalYears(m)) return 'achievement';
  if (year <= earlyPerPlayer(m)) return 'early';
  return 'advanced';
}

export const DEV_KIND_LABEL: Record<DevCardKind, string> = {
  early: 'Développement précoce',
  advanced: 'Développement avancé',
  achievement: 'Succès',
};

export function winterCost(units: number): { food: number; wood: number } {
  if (units <= 0) return { food: 0, wood: 0 };
  const row = WINTER_COSTS.find((r) => units >= r.min && units <= r.max)!;
  return { food: row.food, wood: row.wood };
}

/** Ressources de départ selon la position autour de la table (1 = premier joueur). */
export function startingResources(seat: number): { food: number; wood: number } {
  return seat <= 3 ? { food: 2, wood: 2 } : { food: 3, wood: 2 };
}

/** Renommée à la Récolte pour un territoire fermé de n tuiles. */
export function closedTerritoryHarvestFame(tiles: number): number {
  if (tiles >= 3) return 2;
  if (tiles === 2) return 1;
  return 0;
}

export function phaseSequence(m: ModuleConfig): Phase[] {
  return m.creatures
    ? ['start', 'actions', 'creatures', 'harvest', 'winter', 'end']
    : ['start', 'actions', 'harvest', 'winter', 'end'];
}

export function nextPhase(current: Phase, m: ModuleConfig): Phase | null {
  const seq = phaseSequence(m);
  const i = seq.indexOf(current);
  return i >= 0 && i < seq.length - 1 ? seq[i + 1] : null;
}

/** Joueurs dans l'ordre horaire à partir de `start`. */
export function orderFrom(start: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => (start + i) % count);
}

/** Prochain joueur n'ayant pas passé, en sens horaire après `current`. */
export function nextActivePlayer(current: number, passed: boolean[]): number | null {
  const n = passed.length;
  for (let i = 1; i <= n; i++) {
    const p = (current + i) % n;
    if (!passed[p]) return p;
  }
  return null;
}

/** Créatures qui composent la pioche Créature (hors Guerriers spectraux et Wyverne). */
export function creatureDeck(m: ModuleConfig): CreatureId[] {
  if (!m.creatures) return [];
  const core = (Object.keys(CREATURES) as CreatureId[]).filter((id) => CREATURES[id].source === 'core');
  const wild = m.wildernessCreatures.filter((id) => CREATURES[id].source === 'wilderness');
  return [...core, ...wild];
}

/** Créatures pouvant apparaître dans la ligne (pioche + créatures liées aux tuiles Environnement). */
export function availableCreatures(m: ModuleConfig): CreatureId[] {
  const list = creatureDeck(m);
  if (m.creatures && m.environmentTiles) {
    if (m.envTiles.includes('ancestralGraveyard')) list.push('spectralWarrior');
    if (m.envTiles.includes('wyvernDen')) list.push('wyvern');
  }
  return list;
}

export function victoryTerritoriesNeeded(m: ModuleConfig): number | null {
  if (m.longGame) return null;
  return m.teamPlay ? 5 : 3;
}

export function upgradeCardsPerPlayer(m: ModuleConfig): number {
  return m.warchiefsExtraUpgrades || m.warchiefs ? 3 : 2;
}

export function validateConfig(c: GameConfig, language: Language = 'fr'): string[] {
  const errors: string[] = [];
  const n = c.players.length;
  if (n < 2 || n > 5) errors.push('Il faut entre 2 et 5 joueurs.');
  const clans = c.players.map((p) => p.clan);
  if (new Set(clans).size !== clans.length) errors.push('Chaque joueur doit choisir un clan différent.');
  const colors = c.players.map((p) => p.color);
  if (new Set(colors).size !== colors.length) errors.push('Chaque joueur doit choisir une couleur différente.');
  if (c.players.some((p) => !p.name.trim())) errors.push('Chaque joueur doit avoir un nom.');
  if (c.modules.teamPlay && n !== 4) errors.push('La variante en équipe nécessite exactement 4 joueurs.');
  if (c.modules.environmentTiles && c.modules.envTiles.length === 0)
    errors.push('Sélectionnez au moins une tuile Environnement (ou désactivez le module).');
  return errors.map((error) => translate(language, error));
}
