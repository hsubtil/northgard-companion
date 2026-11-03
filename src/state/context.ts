import { createContext, useContext, type Dispatch } from 'react';
import type { GameState } from '../types';
import type { StoreAction } from './store';

export interface GameContextValue {
  state: GameState;
  dispatch: Dispatch<StoreAction>;
  canUndo: boolean;
}

export const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameContext');
  return ctx;
}
