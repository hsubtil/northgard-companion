export type ClanId = 'bear' | 'boar' | 'goat' | 'raven' | 'snake' | 'stag' | 'wolf';

export type CreatureId =
  | 'wolf'
  | 'brownBear'
  | 'draugr'
  | 'fallenValkyrie'
  | 'draugrJotunn'
  | 'eldthurs'
  | 'hvedrung'
  | 'spectralWarrior'
  | 'wyvern';

export type EnvTileId =
  | 'greatLake'
  | 'swamp'
  | 'ruins'
  | 'poisonousSwamp'
  | 'highPeaks'
  | 'geyser'
  | 'ancestralGraveyard'
  | 'wyvernDen';

export type Phase = 'start' | 'actions' | 'creatures' | 'harvest' | 'winter' | 'end';

export interface Player {
  id: string;
  name: string;
  color: string;
  clan: ClanId;
}

export interface ModuleConfig {
  /** Module Créatures (livre de règles de base) */
  creatures: boolean;
  /** Créatures supplémentaires de Wilderness ajoutées à la pioche */
  wildernessCreatures: CreatureId[];
  /** Module Tuiles Environnement (Wilderness) */
  environmentTiles: boolean;
  envTiles: EnvTileId[];
  /** Module Chefs de guerre (Warchiefs) */
  warchiefs: boolean;
  /** Cartes d'amélioration supplémentaires de Warchiefs (utilisables sans le module) */
  warchiefsExtraUpgrades: boolean;
  /** Variante : Plus de créatures ! */
  moreCreatures: boolean;
  /** Variante : partie longue (10 ans) */
  longGame: boolean;
  /** Variante : jeu en équipe (4 joueurs) */
  teamPlay: boolean;
}

export interface GameConfig {
  players: Player[];
  modules: ModuleConfig;
}

export interface CreatureInLine {
  uid: string;
  creatureId: CreatureId;
  color: string;
}

export interface PlayerState {
  unrest: number;
  upgradesTaken: number;
  units: number;
  passed: boolean;
}

export interface LogEntry {
  id: number;
  year: number;
  phase: Phase | 'setup' | 'final';
  text: string;
  message?: string;
  values?: Record<string, string | number>;
  translatedValues?: string[];
  player?: string;
  gameOver?: boolean;
}

export interface GameState {
  stage: 'config' | 'setup' | 'play' | 'final';
  config: GameConfig;
  setupDone: string[];
  firstPlayer: number;
  year: number;
  phase: Phase;
  current: number;
  players: PlayerState[];
  firstPasser: number | null;
  creatureLine: CreatureInLine[];
  activated: string[];
  checks: string[];
  unrestLeft: number;
  log: LogEntry[];
  endReason?: string;
  endReasonValues?: Record<string, string | number>;
}
