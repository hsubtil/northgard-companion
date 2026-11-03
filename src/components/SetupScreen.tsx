import { useState } from 'react';
import { buildSetupSteps } from '../logic/setup';
import { orderFrom } from '../logic/rules';
import { useGame } from '../state/context';
import { AddCreatureDialog, CreatureLineView } from './CreatureLine';
import { Panel, PlayerTag, Tip } from './ui';

export function SetupScreen() {
  const { state, dispatch } = useGame();
  const [addingCreature, setAddingCreature] = useState(false);
  const steps = buildSetupSteps(state.config, state.firstPlayer);
  const n = state.config.players.length;
  const doneCount = steps.filter((s) => state.setupDone.includes(s.id)).length;
  const nextStep = steps.find((s) => !state.setupDone.includes(s.id));

  return (
    <div className="setup">
      <div className="row between">
        <h2>Mise en place ({doneCount}/{steps.length})</h2>
        <button onClick={() => dispatch({ type: 'BACK_TO_CONFIG' })}>← Modifier la configuration</button>
      </div>
      <div className="progress">
        <div style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      {steps.map((s) => {
        const done = state.setupDone.includes(s.id);
        const isNext = nextStep?.id === s.id;
        return (
          <Panel
            key={s.id}
            className={`setup-step ${done ? 'done' : ''} ${isNext ? 'current' : ''}`}
            title={
              <label className="check">
                <input type="checkbox" checked={done} onChange={() => dispatch({ type: 'TOGGLE_SETUP', id: s.id })} />
                <span>
                  <span className="letter">{s.letter}</span> {s.title}
                  {s.module && <span className="badge">{s.module}</span>}
                </span>
              </label>
            }
          >
            {(!done || isNext) && (
              <>
                <ul>
                  {s.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
                {s.interactive === 'firstPlayer' && (
                  <div className="row wrap">
                    <span>Premier joueur :</span>
                    {state.config.players.map((_, i) => (
                      <button
                        key={i}
                        className={state.firstPlayer === i ? 'primary' : ''}
                        onClick={() => dispatch({ type: 'SET_FIRST_PLAYER', player: i })}
                      >
                        <PlayerTag index={i} showClan={false} />
                      </button>
                    ))}
                    <button onClick={() => dispatch({ type: 'SET_FIRST_PLAYER', player: Math.floor(Math.random() * n) })}>
                      🎲 Tirage au sort
                    </button>
                  </div>
                )}
                {s.interactive === 'tilePlacement' && (
                  <>
                    <div className="placement-order">
                      {[1, 2].map((round) => (
                        <div key={round}>
                          <strong>Tour {round} :</strong>{' '}
                          {orderFrom(state.firstPlayer, n).map((p) => (
                            <PlayerTag key={p} index={p} showClan={false} />
                          ))}
                        </div>
                      ))}
                    </div>
                    {state.config.modules.creatures && (
                      <>
                        <Tip kind="module">Une tuile avec un repaire a été posée ? Enregistrez la créature apparue :</Tip>
                        <button onClick={() => setAddingCreature(true)}>🐾 Une créature apparaît</button>
                        <CreatureLineView compact />
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </Panel>
        );
      })}
      {doneCount < steps.length && <Tip kind="warn">Toutes les étapes ne sont pas cochées — vous pouvez quand même commencer.</Tip>}
      <div className="row end">
        <button className="primary big" onClick={() => dispatch({ type: 'START_GAME' })}>
          Commencer l’année 1 →
        </button>
      </div>
      {addingCreature && <AddCreatureDialog context="setup" onClose={() => setAddingCreature(false)} />}
    </div>
  );
}
