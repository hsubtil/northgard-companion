import { devCardKindForYear, totalYears } from '../../logic/rules';
import { useGame } from '../../state/context';
import { Check, Panel, PlayerTag, Tip } from '../ui';
import { useGameData, useI18n } from '../../i18n';

export function StartPhase() {
  const { state } = useGame();
  const { t } = useI18n();
  const { DEV_KIND_LABEL } = useGameData();
  const m = state.config.modules;
  const n = state.config.players.length;
  const kind = devCardKindForYear(state.year, m);
  const last = state.year === totalYears(m);
  return (
    <Panel title={t('1. Début de l’année')}>
      {last && <Tip kind="warn">{t('⚠️ Dernière année ! Les cartes Succès remplacent les cartes Développement.')}</Tip>}
      <Check checkKey="draw">
        {t('Chaque joueur pioche')} <strong>4 {t('cartes')}</strong> {t('(+1 par Forge contrôlée). Pioche vide → mélangez la défausse pour en former une nouvelle.')}
      </Check>
      <div className="row wrap indent">
        {state.config.players.map((_, i) => (
          <PlayerTag key={i} index={i} />
        ))}
      </div>
      <Check checkKey="dev">
        <PlayerTag index={state.firstPlayer} showClan={false} /> ({t('premier joueur')}){' '}
        {kind === 'achievement' ? (
          <>
            {t('laisse les')} <strong>{n} {t('cartes Succès')}</strong> {t('visibles : elles remplacent les Développements cette année.')}
          </>
        ) : (
          <>
            {t('révèle')} <strong>{n} {t('cartes')}</strong> {t('de la pioche Développement')} (<em>{DEV_KIND_LABEL[kind]}</em>) {t('à côté de la pioche.')}
          </>
        )}
      </Check>
    </Panel>
  );
}
