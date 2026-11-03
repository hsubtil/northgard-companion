import { CREATURES } from '../data/creatures';
import { PHASE_LABELS } from '../data/reference';
import { nextActivePlayer, nextPhase, totalYears } from '../logic/rules';
import type { CreatureId, GameConfig, GameState, LogEntry, Phase } from '../types';

export const UNREST_CARDS = 10;

export type Action =
  | { type: 'CONFIGURE'; config: GameConfig }
  | { type: 'BACK_TO_CONFIG' }
  | { type: 'TOGGLE_SETUP'; id: string }
  | { type: 'SET_FIRST_PLAYER'; player: number }
  | { type: 'START_GAME' }
  | { type: 'TOGGLE_CHECK'; key: string }
  | { type: 'END_TURN'; player: number; text: string }
  | { type: 'PASS'; player: number }
  | { type: 'SET_CURRENT'; player: number }
  | { type: 'UPGRADE'; player: number }
  | { type: 'NEXT_PHASE' }
  | { type: 'ADD_CREATURE'; creatureId: CreatureId; color: string; afterUid?: string; reason: string }
  | { type: 'REMOVE_CREATURE'; uid: string; reason: string }
  | { type: 'MOVE_CREATURE'; uid: string; delta: -1 | 1 }
  | { type: 'TOGGLE_ACTIVATED'; uid: string }
  | { type: 'ADD_UNREST'; player: number }
  | { type: 'SET_UNITS'; player: number; units: number }
  | { type: 'LOG'; text: string }
  | { type: 'END_GAME'; reason: string }
  | { type: 'RESUME_GAME' };

export function initialState(): GameState {
  return {
    stage: 'config',
    config: {
      players: [],
      modules: {
        creatures: false,
        wildernessCreatures: [],
        environmentTiles: false,
        envTiles: [],
        warchiefs: false,
        warchiefsExtraUpgrades: false,
        moreCreatures: false,
        longGame: false,
        teamPlay: false,
      },
    },
    setupDone: [],
    firstPlayer: 0,
    year: 1,
    phase: 'start',
    current: 0,
    players: [],
    firstPasser: null,
    creatureLine: [],
    activated: [],
    checks: [],
    unrestLeft: UNREST_CARDS,
    log: [],
  };
}

let uidCounter = 0;
function uid(): string {
  uidCounter += 1;
  return `${Date.now().toString(36)}-${uidCounter}`;
}

function log(state: GameState, text: string): LogEntry[] {
  const phase: LogEntry['phase'] = state.stage === 'setup' ? 'setup' : state.stage === 'final' ? 'final' : state.phase;
  const id = (state.log[0]?.id ?? 0) + 1;
  return [{ id, year: state.year, phase, text }, ...state.log];
}

