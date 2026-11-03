import { useState } from 'react';
import { CLANS } from '../../data/clans';
import { ENV_TILES } from '../../data/environment';
import { CARD_ACTIONS, TURN_OPTIONS } from '../../data/reference';
import { devCardKindForYear, upgradeCardsPerPlayer } from '../../logic/rules';
import { useGame } from '../../state/context';
import type { EnvTileId } from '../../types';
import { CombatCalculator } from '../CombatCalculator';
import { AddCreatureDialog, type ApparitionContext } from '../CreatureLine';
import { Modal, Panel, PlayerTag, Tip } from '../ui';

type CardActionId = (typeof CARD_ACTIONS)[number]['id'];
type TurnChoice = (typeof TURN_OPTIONS)[number]['id'] | 'pass';

export function ActionsPhase() {
  const { state, dispatch } = useGame();
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
    const opt = TURN_OPTIONS.find((o) => o.id === choice);
    const act = CARD_ACTIONS.find((a) => a.id === cardAction);
    const text = choice === 'play' ? `joue une carte${act ? ` (${act.label})` : ''}` : (opt?.label.replace(/^[A-E]\. /, '').toLowerCase() ?? 'joue');
    if (choice === 'upgrade') dispatch({ type: 'UPGRADE', player: cur });
    dispatch({ type: 'END_TURN', player: cur, text });
    reset();
  };

  if (allPassed) {
    return (
      <Panel title="2. Actions">
        <Tip>Tous les joueurs ont passé. Passez à la phase suivante.</Tip>
        <p>
          Nouveau premier joueur : <PlayerTag index={state.firstPlayer} />
        </p>
      </Panel>
    );
  }

  return (
    <>
      <Panel title="2. Actions — ordre du tour">
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
              title="Cliquer pour corriger le joueur actif"
            >
              <PlayerTag index={i} showClan={false} />
              {state.players[i].passed && <span className="muted"> a passé</span>}
            </button>
          ))}
        </div>
      </Panel>

      <Panel className="current-turn" title={<>▶ Tour de <PlayerTag index={cur} /></>}>
        <details className="clan-reminder">
          <summary>
            {clan.emoji} Pouvoir de clan{m.warchiefs && ` & ${clan.warchief.name}`}
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
            <p>Que fait {player.name} ?</p>
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
                  {o.id === 'upgrade' && <span className="muted small"> ({upgradesLeft} restante(s))</span>}
                </button>
              ))}
              <button className="choice pass" onClick={() => setPassOpen(true)}>
                <span className="icon">✋</span>F. Passer
              </button>
            </div>
            <p className="muted small">Plus de carte en main → le joueur ne peut que passer.</p>
          </>
        )}

        {choice && choice !== 'play' && (
          <>
            <Tip>{TURN_OPTIONS.find((o) => o.id === choice)!.rule}</Tip>
            {choice === 'upgrade' && (
              <Tip kind="clan">
                Cartes d’amélioration restantes pour {player.name} : {upgradesLeft}/{maxUpgrades}.
              </Tip>
            )}
          </>
        )}

        {choice === 'play' && (
          <>
            <Tip>{TURN_OPTIONS[0].rule}</Tip>
            <p>Quelle action principale montre la carte ?</p>
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
                🐍 Carte de Clan ? Avant de la résoudre, vous pouvez déplacer le jeton Terre brûlée dans un territoire neutre ou
                ennemi adjacent (la carte initiale permet de le faire avant ET après le Déplacement).
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
                    <button onClick={() => setCombatOpen(true)}>⚔️ Un combat a lieu → calculateur</button>
                  </>
                )}
                {cardAction === 'explore' && (
                  <div className="explore-help">
                    {m.creatures && (
                      <div className="question">
                        <span>La tuile posée contient-elle un repaire de créature ?</span>
                        <button onClick={() => setApparition('explore')}>🐾 Oui : une créature apparaît</button>
                      </div>
                    )}
                    {m.environmentTiles && (
                      <div className="question">
                        <span>Est-ce une tuile Environnement ?</span>
                        <select value={envTile} onChange={(e) => setEnvTile(e.target.value as EnvTileId)}>
                          <option value="">Non</option>
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
                            <button onClick={() => setApparition('den')}>🐉 Placer la Wyverne</button>
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
            <button onClick={reset}>Annuler</button>
            <button className="primary" disabled={choice === 'play' && !cardAction} onClick={endTurn}>
              Fin du tour de {player.name} →
            </button>
          </div>
        )}
      </Panel>

      {apparition && <AddCreatureDialog context={apparition} only={apparition === 'den' ? ['wyvern'] : undefined} onClose={() => setApparition(null)} />}
      {combatOpen && (
        <Modal title="Calculateur de combat" wide onClose={() => setCombatOpen(false)}>
          <CombatCalculator attackerIndex={cur} />
        </Modal>
      )}
      {passOpen && <PassDialog onClose={() => setPassOpen(false)} onDone={reset} />}
    </>
  );
}

