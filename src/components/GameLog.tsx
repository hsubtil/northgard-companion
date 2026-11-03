import { useGame } from '../state/context';
import { translateLog, useGameData, useI18n } from '../i18n';

export function GameLog() {
  const { state } = useGame();
  const { language, t } = useI18n();
  const { PHASE_LABELS } = useGameData();
  return (
    <div className="log">
      {state.log.length === 0 && <p className="muted">{t('Le journal est vide.')}</p>}
      <ul>
        {state.log.map((e) => (
          <li key={e.id}>
            <span className="muted small">
              {e.phase === 'setup' ? t('Mise en place') : e.phase === 'final' ? t('Fin') : t('A{year} · {phase}', { year: e.year, phase: PHASE_LABELS[e.phase] })}
            </span>{' '}
            {translateLog(e, language)}
          </li>
        ))}
      </ul>
    </div>
  );
}
