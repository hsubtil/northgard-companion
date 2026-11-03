import { orderFrom } from '../../logic/rules';
import { useGame } from '../../state/context';
import { Check, Panel, PlayerTag, Tip } from '../ui';
import { useGameData, useI18n } from '../../i18n';

export function HarvestPhase() {
  const { state } = useGame();
  const { t } = useI18n();
  const { ENV_TILES } = useGameData();
  const m = state.config.modules;
  const order = orderFrom(state.firstPlayer, state.config.players.length);
  const env = m.environmentTiles ? m.envTiles : [];
  const line = state.creatureLine;
  const hasSnake = state.config.players.some((p) => p.clan === 'snake');

  return (
    <Panel title={t('3. Récolte')}>
      <p>{t('En commençant par le premier joueur, chaque joueur :')}</p>
      <div className="harvest-rules">
        <div>
          <strong>{t('A. Renommée des territoires fermés contrôlés')}</strong>
          <ul>
            <li>{t('Territoire fermé de 1 tuile : 0')}</li>
            <li>{t('Territoire fermé de 2 tuiles : ⭐ 1')}</li>
            <li>{t('Territoire fermé de 3 tuiles ou plus : ⭐ 2')}</li>
          </ul>
        </div>
        <div>
          <strong>{t('B. Ressources et renommée')}</strong>
          <ul>
            <li>{t('⭐ 3 par Autel des Rois')}</li>
            <li>{t('1 nourriture / bois / savoir par icône sur les territoires contrôlés et leurs bâtiments')}</li>
          </ul>
        </div>
        <div>
          <strong>{t('C. Échange')}</strong>
          <ul>
            <li>{t('3 ressources quelconques → 1 ressource au choix (réserve)')}</li>
            {m.teamPlay && <li>{t('Équipes : échanges 1:1 entre coéquipiers')}</li>}
            <li>{t('Les jetons de renommée restent face cachée.')}</li>
          </ul>
        </div>
      </div>

      {line.some((c) => c.creatureId === 'wolf') && (
        <Tip kind="warn">{t('🐺 Loup (créature) : son territoire ne rapporte ni renommée ni ressources, sauf celles des bâtiments.')}</Tip>
      )}
      {line.some((c) => c.creatureId === 'spectralWarrior') && (
        <Tip kind="warn">{t('👻 Guerrier spectral : les bâtiments de son territoire ne produisent rien.')}</Tip>
      )}
      {hasSnake && (
        <Tip kind="clan">
          {t('🐍 Serpent : si la Terre brûlée est dans un territoire ennemi, il peut y prendre 1 ressource (y compris d’un bâtiment) à la place du propriétaire.')}
        </Tip>
      )}

      <div className="per-player">
        {order.map((p) => (
          <Check key={p} checkKey={`harvest-${p}`}>
            <PlayerTag index={p} /> {t('a récolté (A, B, C)')}
          </Check>
        ))}
      </div>

      {env.filter((t) => ENV_TILES[t].phases.includes('harvest')).length > 0 && (
        <>
          <h4>{t('Tuiles Environnement')}</h4>
          {env
            .filter((t) => ENV_TILES[t].phases.includes('harvest') && t !== 'poisonousSwamp')
            .map((t) => (
              <Check key={t} checkKey={`env-${t}`}>
                {ENV_TILES[t].emoji} <strong>{ENV_TILES[t].name}</strong> (si en jeu) : {ENV_TILES[t].rule}
              </Check>
            ))}
          {env.includes('poisonousSwamp') && (
            <Check checkKey="env-poisonousSwamp">
              {ENV_TILES.poisonousSwamp.emoji} <strong>{t('Fin de Récolte — Marais empoisonné')}</strong> {t('(si en jeu) :')}{' '}
              {ENV_TILES.poisonousSwamp.rule}
            </Check>
          )}
        </>
      )}
    </Panel>
  );
}