function PassDialog(props: { onClose: () => void; onDone: () => void }) {
  const { state, dispatch } = useGame();
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
    <Modal title={`${state.config.players[cur].name} passe`} onClose={props.onClose}>
      {!passed ? (
        <>
          <ol className="steps">
            <li>Défaussez toutes les cartes restant en main ET toutes les cartes de la zone active.</li>
            <li>
              Prenez une carte {achievement ? <strong>Succès</strong> : <strong>Développement</strong>} parmi celles exposées et
              placez-la <strong>SUR le dessus de votre pioche</strong>.
            </li>
            {isFirst && (
              <li>
                <strong>Premier à passer : prenez le marqueur Premier joueur.</strong>
              </li>
            )}
            <li>Vous ne jouerez plus pendant cette phase.</li>
          </ol>
          <div className="row end">
            <button className="primary" onClick={confirm}>
              Confirmer
            </button>
          </div>
        </>
      ) : (
        <>
          <Tip kind="module">
            Variante « Plus de créatures ! » : il y a {state.creatureLine.length} créature(s) pour {state.config.players.length}{' '}
            joueurs. Le joueur PEUT faire apparaître une créature.
          </Tip>
          <div className="row end">
            <button
              onClick={() => {
                props.onDone();
                props.onClose();
              }}
            >
              Non merci
            </button>
            <button className="primary" onClick={() => setCreature(true)}>
              🐾 Faire apparaître
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
  const m = state.config.modules;
  const clan = state.config.players[state.current].clan;
  return (
    <>
      {clan === 'bear' && <Tip kind="clan">🐻 Kaija peut être recrutée comme une unité.</Tip>}
      {m.warchiefs && <Tip kind="module">Chef de guerre mort ? Il peut être recruté à la place d’une unité.</Tip>}
      {state.creatureLine.some((c) => c.creatureId === 'brownBear') && (
        <Tip kind="warn">Ours brun : impossible de recruter dans son territoire.</Tip>
      )}
    </>
  );
}

function BuildHints() {
  const { state } = useGame();
  const clan = state.config.players[state.current].clan;
  return (
    <>
      {clan === 'goat' && <Tip kind="clan">🐐 Chèvre : +1 nourriture (petit bâtiment) ou +2 (grand).</Tip>}
      {state.creatureLine.some((c) => c.creatureId === 'brownBear') && (
        <Tip kind="warn">Ours brun : impossible de construire dans son territoire.</Tip>
      )}
      <Tip>Victoire : 3 territoires fermés avec chacun au moins un grand bâtiment en Fin d’année.</Tip>
    </>
  );
}

function MoveHints() {
  const { state } = useGame();
  const m = state.config.modules;
  const clan = state.config.players[state.current].clan;
  const line = state.creatureLine;
  return (
    <>
      {clan === 'bear' && <Tip kind="clan">🐻 Kaija peut accompagner d’autres unités mais n’entre JAMAIS en territoire ennemi.</Tip>}
      {clan === 'wolf' && <Tip kind="clan">🐺 Victoire en attaque : +1 nourriture.</Tip>}
      {clan === 'stag' && <Tip kind="clan">🦌 Conquête d’un nouveau territoire par combat : +1 renommée.</Tip>}
      {m.creatures && (
        <Tip kind="module">
          Créatures : on ne peut attaquer une créature que pendant un Déplacement, dans un territoire neutre ou ami ; au plus 1
          créature par territoire partagé. Les 💀 du joueur ne comptent pas contre une créature. Le joueur à gauche lance le dé
          de la créature (💀/⚔️ → toujours 💀).
        </Tip>
      )}
      {line.some((c) => c.creatureId === 'brownBear') && <Tip kind="warn">Ours brun : impossible de faire sortir des unités de son territoire.</Tip>}
      {line.some((c) => c.creatureId === 'fallenValkyrie' || c.creatureId === 'wyvern') && (
        <Tip kind="warn">Valkyrie / Wyverne : entrer dans leur territoire arrête le mouvement et déclenche un combat.</Tip>
      )}
      {m.environmentTiles && m.envTiles.includes('swamp') && <Tip kind="module">{ENV_TILES.swamp.rule}</Tip>}
      {m.environmentTiles && <Tip kind="module">Frontières infranchissables (orange) : jamais franchissables, même en retraite.</Tip>}
    </>
  );
}

function ExploreClanHints(props: { clanId: string }) {
  return (
    <>
      <Tip>Territoire fermé que vous contrôlez : + renommée = nombre de tuiles de ce territoire.</Tip>
      {props.clanId === 'stag' && <Tip kind="clan">🦌 Cerf : +1 renommée supplémentaire par territoire fermé.</Tip>}
      {props.clanId === 'raven' && <Tip kind="clan">🐦‍⬛ Corbeau : collectez immédiatement les ressources des territoires fermés.</Tip>}
      {props.clanId === 'boar' && <Tip kind="clan">🐗 Sanglier : aucun territoire fermé → +1 savoir.</Tip>}
    </>
  );
}
