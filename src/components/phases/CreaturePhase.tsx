import { useState } from 'react';
import { CREATURE_COLOR_LABEL, CREATURE_MOVE_RULES, CREATURE_PRIORITIES, CREATURES } from '../../data/creatures';
import { ENV_TILES } from '../../data/environment';
import { useGame } from '../../state/context';
import type { CreatureId } from '../../types';
import { CombatCalculator } from '../CombatCalculator';
import { AddCreatureDialog, type ApparitionContext } from '../CreatureLine';
import { Check, Modal, Panel, PlayerTag, Tip } from '../ui';

const ATTACKING_CREATURES: CreatureId[] = ['fallenValkyrie', 'wyvern', 'draugrJotunn'];

export function CreaturePhase() {
  const { state, dispatch } = useGame();
  const m = state.config.modules;
  const [dialog, setDialog] = useState<{ ctx: ApparitionContext; after?: string; only?: 'spectralWarrior' } | null>(null);
  const [combatUid, setCombatUid] = useState<string | null>(null);
  const graveyard = m.environmentTiles && m.envTiles.includes('ancestralGraveyard');
  const next = state.creatureLine.find((c) => !state.activated.includes(c.uid));

  return (
    <>
      <Panel title="2.5 Phase des Créatures">
        {graveyard && (
          <div className="question">
            <Check checkKey="graveyard">
              ⚰️ Début de phase : le propriétaire du territoire du <strong>Cimetière ancestral</strong> peut placer un Guerrier
              spectral.
            </Check>
            <button onClick={() => setDialog({ ctx: 'graveyard', only: 'spectralWarrior' })}>👻 Placer un Guerrier spectral</button>
            <p className="muted small">{ENV_TILES.ancestralGraveyard.rule}</p>
          </div>
        )}
        <details>
          <summary>📜 Règles de déplacement des créatures</summary>
          <ul>
            {CREATURE_MOVE_RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <p>Priorités possibles (dans l’ordre indiqué sur la carte) :</p>
          <ul>
            {CREATURE_PRIORITIES.map((p) => (
              <li key={p.label}>
                {p.icon} {p.label}
              </li>
            ))}
          </ul>
          <p>
            Égalité persistante : <PlayerTag index={state.firstPlayer} showClan={false} /> (premier joueur) choisit.
          </p>
        </details>
        {state.creatureLine.length === 0 && <Tip>Aucune créature sur la carte : rien à activer.</Tip>}
        {state.creatureLine.length > 0 && <p>Activez les créatures une par une, de gauche à droite :</p>}
        <ol className="creature-activation">
          {state.creatureLine.map((c, i) => {
            const info = CREATURES[c.creatureId];
            const done = state.activated.includes(c.uid);
            const isNext = next?.uid === c.uid;
            return (
              <li key={c.uid} className={`${done ? 'activated' : ''} ${isNext ? 'current' : ''}`}>
                <div className="creature-head">
                  <span className={`swatch-dot ${c.color}`} />
                  <strong>
                    {i + 1}. {info.emoji} {info.name}
                  </strong>
                  <span className="muted">({CREATURE_COLOR_LABEL[c.color]})</span>
                </div>
                {(isNext || !done) && (
                  <ol className="steps">
                    <li>
                      <strong>Déplacement :</strong>{' '}
                      {c.creatureId === 'wyvern'
                        ? 'tous les territoires lui sont adjacents : elle va vers un territoire avec unités et sans créature, selon ses priorités.'
                        : 'vers un territoire adjacent sans créature, avec unités de préférence, selon les priorités de la carte (sinon elle reste).'}
                    </li>
                    <li>
                      <strong>Effet :</strong> {info.power}
                    </li>
                  </ol>
                )}
                <div className="row wrap">
                  {c.creatureId === 'hvedrung' && !done && (
                    <button onClick={() => setDialog({ ctx: 'hvedrung', after: c.uid })}>🧙 Hvedrung invoque une créature</button>
                  )}
                  {ATTACKING_CREATURES.includes(c.creatureId) && !done && (
                    <button onClick={() => setCombatUid(c.uid)}>⚔️ Elle attaque → calculateur</button>
                  )}
                  <button className={done ? '' : 'primary'} onClick={() => dispatch({ type: 'TOGGLE_ACTIVATED', uid: c.uid })}>
                    {done ? '↺ Annuler' : '✓ Activée'}
                  </button>
                  <button
                    className="ghost danger"
                    onClick={() =>
                      dispatch({
                        type: 'REMOVE_CREATURE',
                        uid: c.uid,
                        reason: info.source === 'wildernessEnv' ? 'vaincue — retirée du jeu' : 'vaincue — carte dans la défausse',
                      })
                    }
                  >
                    ✝ Vaincue
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
        {state.creatureLine.length > 0 && !next && <Tip>Toutes les créatures ont été activées.</Tip>}
      </Panel>
      {dialog && (
        <AddCreatureDialog
          context={dialog.ctx}
          afterUid={dialog.after}
          only={dialog.only ? [dialog.only] : undefined}
          onClose={() => setDialog(null)}
        />
      )}
      {combatUid && (
        <Modal title="Combat contre une créature" wide onClose={() => setCombatUid(null)}>
          <CombatCalculator attackerCreatureUid={combatUid} attackerIndex={state.firstPlayer} />
        </Modal>
      )}
    </>
  );
}
