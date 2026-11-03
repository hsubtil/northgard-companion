import { useState } from 'react';
import { CARD_ACTIONS as RAW_CARD_ACTIONS, TURN_OPTIONS as RAW_TURN_OPTIONS } from '../../data/reference';
import { devCardKindForYear, upgradeCardsPerPlayer } from '../../logic/rules';
import { useGame } from '../../state/context';
import type { EnvTileId } from '../../types';
import { CombatCalculator } from '../CombatCalculator';
import { AddCreatureDialog, type ApparitionContext } from '../CreatureLine';
import { Modal, Panel, PlayerTag, Tip } from '../ui';
import { useGameData, useI18n } from '../../i18n';

type CardActionId = (typeof RAW_CARD_ACTIONS)[number]['id'];
type TurnChoice = (typeof RAW_TURN_OPTIONS)[number]['id'] | 'pass';

export function ActionsPhase() {
  const { state, dispatch } = useGame();
  const { t } = useI18n();
  const { CLANS, ENV_TILES, CARD_ACTIONS, TURN_OPTIONS } = useGameData();
  const [choice, setChoice] = useState<TurnChoice | null>(null);
  const [cardAction, setCardAction] = useState<CardActionId | null>(null);
  const [envTile, setEnvTile] = useState<EnvTileId | ''>('');
  const [apparition, setApparition] = useState<ApparitionContext | null>(null);
  const [combatOpen, setCombatOpen] = useState(false);
  const [passOpen, setPassOpen] = useState(false);

  const m = state.config.modules;
  const cur = state.current;
  const player = state.config.players[cur];
  const clan = CLANS[player.clan];
  const allPassed = state.players.every((p) => p.passed);
  const maxUpgrades = upgradeCardsPerPlayer(m);
  const upgradesLeft = maxUpgrades - state.players[cur].upgradesTaken;

  const reset = () => {
    setChoice(null);
    setCardAction(null);
    setEnvTile('');
  };

  const endTurn = () => {
    const rawAction = RAW_CARD_ACTIONS.find((a) => a.id === cardAction);
    const rawOption = RAW_TURN_OPTIONS.find((o) => o.id === choice);
    const actionText = choice === 'play' ? 'joue une carte ({action})' : '{action}';
    const actionValue = choice === 'play' ? rawAction?.label : rawOption?.label.replace(/^[A-E]\. /, '').toLowerCase();
    if (choice === 'upgrade') dispatch({ type: 'UPGRADE', player: cur });
    dispatch({
      type: 'END_TURN',
      player: cur,
      text: actionText,
      ...(actionValue ? { values: { action: actionValue }, translatedValues: ['action'] } : {}),
    });
    reset();
  };

  if (allPassed) {
    return (
      <Panel title={t('2. Actions')}>
        <Tip>{t('Tous les joueurs ont passé. Passez à la phase suivante.')}</Tip>
        <p>
          {t('Nouveau premier joueur :')} <PlayerTag index={state.firstPlayer} />
        </p>
      </Panel>
    );
  }

  return (
    <>
      <Panel title={t('2. Actions — ordre du tour')}>
        <div className="turn-strip">
          {state.config.players.map((_, i) => (
            <button
              key={i}
              className={`turn-chip ${i === cur ? 'current' : ''} ${state.players[i].passed ? 'passed' : ''}`}
              onClick={() => {
                if (!state.players[i].passed) {
                  dispatch({ type: 'SET_CURRENT', player: i });
                  reset();
                }
              }}
              title={t('Cliquer pour corriger le joueur actif')}
            >
              <PlayerTag index={i} showClan={false} />
              {state.players[i].passed && <span className="muted"> {t('a passé')}</span>}
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="current-turn" title={<>{t('▶ Tour de')} <PlayerTag index={cur} /></>}>
        <details className="clan-reminder">
          <summary>
            {clan.emoji} {t('Pouvoir de clan')}{m.warchiefs && ` & ${clan.warchief.name}`}
          </summary>
          <p>{clan.power}</p>
          {m.warchiefs && (
            <p>
              <strong>{clan.warchief.name}</strong> : {clan.warchief.power}
            </p>
          )}
        </details>

        {!choice && (
          <>
            <p>{t('Que fait {player} ?', { player: player.name })}</p>
            <div className="choice-grid">
              {TURN_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  className="choice"
                  disabled={o.id === 'upgrade' && upgradesLeft <= 0}
                  onClick={() => setChoice(o.id)}
                >
                  <span className="icon">{o.icon}</span>
                  {o.label}
                  {o.id === 'upgrade' && <span className="muted small"> ({t('{count} restante(s)', { count: upgradesLeft })})</span>}
                </button>
              ))}
              <button className="choice pass" onClick={() => setPassOpen(true)}>
                <span className="icon">✋</span>{t('F. Passer')}
              </button>
            </div>
            <p className="muted small">{t('Plus de carte en main → le joueur ne peut que passer.')}</p>
          </>
        )}

        {choice && choice !== 'play' && (
          <>
            <Tip>{TURN_OPTIONS.find((o) => o.id === choice)!.rule}</Tip>
            {choice === 'upgrade' && (
              <Tip kind="clan">
                {t('Cartes d’amélioration restantes pour {player} : {remaining}/{total}.', { player: player.name, remaining: upgradesLeft, total: maxUpgrades })}
              </Tip>
            )}
          </>
        )}

        {choice === 'play' && (
          <>
            <Tip>{TURN_OPTIONS[0].rule}</Tip>
            <p>{t('Quelle action principale montre la carte ?')}</p>
            <div className="choice-grid">
              {CARD_ACTIONS.map((a) => (
                <button key={a.id} className={`choice ${cardAction === a.id ? 'selected' : ''}`} onClick={() => setCardAction(a.id)}>
                  <span className="icon">{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
            {player.clan === 'snake' && (
              <Tip kind="clan">
                {t('🐍 Carte de Clan ? Avant de la résoudre, vous pouvez déplacer le jeton Terre brûlée dans un territoire neutre ou ennemi adjacent (la carte initiale permet de le faire avant ET après le Déplacement).')}
              </Tip>
            )}
            {cardAction && (
              <div className="action-help">
                <ul>
                  {CARD_ACTIONS.find((a) => a.id === cardAction)!.rules.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
                {cardAction === 'recruit' && <RecruitHints />}
                {cardAction === 'build' && <BuildHints />}
                {cardAction === 'move' && (
                  <>
                    <MoveHints />
                    <button onClick={() => setCombatOpen(true)}>{t('⚔️ Un combat a lieu → calculateur')}</button>
                  </>
                )}
                {cardAction === 'explore' && (
                  <div className="explore-help">
                    {m.creatures && (
                      <div className="question">
                        <span>{t('La tuile posée contient-elle un repaire de créature ?')}</span>
                        <button onClick={() => setApparition('explore')}>{t('🐾 Oui : une créature apparaît')}</button>
                      </div>
                    )}
                    {m.environmentTiles && (
                      <div className="question">
                        <span>{t('Est-ce une tuile Environnement ?')}</span>
                        <select value={envTile} onChange={(e) => setEnvTile(e.target.value as EnvTileId)}>
                          <option value="">{t('Non')}</option>
                          {m.envTiles.map((t) => (
                            <option key={t} value={t}>
                              {ENV_TILES[t].emoji} {ENV_TILES[t].name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {envTile && (
                      <Tip kind="module">
                        <strong>{ENV_TILES[envTile].name} :</strong> {ENV_TILES[envTile].rule}
                        {envTile === 'wyvernDen' && (
                          <div>
                            <button onClick={() => setApparition('den')}>{t('🐉 Placer la Wyverne')}</button>
                          </div>
                        )}
                      </Tip>
                    )}
                    <ExploreClanHints clanId={player.clan} />
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {choice && (
          <div className="row end">
            <button onClick={reset}>{t('Annuler')}</button>
            <button className="primary" disabled={choice === 'play' && !cardAction} onClick={endTurn}>
              {t('Fin du tour de {player} →', { player: player.name })}
            </button>
          </div>
        )}
      </Panel>

      {apparition && <AddCreatureDialog context={apparition} only={apparition === 'den' ? ['wyvern'] : undefined} onClose={() => setApparition(null)} />}
      {combatOpen && (
        <Modal title={t('Calculateur de combat')} wide onClose={() => setCombatOpen(false)}>
          <CombatCalculator attackerIndex={cur} />
        </Modal>
      )}
      {passOpen && <PassDialog onClose={() => setPassOpen(false)} onDone={reset} />}
    </>
  );
}

function PassDialog(props: { onClose: () => void; onDone: () => void }) {
  const { state, dispatch } = useGame();
  const { t } = useI18n();
  const [creature, setCreature] = useState(false);
  const [passed, setPassed] = useState(false);
  const m = state.config.modules;
  const [cur] = useState(state.current);
  const isFirst = state.firstPasser === null;
  const achievement = devCardKindForYear(state.year, m) === 'achievement';
  const canSpawn = m.creatures && m.moreCreatures && state.creatureLine.length < state.config.players.length;

  const confirm = () => {
    dispatch({ type: 'PASS', player: cur });
    setPassed(true);
    if (!canSpawn) {
      props.onDone();
      props.onClose();
    }
  };

  return (
    <Modal title={t('{player} passe', { player: state.config.players[cur].name })} onClose={props.onClose}>
      {!passed ? (
        <>
          <ol className="steps">
            <li>{t('Défaussez toutes les cartes restant en main ET toutes les cartes de la zone active.')}</li>
            <li>
              {t('Prenez une carte')} {achievement ? <strong>{t('Succès')}</strong> : <strong>{t('Développement')}</strong>} {t('parmi celles exposées et placez-la')} <strong>{t('SUR le dessus de votre pioche')}</strong>.
            </li>
            {isFirst && (
              <li>
                <strong>{t('Premier à passer : prenez le marqueur Premier joueur.')}</strong>
              </li>
            )}
            <li>{t('Vous ne jouerez plus pendant cette phase.')}</li>
          </ol>
          <div className="row end">
            <button className="primary" onClick={confirm}>
              {t('Confirmer')}
            </button>
          </div>
        </>
      ) : (
        <>
          <Tip kind="module">
            {t('Variante « Plus de créatures ! » : il y a {creatures} créature(s) pour {players} joueurs. Le joueur PEUT faire apparaître une créature.', { creatures: state.creatureLine.length, players: state.config.players.length })}
          </Tip>
          <div className="row end">
            <button
              onClick={() => {
                props.onDone();
                props.onClose();
              }}
            >
              {t('Non merci')}
            </button>
            <button className="primary" onClick={() => setCreature(true)}>
              🐾 {t('Faire apparaître')}
            </button>
          </div>
          {creature && (
            <AddCreatureDialog
              context="pass"
              onClose={() => {
                props.onDone();
                props.onClose();
              }}
            />
          )}
        </>
      )}
    </Modal>
  );
}

function RecruitHints() {
  const { state } = useGame();
  const { t } = useI18n();
  const m = state.config.modules;
  const clan = state.config.players[state.current].clan;
  return (
    <>
      {clan === 'bear' && <Tip kind="clan">{t('🐻 Kaija peut être recrutée comme une unité.')}</Tip>}
      {m.warchiefs && <Tip kind="module">{t('Chef de guerre mort ? Il peut être recruté à la place d’une unité.')}</Tip>}
      {state.creatureLine.some((c) => c.creatureId === 'brownBear') && (
        <Tip kind="warn">{t('Ours brun : impossible de recruter dans son territoire.')}</Tip>
      )}
    </>
  );
}

function BuildHints() {
  const { state } = useGame();
  const { t } = useI18n();
  const clan = state.config.players[state.current].clan;
  return (
    <>
      {clan === 'goat' && <Tip kind="clan">{t('🐐 Chèvre : +1 nourriture (petit bâtiment) ou +2 (grand).')}</Tip>}
      {state.creatureLine.some((c) => c.creatureId === 'brownBear') && (
        <Tip kind="warn">{t('Ours brun : impossible de construire dans son territoire.')}</Tip>
      )}
      <Tip>{t('Victoire : 3 territoires fermés avec chacun au moins un grand bâtiment en Fin d’année.')}</Tip>
    </>
  );
}

function MoveHints() {
  const { state } = useGame();
  const { t } = useI18n();
  const { ENV_TILES } = useGameData();
  const m = state.config.modules;
  const clan = state.config.players[state.current].clan;
  const line = state.creatureLine;
  return (
    <>
      {clan === 'bear' && <Tip kind="clan">{t('🐻 Kaija peut accompagner d’autres unités mais n’entre JAMAIS en territoire ennemi.')}</Tip>}
      {clan === 'wolf' && <Tip kind="clan">{t('🐺 Victoire en attaque : +1 nourriture.')}</Tip>}
      {clan === 'stag' && <Tip kind="clan">{t('🦌 Conquête d’un nouveau territoire par combat : +1 renommée.')}</Tip>}
      {m.creatures && (
        <Tip kind="module">
          {t('Créatures : on ne peut attaquer une créature que pendant un Déplacement, dans un territoire neutre ou ami ; au plus 1 créature par territoire partagé. Les 💀 du joueur ne comptent pas contre une créature. Le joueur à gauche lance le dé de la créature (💀/⚔️ → toujours 💀).')}
        </Tip>
      )}
      {line.some((c) => c.creatureId === 'brownBear') && <Tip kind="warn">{t('Ours brun : impossible de faire sortir des unités de son territoire.')}</Tip>}
      {line.some((c) => c.creatureId === 'fallenValkyrie' || c.creatureId === 'wyvern') && (
        <Tip kind="warn">{t('Valkyrie / Wyverne : entrer dans leur territoire arrête le mouvement et déclenche un combat.')}</Tip>
      )}
      {m.environmentTiles && m.envTiles.includes('swamp') && <Tip kind="module">{ENV_TILES.swamp.rule}</Tip>}
      {m.environmentTiles && <Tip kind="module">{t('Frontières infranchissables (orange) : jamais franchissables, même en retraite.')}</Tip>}
    </>
  );
}

function ExploreClanHints(props: { clanId: string }) {
  const { t } = useI18n();
  return (
    <>
      <Tip>{t('Territoire fermé que vous contrôlez : + renommée = nombre de tuiles de ce territoire.')}</Tip>
      {props.clanId === 'stag' && <Tip kind="clan">{t('🦌 Cerf : +1 renommée supplémentaire par territoire fermé.')}</Tip>}
      {props.clanId === 'raven' && <Tip kind="clan">{t('🐦‍⬛ Corbeau : collectez immédiatement les ressources des territoires fermés.')}</Tip>}
      {props.clanId === 'boar' && <Tip kind="clan">{t('🐗 Sanglier : aucun territoire fermé → +1 savoir.')}</Tip>}
    </>
  );
}