function toggle(list: string[], v: string): string[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

function enterPhase(state: GameState, phase: Phase): GameState {
  let s: GameState = { ...state, phase, checks: [] };
  if (phase === 'actions') {
    s = {
      ...s,
      current: s.firstPlayer,
      firstPasser: null,
      players: s.players.map((p) => ({ ...p, passed: false })),
    };
  }
  if (phase === 'creatures') s = { ...s, activated: [] };
  return { ...s, log: log(s, `→ ${PHASE_LABELS[phase]}`) };
}

export function reducer(state: GameState, action: Action): GameState {
  const pname = (i: number) => state.config.players[i]?.name ?? '?';
  switch (action.type) {
    case 'CONFIGURE': {
      const s: GameState = {
        ...initialState(),
        stage: 'setup',
        config: action.config,
        players: action.config.players.map(() => ({ unrest: 0, upgradesTaken: 0, units: 6, passed: false })),
      };
      return { ...s, log: log(s, `Nouvelle partie : ${action.config.players.map((p) => p.name).join(', ')}`) };
    }
    case 'BACK_TO_CONFIG':
      return { ...state, stage: 'config' };
    case 'TOGGLE_SETUP':
      return { ...state, setupDone: toggle(state.setupDone, action.id) };
    case 'SET_FIRST_PLAYER':
      return { ...state, firstPlayer: action.player, current: action.player };
    case 'START_GAME': {
      const s: GameState = { ...state, stage: 'play', year: 1, phase: 'start', current: state.firstPlayer, checks: [] };
      return { ...s, log: log(s, `Début de la partie. Premier joueur : ${pname(state.firstPlayer)}`) };
    }
    case 'TOGGLE_CHECK':
      return { ...state, checks: toggle(state.checks, action.key) };
    case 'END_TURN': {
      const next = nextActivePlayer(action.player, state.players.map((p) => p.passed));
      const s = { ...state, current: next ?? action.player };
      return { ...s, log: log(state, `${pname(action.player)} : ${action.text}`) };
    }
    case 'PASS': {
      const players = state.players.map((p, i) => (i === action.player ? { ...p, passed: true } : p));
      const isFirst = state.firstPasser === null;
      const next = nextActivePlayer(action.player, players.map((p) => p.passed));
      const s: GameState = {
        ...state,
        players,
        current: next ?? action.player,
        firstPasser: isFirst ? action.player : state.firstPasser,
        firstPlayer: isFirst ? action.player : state.firstPlayer,
      };
      return {
        ...s,
        log: log(state, `${pname(action.player)} passe${isFirst ? ' et prend le marqueur Premier joueur' : ''}.`),
      };
    }
    case 'SET_CURRENT':
      return { ...state, current: action.player };
    case 'UPGRADE':
      return {
        ...state,
        players: state.players.map((p, i) => (i === action.player ? { ...p, upgradesTaken: p.upgradesTaken + 1 } : p)),
      };
    case 'NEXT_PHASE': {
      const np = nextPhase(state.phase, state.config.modules);
      if (np) return enterPhase(state, np);
      if (state.year >= totalYears(state.config.modules)) {
        const s: GameState = { ...state, stage: 'final', endReason: `Fin de la ${state.year}e année.` };
        return { ...s, log: log(s, 'Fin de la partie : décompte final.') };
      }
      const s: GameState = { ...state, year: state.year + 1 };
      return enterPhase({ ...s, log: log(s, `═══ Année ${s.year} ═══`) }, 'start');
    }
    case 'ADD_CREATURE': {
      const entry = { uid: uid(), creatureId: action.creatureId, color: action.color };
      const line = [...state.creatureLine];
      const idx = action.afterUid ? line.findIndex((c) => c.uid === action.afterUid) : -1;
      if (idx >= 0) line.splice(idx + 1, 0, entry);
      else line.push(entry);
      return {
        ...state,
        creatureLine: line,
        log: log(state, `🐾 ${CREATURES[action.creatureId].name} apparaît (${action.reason}).`),
      };
    }
    case 'REMOVE_CREATURE': {
      const c = state.creatureLine.find((x) => x.uid === action.uid);
      if (!c) return state;
      return {
        ...state,
        creatureLine: state.creatureLine.filter((x) => x.uid !== action.uid),
        log: log(state, `🐾 ${CREATURES[c.creatureId].name} retirée (${action.reason}).`),
      };
    }
    case 'MOVE_CREATURE': {
      const line = [...state.creatureLine];
      const i = line.findIndex((c) => c.uid === action.uid);
      const j = i + action.delta;
      if (i < 0 || j < 0 || j >= line.length) return state;
      [line[i], line[j]] = [line[j], line[i]];
      return { ...state, creatureLine: line };
    }
    case 'TOGGLE_ACTIVATED':
      return { ...state, activated: toggle(state.activated, action.uid) };
    case 'ADD_UNREST': {
      const players = state.players.map((p, i) => (i === action.player ? { ...p, unrest: p.unrest + 1 } : p));
      if (state.unrestLeft <= 0) {
        return {
          ...state,
          log: log(state, `${pname(action.player)} ne peut pas payer : plus de cartes Troubles → −5 renommée et défausse la carte du dessus de sa pioche.`),
        };
      }
      return {
        ...state,
        players,
        unrestLeft: state.unrestLeft - 1,
        log: log(state, `${pname(action.player)} ne peut pas payer l’Hiver : prend une carte Troubles (sur sa pioche).`),
      };
    }
    case 'SET_UNITS':
      return {
        ...state,
        players: state.players.map((p, i) => (i === action.player ? { ...p, units: Math.max(0, action.units) } : p)),
      };
    case 'LOG':
      return { ...state, log: log(state, action.text) };
    case 'END_GAME': {
      const s: GameState = { ...state, stage: 'final', endReason: action.reason };
      return { ...s, log: log(s, `Fin de la partie : ${action.reason}`) };
    }
    case 'RESUME_GAME':
      return { ...state, stage: 'play', endReason: undefined };
  }
}

const STORAGE_KEY = 'northgard-companion-v1';

export interface Store {
  present: GameState;
  past: GameState[];
}

export type StoreAction = Action | { type: 'UNDO' } | { type: 'RESET' };

export function storeReducer(store: Store, action: StoreAction): Store {
  if (action.type === 'UNDO') {
    if (!store.past.length) return store;
    return { present: store.past[0], past: store.past.slice(1) };
  }
  if (action.type === 'RESET') return { present: initialState(), past: [] };
  const next = reducer(store.present, action);
  if (next === store.present) return store;
  return { present: next, past: [store.present, ...store.past].slice(0, 100) };
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { present: JSON.parse(raw) as GameState, past: [] };
  } catch {
    // ignore
  }
  return { present: initialState(), past: [] };
}

export function saveStore(store: Store): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store.present));
  } catch {
    // ignore
  }
}
