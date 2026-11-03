import { useState } from 'react';
import { CREATURE_COLOR_LABEL, CREATURES } from '../data/creatures';
import { availableCreatures } from '../logic/rules';
import { useGame } from '../state/context';
import type { CreatureId } from '../types';
import { Modal, Tip } from './ui';

export type ApparitionContext = 'setup' | 'explore' | 'pass' | 'graveyard' | 'den' | 'hvedrung' | 'manual';

const CONTEXT_TEXT: Record<ApparitionContext, { reason: string; where: string; after: string }> = {
  setup: {
    reason: 'repaire en mise en place',
    where: 'Placez la figurine sur le repaire de la tuile posée.',
    after: 'Mise en place : la créature ne bouge pas et N’applique PAS son effet. Le joueur peut ensuite placer ses unités (même dans son territoire).',
  },
  explore: {
    reason: 'repaire exploré',
    where: 'Placez la figurine sur le repaire de la tuile explorée.',
    after: 'Elle ne bouge pas, mais s’active IMMÉDIATEMENT : appliquez son effet maintenant.',
  },
  pass: {
    reason: 'variante Plus de créatures',
    where: 'Le joueur choisit un territoire avec un repaire sans créature (s’il n’y en a pas : n’importe quel territoire sans créature).',
    after: 'Elle ne bouge pas, mais s’active normalement : appliquez son effet.',
  },
  graveyard: {
    reason: 'Cimetière ancestral',
    where: 'Le propriétaire du Cimetière la place sur n’importe quel territoire avec au moins un repaire.',
    after: 'Sa carte va à la fin de la ligne : elle s’activera pendant cette phase Créatures.',
  },
  den: {
    reason: 'Antre de la Wyverne exploré',
    where: 'Placez la Wyverne sur son Antre.',
    after: 'Sa carte va à la fin de la ligne de créatures.',
  },
  hvedrung: {
    reason: 'invoquée par Hvedrung',
    where: 'Placez la figurine dans le territoire de Hvedrung ; la carte va JUSTE APRÈS Hvedrung.',
    after: 'Appliquez son effet d’apparition, puis elle s’activera juste après Hvedrung.',
  },
  manual: {
    reason: 'ajout manuel',
    where: 'Placez la figurine selon l’effet en cours.',
    after: '',
  },
};

export function AddCreatureDialog(props: {
  context: ApparitionContext;
  afterUid?: string;
  only?: CreatureId[];
  onClose: () => void;
}) {
  const { state, dispatch } = useGame();
  const ctx = CONTEXT_TEXT[props.context];
  const options = props.only ?? availableCreatures(state.config.modules).filter((id) => CREATURES[id].source !== 'wildernessEnv');
  const freeColors = (id: CreatureId) =>
    CREATURES[id].colors.filter((c) => !state.creatureLine.some((l) => l.creatureId === id && l.color === c));
  const [added, setAdded] = useState<CreatureId | null>(null);

  if (added) {
    const info = CREATURES[added];
    return (
      <Modal title={`${info.emoji} ${info.name} apparaît !`} onClose={props.onClose}>
        <ol className="steps">
          <li>{ctx.where}</li>
          <li>
            <strong>Effet :</strong> {info.power}
          </li>
          {ctx.after && <li>{ctx.after}</li>}
        </ol>
        {info.notes?.map((n) => (
          <Tip key={n}>{n}</Tip>
        ))}
        <div className="row end">
          <button className="primary" onClick={props.onClose}>
            OK
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Apparition d’une créature" onClose={props.onClose}>
      <p>Piochez la carte du dessus de la pioche Créature (si elle est vide, mélangez la défausse). Quelle créature est révélée ?</p>
      <div className="creature-pick">
        {options.map((id) => {
          const colors = freeColors(id);
          return (
            <div key={id} className="creature-option">
              <span>
                {CREATURES[id].emoji} <strong>{CREATURES[id].name}</strong>
              </span>
              <span className="row">
                {colors.length === 0 && <span className="muted">toutes en jeu</span>}
                {colors.map((c) => (
                  <button
                    key={c}
                    className={`swatch ${c}`}
                    onClick={() => {
                      dispatch({ type: 'ADD_CREATURE', creatureId: id, color: c, afterUid: props.afterUid, reason: ctx.reason });
                      setAdded(id);
                    }}
                  >
                    {CREATURE_COLOR_LABEL[c]}
                  </button>
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

export function CreatureLineView(props: { compact?: boolean; showActivation?: boolean }) {
  const { state, dispatch } = useGame();
  const [adding, setAdding] = useState(false);
  const line = state.creatureLine;
  return (
    <div className="creature-line">
      {line.length === 0 && <p className="muted">Aucune créature sur la carte.</p>}
      <ol>
        {line.map((c, i) => {
          const info = CREATURES[c.creatureId];
          const done = state.activated.includes(c.uid);
          return (
            <li key={c.uid} className={`creature ${done && props.showActivation ? 'activated' : ''}`}>
              <div className="creature-head">
                <span className={`swatch-dot ${c.color}`} title={CREATURE_COLOR_LABEL[c.color]} />
                <strong>
                  {i + 1}. {info.emoji} {info.name}
                </strong>
                <span className="muted">({CREATURE_COLOR_LABEL[c.color]})</span>
                {info.combatValue && <span className="badge">⚔️ {info.combatValue}</span>}
                {info.fame && <span className="badge">⭐ {info.fame}</span>}
                {!info.sharesTerritory && <span className="badge warn">ne partage pas</span>}
                <span className="spacer" />
                {!props.compact && (
                  <>
                    <button className="ghost" title="Vers la gauche" onClick={() => dispatch({ type: 'MOVE_CREATURE', uid: c.uid, delta: -1 })}>
                      ◀
                    </button>
                    <button className="ghost" title="Vers la droite" onClick={() => dispatch({ type: 'MOVE_CREATURE', uid: c.uid, delta: 1 })}>
                      ▶
                    </button>
                  </>
                )}
                <button
                  className="ghost danger"
                  title="Créature vaincue / retirée"
                  onClick={() =>
                    dispatch({
                      type: 'REMOVE_CREATURE',
                      uid: c.uid,
                      reason:
                        c.creatureId === 'spectralWarrior' || c.creatureId === 'wyvern'
                          ? 'vaincue — retirée du jeu'
                          : 'vaincue — carte dans la défausse Créature',
                    })
                  }
                >
                  ✝
                </button>
              </div>
              {!props.compact && <p className="small">{info.power}</p>}
            </li>
          );
        })}
      </ol>
      {!props.compact && (
        <button onClick={() => setAdding(true)} disabled={!state.config.modules.creatures}>
          + Ajouter une créature
        </button>
      )}
      {adding && <AddCreatureDialog context="manual" only={availableCreatures(state.config.modules)} onClose={() => setAdding(false)} />}
    </div>
  );
}
