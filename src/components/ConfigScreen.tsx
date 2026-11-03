import { useState } from 'react';
import { colorCss } from '../data/clans';
import { validateConfig } from '../logic/rules';
import { useGame } from '../state/context';
import type { CreatureId, GameConfig, ModuleConfig, Player } from '../types';
import { Panel, Tip } from './ui';
import { useGameData, useI18n } from '../i18n';

const WILD_CREATURES: CreatureId[] = ['draugrJotunn', 'eldthurs', 'hvedrung'];

function defaultPlayers(n: number, existing: Player[], playerColors: ReturnType<typeof useGameData>['PLAYER_COLORS'], clanIds: ReturnType<typeof useGameData>['CLAN_IDS'], t: ReturnType<typeof useI18n>['t']): Player[] {
  return Array.from({ length: n }, (_, i) =>
    existing[i] ?? { id: `p${i + 1}`, name: t('Joueur {number}', { number: i + 1 }), color: playerColors[i].id, clan: clanIds[i] },
  );
}

export function ConfigScreen() {
  const { state, dispatch } = useGame();
  const { language, t } = useI18n();
  const { CLAN_IDS, CLANS, PLAYER_COLORS, CREATURES, ENV_TILE_IDS, ENV_TILES, EXPANSIONS } = useGameData();
  const prev = state.config;
  const [players, setPlayers] = useState<Player[]>(prev.players.length ? prev.players : defaultPlayers(3, [], PLAYER_COLORS, CLAN_IDS, t));
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
  const errors = validateConfig(config, language);

  return (
    <div className="config">
      <section className="config-hero" aria-labelledby="welcome-title">
        <p className="eyebrow">Northgard: Uncharted Lands</p>
        <h2 id="welcome-title">{t('Rassemblez')}<br />{t('votre clan.')}</h2>
        <p className="hero-description">
          {t('Des premières explorations au dernier hiver, votre guide à chaque tour.')}
          {' '}{t('Choisissez vos clans, vos extensions et partez à la conquête du Nord.')}
        </p>
        <div className="hero-meta" aria-label={t('Informations de partie')}>
          <span>{t('2 à 5 joueurs')}</span>
          <span>{t('Extensions à la carte')}</span>
          <span>{t('Sauvegarde automatique')}</span>
        </div>
      </section>
      <Panel title={`👥 ${t('Joueurs')}`}>
        <div className="row wrap">
          <span>{t('Nombre de joueurs :')}</span>
          {[2, 3, 4, 5].map((n) => (
            <button key={n} className={players.length === n ? 'primary' : ''} onClick={() => setPlayers(defaultPlayers(n, players, PLAYER_COLORS, CLAN_IDS, t))}>
              {n}
            </button>
          ))}
        </div>
        <p className="muted">{t('Saisissez les joueurs dans l’ordre de la table (sens horaire).')}</p>
        <div className="player-grid">
          {players.map((p, i) => (
            <div key={p.id} className="player-row">
              <span className="seat">{i + 1}</span>
              <input value={p.name} onChange={(e) => updatePlayer(i, { name: e.target.value })} aria-label={t('Nom')} />
              <div className="color-select">
                <span className="color-preview" style={{ background: colorCss(p.color) }} aria-hidden="true" />
                <select value={p.color} onChange={(e) => updatePlayer(i, { color: e.target.value })} aria-label={t('Couleur')}>
                  {PLAYER_COLORS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <select value={p.clan} onChange={(e) => updatePlayer(i, { clan: e.target.value as Player['clan'] })} aria-label={t('Clan')}>
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

      <Panel title={`📦 ${t('Extensions et modules')}`}>
        <div className="expansions">
          {EXPANSIONS.map((x) => (
            <div key={x.id} className={`expansion ${x.available ? '' : 'disabled'}`}>
              <strong>{x.name}</strong>
              <p className="muted">{x.description}</p>
              {x.id === 'core' && (
                <>
                  <label className="check">
                    <input type="checkbox" checked={m.creatures} onChange={(e) => set('creatures', e.target.checked)} />
                    <span>{t('Module Créatures')}</span>
                  </label>
                  {m.creatures && (
                    <label className="check">
                      <input type="checkbox" checked={m.moreCreatures} onChange={(e) => set('moreCreatures', e.target.checked)} />
                      <span>{t('Variante « Plus de créatures ! »')}</span>
                    </label>
                  )}
                </>
              )}
              {x.id === 'wilderness' && (
                <>
                  <label className="check">
                    <input type="checkbox" checked={wilderness} onChange={(e) => setWilderness(e.target.checked)} />
                    <span>{t('J’utilise Wilderness')}</span>
                  </label>
                  {wilderness && (
                    <div className="sub">
                      <strong>{t('Nouvelles créatures')}</strong>
                      {!m.creatures && <Tip kind="warn">{t('Activez le module Créatures pour les utiliser.')}</Tip>}
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
                        <strong>{t('Module Tuiles Environnement')}</strong>
                      </label>
                      {m.environmentTiles &&
                        ENV_TILE_IDS.map((tileId) => {
                          const disabled = ENV_TILES[tileId].requiresCreatures && !m.creatures;
                          return (
                            <label key={tileId} className="check" title={ENV_TILES[tileId].rule}>
                              <input
                                type="checkbox"
                                disabled={disabled}
                                checked={!disabled && m.envTiles.includes(tileId)}
                                onChange={(e) =>
                                  set('envTiles', e.target.checked ? [...m.envTiles, tileId] : m.envTiles.filter((x) => x !== tileId))
                                }
                              />
                              <span>
                                {ENV_TILES[tileId].emoji} {ENV_TILES[tileId].name}
                                {ENV_TILES[tileId].requiresCreatures && <span className="muted"> ({t('requiert Créatures')})</span>}
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
                    <span>{t('Module Chefs de guerre')}</span>
                  </label>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={m.warchiefs || m.warchiefsExtraUpgrades}
                      disabled={m.warchiefs}
                      onChange={(e) => set('warchiefsExtraUpgrades', e.target.checked)}
                    />
                    <span>{t('Nouvelles cartes d’amélioration de Clan')}</span>
                  </label>
                </>
              )}
              {!x.available && <span className="badge">{t('Bientôt')}</span>}
            </div>
          ))}
        </div>
      </Panel>

      <Panel title={`🎲 ${t('Variantes')}`}>
        <label className="check">
          <input type="checkbox" checked={m.longGame} onChange={(e) => set('longGame', e.target.checked)} />
          <span>{t('Partie longue (10 ans, victoire uniquement à la renommée)')}</span>
        </label>
        <label className="check">
          <input
            type="checkbox"
            disabled={players.length !== 4}
            checked={players.length === 4 && m.teamPlay}
            onChange={(e) => set('teamPlay', e.target.checked)}
          />
          <span>{t('Jeu en équipe (4 joueurs exactement : joueurs 1 & 3 contre 2 & 4)')}</span>
        </label>
      </Panel>

      {errors.map((e) => (
        <Tip key={e} kind="warn">
          {e}
        </Tip>
      ))}
      <div className="row end">
        <button className="primary big" disabled={errors.length > 0} onClick={() => dispatch({ type: 'CONFIGURE', config })}>
          {t('Préparer la partie →')}
        </button>
      </div>
    </div>
  );
}
