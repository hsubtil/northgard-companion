import { useState } from 'react';
import { CLANS } from '../data/clans';
import { CREATURES } from '../data/creatures';
import { DIE_FACES, type DieFaceId } from '../data/reference';
import { defaultPlayerSide, resolveCombat, type CreatureSide, type PlayerSide, type Side } from '../logic/combat';
import { useGame } from '../state/context';
import { NumberField, Panel, Tip } from './ui';

interface SideSetup {
  kind: 'player' | 'creature';
  playerIndex: number;
  creatureUid: string;
  player: PlayerSide;
  creature: CreatureSide;
}

function initSide(playerIndex: number): SideSetup {
  return {
    kind: 'player',
    playerIndex,
    creatureUid: '',
    player: defaultPlayerSide(),
    creature: { kind: 'creature', combatValue: 5, die: 'x2' },
  };
}

export function CombatCalculator(props: { attackerIndex?: number; attackerCreatureUid?: string }) {
  const { state } = useGame();
  const n = state.config.players.length;
  const a0 = props.attackerIndex ?? state.current;
  const [att, setAtt] = useState<SideSetup>(() => {
    const s = initSide(a0);
    const c = state.creatureLine.find((x) => x.uid === props.attackerCreatureUid);
    if (!c) return s;
    return {
      ...s,
      kind: 'creature',
      creatureUid: c.uid,
      creature: { ...s.creature, combatValue: CREATURES[c.creatureId].combatValue ?? s.creature.combatValue },
    };
  });
  const [def, setDef] = useState<SideSetup>(() => initSide(props.attackerCreatureUid ? a0 : (a0 + 1) % n));

  const toSide = (s: SideSetup): Side => (s.kind === 'player' ? s.player : s.creature);
  const result = resolveCombat(toSide(att), toSide(def));
  const label = (s: SideSetup) =>
    s.kind === 'player'
      ? state.config.players[s.playerIndex].name
      : (() => {
          const c = state.creatureLine.find((x) => x.uid === s.creatureUid);
          return c ? CREATURES[c.creatureId].name : 'Créature';
        })();

  const notes: string[] = [];
  const winnerSide = result.winner === 'attacker' ? att : result.winner === 'defender' ? def : null;
  const loserSide = result.winner === 'attacker' ? def : result.winner === 'defender' ? att : null;
  if (winnerSide && loserSide) {
    if (loserSide.kind === 'creature') {
      const c = state.creatureLine.find((x) => x.uid === loserSide.creatureUid);
      const info = c && CREATURES[c.creatureId];
      notes.push(
        `${label(winnerSide)} gagne ${info?.fame ? `${info.fame} ` : 'la '}renommée indiquée sur la carte. Retirez la créature (carte dans la défausse Créature).`,
      );
      if (info?.id === 'wyvern') notes.push('Wyverne : si elle était hors de son Antre, replacez-la sur l’Antre au lieu de la retirer.');
      if (info?.id === 'spectralWarrior') notes.push('Guerrier spectral : retiré du jeu définitivement.');
    } else if (winnerSide.kind === 'creature') {
      const c = state.creatureLine.find((x) => x.uid === winnerSide.creatureUid);
      const shares = c ? CREATURES[c.creatureId].sharesTerritory : true;
      if (loserSide === att && shares) notes.push(`${label(att)} a attaqué une créature qui partage son territoire : pas de retraite, les unités restent.`);
      else notes.push(`${label(loserSide)} bat en retraite (règles normales).`);
    } else {
      notes.push(
        `${label(loserSide)} bat en retraite avec ses unités restantes vers des territoires adjacents amis ou neutres (frontière normale, hors combat). Sinon, elles sont retirées.`,
      );
      if (winnerSide === att) {
        const clan = state.config.players[att.playerIndex].clan;
        if (clan === 'wolf') notes.push('🐺 Loup : victoire en attaque → +1 nourriture.');
        if (clan === 'stag') notes.push('🦌 Cerf : nouveau territoire conquis → +1 renommée.');
      }
    }
  }
  if (result.winner === 'none') notes.push('Les deux camps sont anéantis : le territoire devient neutre.');
  notes.push('Les bâtiments ne sont jamais détruits : ils passent au nouveau propriétaire.');

  return (
    <div className="combat">
      <div className="combat-grid">
        <SideEditor title="⚔️ Attaquant" role="attacker" side={att} setSide={setAtt} />
        <SideEditor title="🛡️ Défenseur" role="defender" side={def} setSide={setDef} />
      </div>
      <Panel title="Résultat" className="combat-result">
        <div className="score-row">
          <div>
            <strong>{label(att)}</strong>
            <div className="big-score">{result.attacker.score}</div>
            <div className="small">{result.attacker.breakdown.join(' · ')}</div>
            {att.kind === 'player' && <div>Pertes subies : <strong>{result.attackerLosses}</strong></div>}
          </div>
          <div className="vs">VS</div>
          <div>
            <strong>{label(def)}</strong>
            <div className="big-score">{result.defender.score}</div>
            <div className="small">{result.defender.breakdown.join(' · ')}</div>
            {def.kind === 'player' && <div>Pertes subies : <strong>{result.defenderLosses}</strong></div>}
          </div>
        </div>
        <Tip kind={result.winner === 'none' ? 'warn' : 'info'}>
          <strong>
            {result.winner === 'none' ? 'Personne ne gagne' : `Vainqueur : ${label(result.winner === 'attacker' ? att : def)}`}
          </strong>{' '}
          — {result.explanation}
        </Tip>
        <ul>
          {notes.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function SideEditor(props: {
  title: string;
  role: 'attacker' | 'defender';
  side: SideSetup;
  setSide: (s: SideSetup) => void;
}) {
  const { state } = useGame();
  const { side, setSide, role } = props;
  const m = state.config.modules;
  const p = side.player;
  const setP = (patch: Partial<PlayerSide>) => setSide({ ...side, player: { ...p, ...patch } });
  const clan = state.config.players[side.playerIndex]?.clan;

  return (
    <Panel title={props.title}>
      <div className="row wrap">
        <select
          value={side.kind === 'player' ? `p${side.playerIndex}` : `c${side.creatureUid}`}
          onChange={(e) => {
            const v = e.target.value;
            if (v.startsWith('p')) {
              const idx = Number(v.slice(1));
              setSide({ ...side, kind: 'player', playerIndex: idx, player: { ...p, warchief: p.warchief ? state.config.players[idx].clan : null } });
            } else {
              const uid = v.slice(1);
              const c = state.creatureLine.find((x) => x.uid === uid);
              const value = c ? CREATURES[c.creatureId].combatValue : undefined;
              setSide({ ...side, kind: 'creature', creatureUid: uid, creature: { ...side.creature, combatValue: value ?? side.creature.combatValue } });
            }
          }}
        >
          {state.config.players.map((pl, i) => (
            <option key={pl.id} value={`p${i}`}>
              {pl.name} ({CLANS[pl.clan].name})
            </option>
          ))}
          {state.creatureLine.map((c) => (
            <option key={c.uid} value={`c${c.uid}`}>
              🐾 {CREATURES[c.creatureId].name}
            </option>
          ))}
          {m.creatures && <option value="c">🐾 Autre créature</option>}
        </select>
      </div>

      {side.kind === 'creature' ? (
        <>
          <NumberField
            label="Valeur de combat (carte)"
            value={side.creature.combatValue}
            onChange={(v) => setSide({ ...side, creature: { ...side.creature, combatValue: v } })}
          />
          <DieSelect value={side.creature.die} onChange={(d) => setSide({ ...side, creature: { ...side.creature, die: d } })} creature />
          {(() => {
            const c = state.creatureLine.find((x) => x.uid === side.creatureUid);
            return c ? <Tip kind="module">{CREATURES[c.creatureId].power}</Tip> : null;
          })()}
          <p className="muted small">Le joueur à gauche de son adversaire lance le dé. Pas de nourriture pour une créature.</p>
        </>
      ) : (
        <>
          <NumberField label="Unités (hors chef / Kaija)" value={p.units} onChange={(v) => setP({ units: v })} />
          {m.warchiefs && (
            <label className="check">
              <input type="checkbox" checked={!!p.warchief} onChange={(e) => setP({ warchief: e.target.checked ? clan : null })} />
              <span>
                {CLANS[clan].warchief.name} présent{role === 'attacker' && clan === 'wolf' ? ' (×3 en attaque)' : ''}
                {role === 'defender' && clan === 'bear' ? ' (×3 en défense)' : ''}
                {role === 'defender' && clan === 'goat' ? ' (ignore 1 💀)' : ''}
              </span>
            </label>
          )}
          {m.warchiefs && p.warchief === 'boar' && (
            <label className="check">
              <input type="checkbox" checked={p.svarnBoost} onChange={(e) => setP({ svarnBoost: e.target.checked })} />
              <span>Territoire ouvert ou avec symbole savoir (Svarn ×3)</span>
            </label>
          )}
          {m.warchiefs && p.warchief && <p className="muted small">{CLANS[clan].warchief.power}</p>}
          {clan === 'bear' && (
            <label className="check">
              <input type="checkbox" checked={p.kaija} onChange={(e) => setP({ kaija: e.target.checked })} />
              <span>Kaija présente (×2)</span>
            </label>
          )}
          {clan === 'snake' && (
            <label className="check">
              <input type="checkbox" checked={p.scorchedEarth} onChange={(e) => setP({ scorchedEarth: e.target.checked })} />
              <span>Terre brûlée dans ce territoire (+1)</span>
            </label>
          )}
          <NumberField
            label={role === 'attacker' ? 'Bonus ⚔️ de la carte Déplacement / clan' : 'Bonus ⚔️ de clan / carte'}
            value={p.bonusPoints}
            onChange={(v) => setP({ bonusPoints: v })}
          />
          {role === 'defender' && (
            <>
              <NumberField label="Forteresses (+2 chacune)" value={p.fortresses} onChange={(v) => setP({ fortresses: v })} />
              <NumberField label="Tours de défense (+1 💀 chacune)" value={p.towers} onChange={(v) => setP({ towers: v })} />
              {state.creatureLine.some((c) => c.creatureId === 'spectralWarrior') && (
                <p className="muted small">Guerrier spectral dans ce territoire ? Les bâtiments n’ont aucun effet.</p>
              )}
            </>
          )}
          <NumberField label="Nourriture défaussée (max 1 / unité)" value={p.food} onChange={(v) => setP({ food: v })} />
          <NumberField label="💀 supplémentaires (cartes, pouvoirs)" value={p.extraSkulls} onChange={(v) => setP({ extraSkulls: v })} />
          <DieSelect value={p.die} onChange={(d) => setP({ die: d })} />
          {p.die === 'choice' && (
            <div className="row">
              <button className={!p.choiceSkull ? 'primary' : ''} onClick={() => setP({ choiceSkull: false })}>
                ⚔️ 1 point
              </button>
              <button className={p.choiceSkull ? 'primary' : ''} onClick={() => setP({ choiceSkull: true })}>
                💀 1 perte
              </button>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

function DieSelect(props: { value: DieFaceId; onChange: (d: DieFaceId) => void; creature?: boolean }) {
  return (
    <div className="die-select">
      <span>Résultat du dé :</span>
      <div className="row wrap">
        {DIE_FACES.map((f) => (
          <button key={f.id} className={props.value === f.id ? 'primary' : ''} title={f.desc} onClick={() => props.onChange(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      {props.creature && props.value === 'choice' && <p className="muted small">Une créature choisit toujours 💀.</p>}
    </div>
  );
}
