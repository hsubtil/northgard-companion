import { useState, type ReactNode } from 'react';
import type { CreatureId } from '../types';
import { useGame } from '../state/context';
import { useGameData, useI18n } from '../i18n';

interface Entry {
  title: string;
  group: string;
  body: ReactNode;
  text: string;
}

export function Reference() {
  const { state } = useGame();
  const { t } = useI18n();
  const { CLAN_IDS, CLANS, CREATURE_MOVE_RULES, CREATURES, ENV_TILE_IDS, ENV_TILES, BUILDINGS, CARD_ACTIONS, REFERENCE, TURN_OPTIONS } = useGameData();
  const [q, setQ] = useState('');
  const m = state.config.modules;

  const entries: Entry[] = [
    ...REFERENCE.map((s) => ({ title: s.title, group: t('Règles'), body: <ul>{s.items.map((i) => <li key={i}>{i}</li>)}</ul>, text: s.items.join(' ') })),
    {
      title: `🔁 ${t('Options du tour (phase Actions)')}`,
      group: t('Règles'),
      body: (
        <ul>
          {TURN_OPTIONS.map((o) => (
            <li key={o.id}>
              <strong>{o.label}</strong> : {o.rule}
            </li>
          ))}
          <li>
            <strong>{t('F. Passer')}</strong> : {t('défaussez main + zone active, prenez une carte Développement (Succès la dernière année)')}
            {t('et placez-la SUR votre pioche. Le premier à passer prend le marqueur Premier joueur.')}
          </li>
        </ul>
      ),
      text: TURN_OPTIONS.map((o) => o.label + o.rule).join(' ') + ' ' + t('passer'),
    },
    ...CARD_ACTIONS.map((a) => ({
      title: `${a.icon} Action ${a.label}`,
      group: t('Actions'),
      body: <ul>{a.rules.map((r) => <li key={r}>{r}</li>)}</ul>,
      text: a.rules.join(' '),
    })),
    {
      title: `🏠 ${t('Bâtiments')}`,
      group: t('Actions'),
      body: (
        <table>
          <tbody>
            {BUILDINGS.map((b) => (
              <tr key={b.name}>
                <th>{b.name}</th>
                <td>{b.size}</td>
                <td>{b.effect}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ),
      text: BUILDINGS.map((b) => b.name + b.effect).join(' '),
    },
    ...CLAN_IDS.map((c) => ({
      title: `${CLANS[c].emoji} ${CLANS[c].name}`,
      group: t('Clans'),
      body: (
        <>
          <p>{CLANS[c].power}</p>
          {m.warchiefs && (
            <p>
              <strong>
                {CLANS[c].warchief.name}, {CLANS[c].warchief.title}
              </strong>{' '}
              : {CLANS[c].warchief.power}
            </p>
          )}
        </>
      ),
      text: CLANS[c].power + CLANS[c].warchief.name + CLANS[c].warchief.power,
    })),
  ];
  if (m.warchiefs)
    entries.push({
      title: `👑 ${t('Chefs de guerre — règles générales')}`,
      group: t('Chefs de guerre'),
      body: (
        <ul>
          <li>{t('Un chef de guerre suit toutes les règles d’unité : recrutement, déplacement, combat. Mort → retour en réserve, recrutable à nouveau.')}</li>
          <li>{t('Il ne peut pas être ciblé par des cartes ou capacités visant une unité ennemie (ex. Raiding Party, Plunder).')}</li>
          <li>{t('Combat : vaut ×2 (ou plus selon son pouvoir) mais compte comme 1 unité pour la limite de nourriture et les pertes (1 💀 suffit à le tuer).')}</li>
          <li>{t('Le joueur choisit quelles unités retirer : il peut épargner son chef s’il n’est pas obligé de tout retirer.')}</li>
          <li>{t('Deux pouvoirs à la même étape (ex. Brand et Signy) : celui de l’attaquant d’abord.')}</li>
        </ul>
      ),
      text: t('chef de guerre warchief'),
    });
  if (m.creatures) {
    entries.push({
      title: `🐾 ${t('Créatures — règles générales')}`,
      group: t('Créatures'),
      body: (
        <ul>
          <li>{t('Apparition : piochez une carte Créature, ajoutez-la à DROITE de la ligne, figurine sur le repaire.')}</li>
          <li>{t('Apparue en exploration : ne bouge pas mais s’active immédiatement. En mise en place : ni mouvement ni effet.')}</li>
          <li>{t('La plupart partagent leur territoire (pas de combat). Celles qui ne le partagent pas arrêtent le mouvement et combattent.')}</li>
          <li>{t('Deux créatures « non partageuses » dans un territoire : on ne peut pas y entrer.')}</li>
          <li>{t('Pioche vide : mélangez la défausse Créature.')}</li>
          {CREATURE_MOVE_RULES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ),
      text: t('créature apparition repaire') + ' ' + CREATURE_MOVE_RULES.join(' '),
    });
    (Object.keys(CREATURES) as CreatureId[]).forEach((id) => {
      const c = CREATURES[id];
      entries.push({
        title: `${c.emoji} ${c.name}`,
        group: t('Créatures'),
        body: (
          <>
            <p>{c.power}</p>
            {c.notes && <ul>{c.notes.map((n) => <li key={n}>{n}</li>)}</ul>}
          </>
        ),
        text: c.power + (c.notes ?? []).join(' '),
      });
    });
  }
  if (m.environmentTiles)
    ENV_TILE_IDS.forEach((id) => {
      const tile = ENV_TILES[id];
      entries.push({
        title: `${tile.emoji} ${tile.name}`,
        group: t('Environnement'),
        body: (
          <>
            <p>{tile.rule}</p>
            {tile.notes && <ul>{tile.notes.map((n) => <li key={n}>{n}</li>)}</ul>}
          </>
        ),
        text: tile.rule + (tile.notes ?? []).join(' '),
      });
    });

  const needle = q.trim().toLowerCase();
  const filtered = needle ? entries.filter((e) => (e.title + e.text).toLowerCase().includes(needle)) : entries;
  const groups = [...new Set(filtered.map((e) => e.group))];

  return (
    <div className="reference">
      <input className="search" placeholder={t('🔍 Rechercher une règle (ex. retraite, forge, loup…)')} value={q} onChange={(e) => setQ(e.target.value)} />
      {groups.map((g) => (
        <div key={g}>
          <h3>{g}</h3>
          {filtered
            .filter((e) => e.group === g)
            .map((e) => (
              <details key={e.title} className="ref-entry" open={!!needle}>
                <summary>{e.title}</summary>
                {e.body}
              </details>
            ))}
        </div>
      ))}
      {filtered.length === 0 && <p className="muted">{t('Aucun résultat.')}</p>}
    </div>
  );
}
