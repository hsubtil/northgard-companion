import { useState } from 'react';
import { useGame } from '../state/context';
import { NumberField, Panel, PlayerTag, Tip } from './ui';
import { translateEndReason, useI18n } from '../i18n';

interface ScoreInput {
  tokens: number;
  resources: number;
  cards: number;
  unrest: number;
}

export function FinalScore() {
  const { state, dispatch } = useGame();
  const { language, t } = useI18n();
  const players = state.config.players;
  const [inputs, setInputs] = useState<ScoreInput[]>(() =>
    state.players.map((p) => ({ tokens: 0, resources: 0, cards: 0, unrest: p.unrest })),
  );
  const total = (s: ScoreInput) => s.tokens + Math.floor(s.resources / 3) + s.cards - 5 * s.unrest;
  const update = (i: number, patch: Partial<ScoreInput>) => setInputs((xs) => xs.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const ranking = players.map((_, i) => i).sort((a, b) => total(inputs[b]) - total(inputs[a]));
  const team = state.config.modules.teamPlay;

  return (
    <div className="final">
      <h2>🏁 {t('Fin de la partie')}</h2>
      {state.endReason && <Tip kind="warn">{translateEndReason(state, language)}</Tip>}
      <Tip>
        {t('Une victoire par 3 territoires fermés avec grand bâtiment l’emporte toujours sur la renommée. Sinon, calculez la renommée :')}
      </Tip>
      <div className="score-grid">
        {players.map((_, i) => (
          <Panel key={i} title={<PlayerTag index={i} />}>
            <NumberField label={t('Jetons de renommée')} value={inputs[i].tokens} onChange={(v) => update(i, { tokens: v })} max={999} />
            <NumberField
              label={t('Ressources restantes (1 ⭐ / 3)')}
              value={inputs[i].resources}
              onChange={(v) => update(i, { resources: v })}
              max={999}
            />
            <NumberField
              label={t('Valeur des cartes Développement + Succès')}
              value={inputs[i].cards}
              onChange={(v) => update(i, { cards: v })}
              max={999}
            />
            <NumberField label={t('Cartes Troubles (−5 chacune)')} value={inputs[i].unrest} onChange={(v) => update(i, { unrest: v })} />
            <div className="total">
              {t('Total :')} <strong>{total(inputs[i])}</strong> ⭐
            </div>
          </Panel>
        ))}
      </div>
      <Panel title={t('Classement')}>
        {team ? (
          <ol>
            {[
              [0, 2],
              [1, 3],
            ]
              .map((t) => ({ t, score: total(inputs[t[0]]) + total(inputs[t[1]]) }))
              .sort((a, b) => b.score - a.score)
              .map(({ t, score }) => (
                <li key={t.join()}>
                  <PlayerTag index={t[0]} showClan={false} /> & <PlayerTag index={t[1]} showClan={false} /> : {score} ⭐
                </li>
              ))}
          </ol>
        ) : (
          <ol>
            {ranking.map((i) => (
              <li key={i}>
                <PlayerTag index={i} /> : {total(inputs[i])} ⭐
              </li>
            ))}
          </ol>
        )}
        <p className="muted small">
          {t('Égalité : le plus de territoires contrôlés (ouverts ou fermés), puis le plus d’unités sur la carte, puis le plus de bâtiments.')}
        </p>
      </Panel>
      <div className="row end">
        <button onClick={() => dispatch({ type: 'RESUME_GAME' })}>← {t('Revenir à la partie')}</button>
      </div>
    </div>
  );
}
