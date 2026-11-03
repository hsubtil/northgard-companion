import { CLANS } from '../data/clans';
import { CREATURES } from '../data/creatures';
import { ENV_TILES } from '../data/environment';
import type { GameConfig } from '../types';
import {
  advancedPerPlayer,
  creatureDeck,
  earlyPerPlayer,
  orderFrom,
  startingResources,
  totalYears,
  upgradeCardsPerPlayer,
} from './rules';

export interface SetupStep {
  id: string;
  letter: string;
  title: string;
  details: string[];
  module?: string;
  /** Étape interactive particulière gérée par l'UI */
  interactive?: 'firstPlayer' | 'tilePlacement';
}

export function buildSetupSteps(config: GameConfig, firstPlayer: number): SetupStep[] {
  const m = config.modules;
  const n = config.players.length;
  const steps: SetupStep[] = [];
  const name = (i: number) => config.players[i].name;

  steps.push({
    id: 'A',
    letter: 'A',
    title: 'Réserve commune',
    details: [
      'Placez les dés, les jetons de renommée, les ressources (nourriture, bois, savoir) et les jetons Bâtiment à portée de tous.',
    ],
  });
  steps.push({
    id: 'B',
    letter: 'B',
    title: 'Piste des années',
    details: m.longGame
      ? ['Retournez la piste sur sa face 10 ans et placez le jeton Année sur la première case.']
      : ['Placez la piste des années et le jeton Année sur la première case (7 ans).'],
  });
  steps.push({
    id: 'C',
    letter: 'C',
    title: 'Cartes Troubles',
    details: ['Placez les 10 cartes Troubles en pile face visible.'],
  });
  const early = earlyPerPlayer(m) * n;
  const adv = advancedPerPlayer(m) * n;
  steps.push({
    id: 'D',
    letter: 'D',
    title: 'Pioche Développement',
    details: [
      `Mélangez les Développements précoces et prenez-en ${early} (${earlyPerPlayer(m)} par joueur), face cachée.`,
      `Mélangez les Développements avancés et prenez-en ${adv} (${advancedPerPlayer(m)} par joueur), face cachée.`,
      'Posez la pile Précoce SUR la pile Avancée pour former une seule pioche. Rangez les cartes inutilisées.',
    ],
  });
  steps.push({
    id: 'E',
    letter: 'E',
    title: 'Cartes Succès',
    details: [`Mélangez les cartes Succès, révélez-en ${n} face visible côte à côte. Rangez les autres.`],
  });
  steps.push({
    id: 'F',
    letter: 'F',
    title: 'Tuile de départ',
    details: [
      n === 5
        ? 'À 5 joueurs : placez les DEUX tuiles de départ (dont celle marquée 5) côte à côte, le symbole nourriture dans le territoire du milieu.'
        : 'Placez la tuile de départ (dos différent) au centre de la table.',
      'Mélangez les autres tuiles Carte en une pile face cachée.',
    ],
  });
  steps.push({
    id: 'G',
    letter: 'G',
    title: 'Couleurs et cartes de départ',
    details: config.players.map((p) => `${p.name} : prend les 6 cartes de départ et les 14 unités de sa couleur.`),
  });
  const upgrades = upgradeCardsPerPlayer(m);
  const hDetails = config.players.map(
    (p) =>
      `${p.name} — ${CLANS[p.clan].name} : 1 carte de Clan initiale + ${upgrades} cartes d’amélioration (mises de côté).` +
      (m.warchiefs ? ` Prend la figurine de ${CLANS[p.clan].warchief.name}.` : ''),
  );
  if (config.players.some((p) => p.clan === 'bear')) hDetails.push('Ours : prend Kaija (jeton ou figurine).');
  if (config.players.some((p) => p.clan === 'snake')) hDetails.push('Serpent : prend le jeton Terre brûlée.');
  if (m.warchiefsExtraUpgrades && !m.warchiefs)
    hDetails.push('La carte d’amélioration de l’Ours mentionne Borgild : ignorez cette partie sans le module Chefs de guerre.');
  steps.push({ id: 'H', letter: 'H', title: 'Clans', details: hDetails });
  steps.push({
    id: 'I',
    letter: 'I',
    title: 'Decks de départ',
    details: [
      'Chaque joueur mélange ses 6 cartes de départ + sa carte de Clan initiale (7 cartes) : c’est sa pioche, face cachée.',
      'Placez la pioche à gauche de l’aide de jeu (ou du plateau joueur) et la défausse à droite.',
    ],
  });
  steps.push({
    id: 'J',
    letter: 'J',
    title: 'Premier joueur',
    details: [
      'Chaque joueur lance les 2 dés ; celui qui obtient le plus de haches devient premier joueur (relancez les égalités).',
    ],
    interactive: 'firstPlayer',
  });
  steps.push({
    id: 'K',
    letter: 'K',
    title: 'Ressources de départ',
    details: orderFrom(firstPlayer, n).map((p, seat) => {
      const r = startingResources(seat + 1);
      return `${seat + 1}${seat === 0 ? 'er' : 'e'} — ${name(p)} : ${r.food} nourriture + ${r.wood} bois`;
    }),
  });
  if (m.creatures) {
    const deck = creatureDeck(m)
      .map((id) => `${CREATURES[id].name} ×${CREATURES[id].colors.length}`)
      .join(', ');
    steps.push({
      id: 'K2',
      letter: 'K+',
      title: 'Pioche Créature',
      module: 'Créatures',
      details: [
        `Cartes utilisées : ${deck}.`,
        `Mélangez les cartes Créature de valeur de combat ≤ 6 et formez une pile de ${n + 1} cartes face cachée.`,
        'Mélangez toutes les autres cartes Créature et placez-les SOUS cette pile : une seule pioche Créature.',
        'Choisissez quel côté de la table est la gauche de la ligne de créatures (elles s’activent de gauche à droite).',
        ...(m.environmentTiles && m.envTiles.includes('ancestralGraveyard')
          ? ['Mettez de côté les 2 Guerriers spectraux (cartes et figurines) : ils ne vont PAS dans la pioche.']
          : []),
        ...(m.environmentTiles && m.envTiles.includes('wyvernDen')
          ? ['Mettez de côté la Wyverne (carte et figurine) : elle ne va PAS dans la pioche.']
          : []),
      ],
    });
  }
  const lDetails = [
    'Chaque joueur pioche 3 tuiles Carte.',
    `Tour 1 (en commençant par ${name(firstPlayer)}, sens horaire) : posez 1 tuile orthogonalement contre la/les tuile(s) de départ, puis placez un groupe de 3 unités dans un territoire vide de cette tuile.`,
    'Tour 2 : posez une 2e tuile contre n’importe quelle tuile posée (frontières continues), puis 3 unités dans un territoire vide de cette tuile — jamais dans le même territoire que votre premier groupe.',
    'Remettez votre 3e tuile dans la pile et mélangez-la.',
    'Aucun pouvoir spécial ne rapporte de ressource, renommée ou autre avantage pendant la mise en place.',
  ];
  if (m.warchiefs) lDetails.push('Chefs de guerre : vous pouvez remplacer une de vos unités par votre chef de guerre (2 unités + chef).');
  if (config.players.some((p) => p.clan === 'bear')) lDetails.push('Ours : Kaija peut être placée comme une unité normale.');
  if (m.creatures)
    lDetails.push(
      'Créatures : si la tuile posée contient un repaire, AVANT de placer vos unités, une créature apparaît (piochez une carte, ajoutez-la à droite de la ligne, figurine sur le repaire). En mise en place, elle ne bouge pas et n’applique pas son effet. Vous pouvez ensuite placer vos unités dans son territoire.',
    );
  steps.push({ id: 'L', letter: 'L', title: 'Placement des tuiles et des clans', details: lDetails, interactive: 'tilePlacement' });

  if (m.environmentTiles) {
    const regular = m.envTiles.filter((t) => t !== 'wyvernDen');
    if (regular.length)
      steps.push({
        id: 'L2',
        letter: 'L+',
        title: 'Tuiles Environnement',
        module: 'Wilderness',
        details: [
          `Mélangez ces tuiles Environnement avec la pile de tuiles Carte : ${regular.map((t) => ENV_TILES[t].name).join(', ')}.`,
        ],
      });
    if (m.envTiles.includes('wyvernDen'))
      steps.push({
        id: 'L3',
        letter: 'M+',
        title: 'Antre de la Wyverne',
        module: 'Wilderness',
        details: [
          `Prenez les ${3 * n} premières tuiles de la pile (3 × ${n} joueurs) et mettez-les de côté.`,
          'Mélangez l’Antre de la Wyverne avec le reste de la pile.',
          `Reposez les ${3 * n} tuiles mises de côté SUR la pile.`,
        ],
      });
  }
  if (m.teamPlay)
    steps.push({
      id: 'T',
      letter: '👥',
      title: 'Équipes',
      module: 'Variante',
      details: [
        `Équipe 1 : ${name(0)} & ${name(2)} — Équipe 2 : ${name(1)} & ${name(3)}.`,
        'Les coéquipiers sont assis face à face ; les tours alternent entre les équipes.',
      ],
    });
  steps.push({
    id: 'M',
    letter: 'M',
    title: 'Que la partie commence !',
    details: [`La partie dure ${totalYears(m)} ans. Le premier joueur commence l’année 1.`],
  });
  return steps;
}
