import { totalYears, victoryTerritoriesNeeded } from '../../logic/rules';
import { useGame } from '../../state/context';
import { Check, Panel, PlayerTag, Tip } from '../ui';
import { useGameData, useI18n } from '../../i18n';

export function EndYearPhase() {
  const { state, dispatch } = useGame();
  const { t } = useI18n();
  const { ENV_TILES } = useGameData();
  const m = state.config.modules;
  const needed = victoryTerritoriesNeeded(m);
  const last = state.year >= totalYears(m);

  return (
    <Panel title={t('5. Fin de l’année')}>
      <h4>{t('A. Conditions de fin de partie')}</h4>
      {needed !== null ? (
        <>
          <Check checkKey="victory">
            {t('Un')} {m.teamPlay ? t('équipe') : t('joueur')} {t('contrôle-t-il au moins')} <strong>{needed} {t('territoires fermés')}</strong> {t('contenant chacun au moins un')} <strong>{t('grand bâtiment')}</strong> ({t('Autel des Rois, Forge, Forteresse')})?
          </Check>
          <div className="row wrap indent">
            {state.config.players.map((_, i) => (
              <button
                key={i}
                onClick={() => dispatch({ type: 'END_GAME', reason: '{player} remplit la condition de victoire immédiate.', values: { player: state.config.players[i].name } })}
              >
                🏆 <PlayerTag index={i} showClan={false} /> {t('l’a fait')}
              </button>
            ))}
          </div>
          <p className="muted small">
            {t('Plusieurs joueurs en même temps ? Départage : renommée, puis territoires contrôlés, puis unités sur la carte, puis bâtiments.')}
          </p>
        </>
      ) : (
        <Tip>{t('Partie longue : pas de victoire immédiate, seule la renommée compte.')}</Tip>
      )}
      {last && <Tip kind="warn">{t('Dernière année : la partie se termine. Passez au décompte final.')}</Tip>}

      {m.environmentTiles && m.envTiles.includes('geyser') && (
        <Check checkKey="geyser">
          ♨️ <strong>Geyser</strong> : {ENV_TILES.geyser.rule}
        </Check>
      )}

      <h4>{t('B. Seconde chance')}</h4>
      <Check checkKey="second">
        {t('Un joueur n’a plus d’unité sur la carte ? Il place 3 nouvelles unités dans un territoire neutre (s’il n’y en a pas : il pioche et place une tuile pour en créer un).')}
      </Check>

      <h4>{t('C. Jeton Année')}</h4>
      <Check checkKey="year">{t('Avancez le jeton Année d’une case.')}</Check>
      <p>
        {t('Premier joueur de l’année prochaine :')} <PlayerTag index={state.firstPlayer} />
      </p>
    </Panel>
  );
}
