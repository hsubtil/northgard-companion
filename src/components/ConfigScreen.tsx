import { useState } from 'react';
import { CLAN_IDS, CLANS, PLAYER_COLORS } from '../data/clans';
import { CREATURES } from '../data/creatures';
import { ENV_TILE_IDS, ENV_TILES } from '../data/environment';
import { EXPANSIONS } from '../data/expansions';
import { validateConfig } from '../logic/rules';
import { useGame } from '../state/context';
import type { CreatureId, GameConfig, ModuleConfig, Player } from '../types';
import { Panel, Tip } from './ui';

const WILD_CREATURES: CreatureId[] = ['draugrJotunn', 'eldthurs', 'hvedrung'];

function defaultPlayers(n: number, existing: Player[]): Player[] {
  return Array.from({ length: n }, (_, i) =>
    existing[i] ?? { id: `p${i + 1}`, name: `Joueur ${i + 1}`, color: PLAYER_COLORS[i].id, clan: CLAN_IDS[i] },
  );
}

export function ConfigScreen() {
  const { state, dispatch } = useGame();
  const prev = state.config;
  const [players, setPlayers] = useState<Player[]>(prev.players.length ? prev.players : defaultPlayers(3, []));
  const [m, setM] = useState<ModuleConfig>(prev.modules);
  const [wilderness, setWilderness] = useState(prev.modules.environmentTiles || prev.modules.wildernessCreatures.length > 0);

  const set = <K extends keyof ModuleConfig>(k: K, v: ModuleConfig[K]) => setM((old) => ({ ...old, [k]: v }));
  const updatePlayer = (i: number, patch: Partial<Player>) =>
    setPlayers((ps) => ps.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  const effective: ModuleConfig = {
    ...m,
    wildernessCreatures: wilderness && m.creatures ? m.wildernessCreatures : [],
    environmentTiles: wilderness && m.environmentTiles,
    envTiles:
      wilderness && m.environmentTiles ? m.envTiles.filter((t) => m.creatures || !ENV_TILES[t].requiresCreatures) : [],
    moreCreatures: m.creatures && m.moreCreatures,
    teamPlay: players.length === 4 && m.teamPlay,
  };
  const config: GameConfig = { players, modules: effective };
  const errors = validateConfig(config);

  return (
    <div className="config">
      <Panel title="👥 Joueurs">
        <div className="row">
          <span>Nombre de joueurs :</span>
          {[2, 3, 4, 5].map((n) => (
            <button key={n} className={players.length === n ? 'primary' : ''} onClick={() => setPlayers(defaultPlayers(n, players))}>
              {n}
            </button>
          ))}
        </div>
        <p className="muted">Saisissez les joueurs dans l’ordre de la table (sens horaire).</p>
        <div className="player-grid">
          {players.map((p, i) => (
            <div key={p.id} className="player-row">
              <span className="seat">{i + 1}</span>
              <input value={p.name} onChange={(e) => updatePlayer(i, { name: e.target.value })} aria-label="Nom" />
              <select value={p.color} onChange={(e) => updatePlayer(i, { color: e.target.value })} aria-label="Couleur">
                {PLAYER_COLORS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <select value={p.clan} onChange={(e) => updatePlayer(i, { clan: e.target.value as Player['clan'] })} aria-label="Clan">
                {CLAN_IDS.map((c) => (
                  <option key={c} value={c}>
                    {CLANS[c].emoji} {CLANS[c].name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="📦 Extensions et modules">
        <div className="expansions">
          {EXPANSIONS.map((x) => (
            <div key={x.id} className={`expansion ${x.available ? '' : 'disabled'}`}>
              <strong>{x.name}</strong>
              <p className="muted">{x.description}</p>
              {x.id === 'core' && (
                <>
                  <label className="check">
                    <input type="checkbox" checked={m.creatures} onChange={(e) => set('creatures', e.target.checked)} />
                    <span>Module Créatures</span>
                  </label>
                  {m.creatures && (
                    <label className="check">
                      <input type="checkbox" checked={m.moreCreatures} onChange={(e) => set('moreCreatures', e.target.checked)} />
                      <span>Variante « Plus de créatures ! »</span>
                    </label>
                  )}
                </>
              )}
              {x.id === 'wilderness' && (
                <>
                  <label className="check">
                    <input type="checkbox" checked={wilderness} onChange={(e) => setWilderness(e.target.checked)} />
                    <span>J’utilise Wilderness</span>
                  </label>
                  {wilderness && (
                    <div className="sub">
                      <strong>Nouvelles créatures</strong>
                      {!m.creatures && <Tip kind="warn">Activez le module Créatures pour les utiliser.</Tip>}
                      {WILD_CREATURES.map((c) => (
                        <label key={c} className="check">
                          <input
                            type="checkbox"
                            disabled={!m.creatures}
                            checked={m.wildernessCreatures.includes(c)}
                            onChange={(e) =>
                              set(
                                'wildernessCreatures',
                                e.target.checked ? [...m.wildernessCreatures, c] : m.wildernessCreatures.filter((x) => x !== c),
                              )
                            }
                          />
                          <span>
                            {CREATURES[c].emoji} {CREATURES[c].name}
                          </span>
                        </label>
                      ))}
                      <label className="check">
                        <input type="checkbox" checked={m.environmentTiles} onChange={(e) => set('environmentTiles', e.target.checked)} />
                        <strong>Module Tuiles Environnement</strong>
                      </label>
                      {m.environmentTiles &&
                        ENV_TILE_IDS.map((t) => {
                          const disabled = ENV_TILES[t].requiresCreatures && !m.creatures;
                          return (
                            <label key={t} className="check" title={ENV_TILES[t].rule}>
                              <input
                                type="checkbox"
                                disabled={disabled}
                                checked={!disabled && m.envTiles.includes(t)}
                                onChange={(e) =>
                                  set('envTiles', e.target.checked ? [...m.envTiles, t] : m.envTiles.filter((x) => x !== t))
                                }
                              />
                              <span>
                                {ENV_TILES[t].emoji} {ENV_TILES[t].name}
                                {ENV_TILES[t].requiresCreatures && <span className="muted"> (requiert Créatures)</span>}
                              </span>
                            </label>
                          );
                        })}
                    </div>
                  )}
                </>
              )}
              {x.id === 'warchiefs' && (
                <>
                  <label className="check">
                    <input type="checkbox" checked={m.warchiefs} onChange={(e) => set('warchiefs', e.target.checked)} />
                    <span>Module Chefs de guerre</span>
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={m.warchiefs || m.warchiefsExtraUpgrades}
                      disabled={m.warchiefs}
                      onChange={(e) => set('warchiefsExtraUpgrades', e.target.checked)}
                    />
                    <span>Nouvelles cartes d’amélioration de Clan</span>
                  </label>
                </>
              )}
              {!x.available && <span className="badge">Bientôt</span>}
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="🎲 Variantes">
        <label className="check">
          <input type="checkbox" checked={m.longGame} onChange={(e) => set('longGame', e.target.checked)} />
          <span>Partie longue (10 ans, victoire uniquement à la renommée)</span>
        </label>
        <label className="check">
          <input
            type="checkbox"
            disabled={players.length !== 4}
            checked={players.length === 4 && m.teamPlay}
            onChange={(e) => set('teamPlay', e.target.checked)}
          />
          <span>Jeu en équipe (4 joueurs exactement : joueurs 1 & 3 contre 2 & 4)</span>
        </label>
      </Panel>

      {errors.map((e) => (
        <Tip key={e} kind="warn">
          {e}
        </Tip>
      ))}
      <div className="row end">
        <button className="primary big" disabled={errors.length > 0} onClick={() => dispatch({ type: 'CONFIGURE', config })}>
          Préparer la partie →
        </button>
      </div>
    </div>
  );
}
