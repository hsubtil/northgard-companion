import { WINTER_COSTS } from '../../data/reference';
import { orderFrom, winterCost } from '../../logic/rules';
import { useGame } from '../../state/context';
import { Check, NumberField, Panel, PlayerTag, Tip } from '../ui';

export function WinterPhase() {
  const { state, dispatch } = useGame();
  const order = orderFrom(state.firstPlayer, state.config.players.length);
  const m = state.config.modules;

  return (
    <Panel title="4. Hiver">
      <p>En commençant par le premier joueur, chaque joueur paie selon le nombre d’unités qu’il a sur la carte :</p>
      <table className="winter-table">
        <thead>
          <tr>
            <th>Unités</th>
            {WINTER_COSTS.map((r) => (
              <th key={r.min}>{r.max === Infinity ? `${r.min}+` : `${r.min}-${r.max}`}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th>Coût</th>
            {WINTER_COSTS.map((r) => (
              <td key={r.min}>{formatCost(r.food, r.wood)}</td>
            ))}
          </tr>
        </tbody>
      </table>
      {state.config.players.some((p) => p.clan === 'bear') && <Tip kind="clan">🐻 Kaija ne compte pas dans le total d’unités.</Tip>}
      {m.warchiefs && <Tip kind="module">Le chef de guerre compte comme une unité.</Tip>}

      <div className="winter-players">
        {order.map((p) => {
          const units = state.players[p].units;
          const cost = winterCost(units);
          return (
            <div key={p} className="winter-row">
              <PlayerTag index={p} />
              <NumberField label="Unités" value={units} onChange={(v) => dispatch({ type: 'SET_UNITS', player: p, units: v })} max={20} />
              <span className="cost">{formatCost(cost.food, cost.wood)}</span>
              <Check checkKey={`winter-${p}`}>Payé</Check>
              <button onClick={() => dispatch({ type: 'ADD_UNREST', player: p })} title="Paie ce qu’il peut et prend une carte Troubles">
                😡 Ne peut pas payer
              </button>
              {state.players[p].unrest > 0 && <span className="badge warn">Troubles : {state.players[p].unrest}</span>}
            </div>
          );
        })}
      </div>
      <Tip>
        Si un joueur ne peut pas payer : il paie ce qu’il peut et place une carte Troubles <strong>sur sa pioche</strong> (−5
        renommée en fin de partie, aucun effet, jamais retirable). Cartes Troubles restantes : {state.unrestLeft}/10.
      </Tip>
    </Panel>
  );
}

function formatCost(food: number, wood: number): string {
  if (!food && !wood) return 'Rien';
  return [food ? `${food} 🍎` : '', wood ? `${wood} 🪵` : ''].filter(Boolean).join(' + ');
}
