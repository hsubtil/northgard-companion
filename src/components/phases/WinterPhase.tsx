import { orderFrom, winterCost } from '../../logic/rules';
import { useGame } from '../../state/context';
import { Check, NumberField, Panel, PlayerTag, Tip } from '../ui';
import { useGameData, useI18n } from '../../i18n';

export function WinterPhase() {
  const { state, dispatch } = useGame();
  const { t } = useI18n();
  const { WINTER_COSTS } = useGameData();
  const order = orderFrom(state.firstPlayer, state.config.players.length);
  const m = state.config.modules;

  return (
    <Panel title={t('4. Hiver')}>
      <p>{t('En commençant par le premier joueur, chaque joueur paie selon le nombre d’unités qu’il a sur la carte :')}</p>
      <table className="winter-table">
        <thead>
          <tr>
            <th>{t('Unités')}</th>
            {WINTER_COSTS.map((r) => (
              <th key={r.min}>{r.max === Infinity ? `${r.min}+` : `${r.min}-${r.max}`}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>{t('Coût')}</th>
            {WINTER_COSTS.map((r) => (
              <td key={r.min}>{formatCost(r.food, r.wood, t)}</td>
            ))}
          </tr>
        </tbody>
      </table>
      {state.config.players.some((p) => p.clan === 'bear') && <Tip kind="clan">{t('🐻 Kaija ne compte pas dans le total d’unités.')}</Tip>}
      {m.warchiefs && <Tip kind="module">{t('Le chef de guerre compte comme une unité.')}</Tip>}

      <div className="winter-players">
        {order.map((p) => {
          const units = state.players[p].units;
          const cost = winterCost(units);
          return (
            <div key={p} className="winter-row">
              <PlayerTag index={p} />
              <NumberField label={t('Unités')} value={units} onChange={(v) => dispatch({ type: 'SET_UNITS', player: p, units: v })} max={20} />
              <span className="cost">{formatCost(cost.food, cost.wood, t)}</span>
              <Check checkKey={`winter-${p}`}>{t('Payé')}</Check>
              <button onClick={() => dispatch({ type: 'ADD_UNREST', player: p })} title={t('Paie ce qu’il peut et prend une carte Troubles')}>
                😡 {t('Ne peut pas payer')}
              </button>
              {state.players[p].unrest > 0 && <span className="badge warn">{t('Troubles : {count}', { count: state.players[p].unrest })}</span>}
            </div>
          );
        })}
      </div>
      <Tip>
        {t('Si un joueur ne peut pas payer : il paie ce qu’il peut et place une carte Troubles')} <strong>{t('sur sa pioche')}</strong> {t('(−5 renommée en fin de partie, aucun effet, jamais retirable). Cartes Troubles restantes : {left}/10.', { left: state.unrestLeft })}
      </Tip>
    </Panel>
  );
}

function formatCost(food: number, wood: number, t: ReturnType<typeof useI18n>['t']): string {
  if (!food && !wood) return t('Rien');
  return [food ? `${food} 🍎` : '', wood ? `${wood} 🪵` : ''].filter(Boolean).join(' + ');
}
