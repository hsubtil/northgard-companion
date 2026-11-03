import { PHASE_LABELS } from '../data/reference';
import { useGame } from '../state/context';

export function GameLog() {
  const { state } = useGame();
  return (
    <div className="log">
      {state.log.length === 0 && <p className="muted">Le journal est vide.</p>}
      <ul>
        {state.log.map((e) => (
          <li key={e.id}>
            <span className="muted small">
              {e.phase === 'setup' ? 'Mise en place' : e.phase === 'final' ? 'Fin' : `A${e.year} · ${PHASE_LABELS[e.phase]}`}
            </span>{' '}
            {e.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
