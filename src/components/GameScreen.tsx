import { useState } from 'react';
import { PHASE_LABELS } from '../data/reference';
import { nextPhase, phaseSequence, totalYears } from '../logic/rules';
import { useGame } from '../state/context';
import { CombatCalculator } from './CombatCalculator';
import { CreatureLineView } from './CreatureLine';
import { GameLog } from './GameLog';
import { ActionsPhase } from './phases/ActionsPhase';
import { CreaturePhase } from './phases/CreaturePhase';
import { EndYearPhase } from './phases/EndYearPhase';
import { HarvestPhase } from './phases/HarvestPhase';
import { StartPhase } from './phases/StartPhase';
import { WinterPhase } from './phases/WinterPhase';
import { Reference } from './Reference';
import { Panel, PlayerTag } from './ui';

type Tab = 'game' | 'combat' | 'creatures' | 'rules' | 'log';

export function GameScreen() {
  const { state, dispatch } = useGame();
  const [tab, setTab] = useState<Tab>('game');
  const m = state.config.modules;
  const years = totalYears(m);
  const seq = phaseSequence(m);
  const np = nextPhase(state.phase, m);
  const actionsBlocking = state.phase === 'actions' && !state.players.every((p) => p.passed);

  const nextLabel = np
    ? `${PHASE_LABELS[np]} →`
    : state.year >= years
      ? 'Décompte final →'
      : `Année ${state.year + 1} →`;

  const tabs: [Tab, string][] = [
    ['game', '🧭 Partie'],
    ['combat', '⚔️ Combat'],
    ...(m.creatures ? ([['creatures', `🐾 Créatures (${state.creatureLine.length})`]] as [Tab, string][]) : []),
    ['rules', '📜 Règles'],
    ['log', '📝 Journal'],
  ];

  return (
    <div className="game">
      <div className="year-bar">
        <div className="years">
          {Array.from({ length: years }, (_, i) => (
            <span key={i} className={`year ${i + 1 === state.year ? 'current' : ''} ${i + 1 < state.year ? 'past' : ''}`}>
              {i + 1}
            </span>
          ))}
        </div>
        <div className="phases">
          {seq.map((p) => (
            <span key={p} className={`phase ${p === state.phase ? 'current' : ''}`}>
              {PHASE_LABELS[p]}
            </span>
          ))}
        </div>
        <div className="first">
          Premier joueur : <PlayerTag index={state.firstPlayer} />
        </div>
      </div>

      <nav className="tabs">
        {tabs.map(([id, label]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>

      {tab === 'game' && (
        <>
          <h2>
            Année {state.year}/{years} — {PHASE_LABELS[state.phase]}
          </h2>
          {state.phase === 'start' && <StartPhase />}
          {state.phase === 'actions' && <ActionsPhase />}
          {state.phase === 'creatures' && <CreaturePhase />}
          {state.phase === 'harvest' && <HarvestPhase />}
          {state.phase === 'winter' && <WinterPhase />}
          {state.phase === 'end' && <EndYearPhase />}
          <div className="row end sticky-next">
            {actionsBlocking && <span className="muted small">Tous les joueurs doivent passer avant la suite.</span>}
            <button className="primary big" disabled={actionsBlocking} onClick={() => dispatch({ type: 'NEXT_PHASE' })}>
              {nextLabel}
            </button>
          </div>
        </>
      )}
      {tab === 'combat' && <CombatCalculator />}
      {tab === 'creatures' && (
        <Panel title="Ligne des créatures (activation de gauche à droite)">
          <CreatureLineView />
        </Panel>
      )}
      {tab === 'rules' && <Reference />}
      {tab === 'log' && <GameLog />}
    </div>
  );
}
