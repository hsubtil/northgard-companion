import { ENV_TILES } from '../../data/environment';
import { totalYears, victoryTerritoriesNeeded } from '../../logic/rules';
import { useGame } from '../../state/context';
import { Check, Panel, PlayerTag, Tip } from '../ui';

export function EndYearPhase() {
  const { state, dispatch } = useGame();
  const m = state.config.modules;
  const needed = victoryTerritoriesNeeded(m);
  const last = state.year >= totalYears(m);

  return (
    <Panel title="5. Fin de l’année">
      <h4>A. Conditions de fin de partie</h4>
      {needed !== null ? (
        <>
          <Check checkKey="victory">
            Un {m.teamPlay ? 'équipe' : 'joueur'} contrôle-t-il au moins <strong>{needed} territoires fermés</strong> contenant
            chacun au moins un <strong>grand bâtiment</strong> (Autel des Rois, Forge, Forteresse) ?
          </Check>
          <div className="row wrap indent">
            {state.config.players.map((_, i) => (
              <button
                key={i}
                onClick={() => dispatch({ type: 'END_GAME', reason: `${state.config.players[i].name} remplit la condition de victoire immédiate.` })}
              >
                🏆 <PlayerTag index={i} showClan={false} /> l’a fait
              </button>
            ))}
          </div>
          <p className="muted small">
            Plusieurs joueurs en même temps ? Départage : renommée, puis territoires contrôlés, puis unités sur la carte, puis
            bâtiments.
          </p>
        </>
      ) : (
        <Tip>Partie longue : pas de victoire immédiate, seule la renommée compte.</Tip>
      )}
      {last && <Tip kind="warn">Dernière année : la partie se termine. Passez au décompte final.</Tip>}

      {m.environmentTiles && m.envTiles.includes('geyser') && (
        <Check checkKey="geyser">
          ♨️ <strong>Geyser</strong> : {ENV_TILES.geyser.rule}
        </Check>
      )}

      <h4>B. Seconde chance</h4>
      <Check checkKey="second">
        Un joueur n’a plus d’unité sur la carte ? Il place 3 nouvelles unités dans un territoire neutre (s’il n’y en a pas : il
        pioche et place une tuile pour en créer un).
      </Check>

      <h4>C. Jeton Année</h4>
      <Check checkKey="year">Avancez le jeton Année d’une case.</Check>
      <p>
        Premier joueur de l’année prochaine : <PlayerTag index={state.firstPlayer} />
      </p>
    </Panel>
  );
}
