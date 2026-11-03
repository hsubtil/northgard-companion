import type { CreatureId } from '../types';

export type CreatureSource = 'core' | 'wilderness' | 'wildernessEnv';

export interface CreatureInfo {
  id: CreatureId;
  name: string;
  emoji: string;
  source: CreatureSource;
  /** Couleurs des figurines disponibles (ordre d'identification) */
  colors: string[];
  /** Partage-t-elle son territoire avec les unités des joueurs ? */
  sharesTerritory: boolean;
  power: string;
  notes?: string[];
  /** Valeurs connues des règles (sinon : lire la carte) */
  combatValue?: number;
  fame?: number;
}

export const CREATURE_COLOR_LABEL: Record<string, string> = {
  beige: 'Beige',
  brown: 'Brun',
  darkBrown: 'Brun foncé',
};

export const CREATURES: Record<CreatureId, CreatureInfo> = {
  wolf: {
    id: 'wolf',
    name: 'Loup',
    emoji: '🐺',
    source: 'core',
    colors: ['beige', 'brown', 'darkBrown'],
    sharesTerritory: true,
    combatValue: 5,
    power:
      'Un territoire avec ce Loup ne génère ni renommée ni ressources pendant la Récolte (sauf celles des bâtiments).',
    notes: [
      'Le Serpent ne peut pas récolter une ressource non produite par un bâtiment dans un territoire brûlé occupé par un Loup.',
    ],
  },
  brownBear: {
    id: 'brownBear',
    name: 'Ours brun',
    emoji: '🐻',
    source: 'core',
    colors: ['beige', 'brown'],
    sharesTerritory: true,
    power:
      'Dans son territoire, un joueur ne peut ni construire ni recruter, ni explorer, ni en faire sortir des unités (on peut y entrer, mais pas en sortir).',
    notes: [
      'Si le joueur est attaqué par un adversaire et perd, il peut quand même battre en retraite normalement.',
      'Une action Déplacement peut être jouée sans déplacer d’unités pour attaquer la créature déjà présente.',
    ],
  },
  draugr: {
    id: 'draugr',
    name: 'Draugr',
    emoji: '💀',
    source: 'core',
    colors: ['beige', 'brown'],
    sharesTerritory: true,
    power: 'Quand il apparaît ou se déplace dans un territoire contrôlé, ce joueur retire 1 unité de ce territoire.',
  },
  fallenValkyrie: {
    id: 'fallenValkyrie',
    name: 'Valkyrie déchue',
    emoji: '🪽',
    source: 'core',
    colors: ['beige', 'brown'],
    sharesTerritory: false,
    combatValue: 7,
    fame: 4,
    power:
      'Ne partage pas son territoire : elle attaque le joueur quand elle apparaît ou se déplace dans un territoire contrôlé.',
  },
  draugrJotunn: {
    id: 'draugrJotunn',
    name: 'Draugr Jötunn',
    emoji: '🧟',
    source: 'wilderness',
    colors: ['beige', 'brown'],
    sharesTerritory: true,
    power:
      'Quand il apparaît ou se déplace dans un territoire contrôlé, ce joueur doit payer 2 ressources (au choix). Sinon, il attaque.',
    notes: [
      'Il partage son territoire : on peut y entrer et y rester sans le combattre.',
      'Si le joueur n’a qu’1 ressource, il doit la payer ET il est attaqué.',
    ],
  },
  eldthurs: {
    id: 'eldthurs',
    name: 'Eldthurs',
    emoji: '🔥',
    source: 'wilderness',
    colors: ['beige', 'brown'],
    sharesTerritory: true,
    power:
      'Quand il apparaît ou se déplace dans un territoire contrôlé, ce joueur doit retirer un de ses petits bâtiments de ce territoire (retour à la réserve).',
  },
  hvedrung: {
    id: 'hvedrung',
    name: 'Hvedrung',
    emoji: '🧙',
    source: 'wilderness',
    colors: ['beige'],
    sharesTerritory: true,
    power:
      'Quand il apparaît ou se déplace dans un territoire, piochez une nouvelle carte Créature : placez-la JUSTE APRÈS Hvedrung dans la ligne et sa figurine dans le territoire de Hvedrung.',
    notes: ['La nouvelle créature s’activera donc juste après Hvedrung pendant cette même phase.'],
  },
  spectralWarrior: {
    id: 'spectralWarrior',
    name: 'Guerrier spectral',
    emoji: '👻',
    source: 'wildernessEnv',
    colors: ['beige', 'brown'],
    sharesTerritory: true,
    power:
      'Les bâtiments de son territoire n’ont aucun effet (pas de ressources ni de renommée, pas de bonus de combat…). Quand il est éliminé, retirez sa carte et sa figurine du jeu.',
    notes: ['N’est jamais dans la pioche Créature : il arrive via le Cimetière ancestral.'],
  },
  wyvern: {
    id: 'wyvern',
    name: 'Wyverne',
    emoji: '🐉',
    source: 'wildernessEnv',
    colors: ['beige'],
    sharesTerritory: false,
    combatValue: 9,
    power:
      'Ne partage pas son territoire et attaque quand elle entre dans un nouveau territoire. Tous les territoires lui sont adjacents pour le déplacement. Avant le combat, retirez 1 unité du joueur (qu’il attaque ou défende). Si elle perd hors de son Antre : replacez-la sur son Antre. Si elle perd dans son Antre : retirée du jeu.',
    notes: ['N’est jamais dans la pioche Créature : elle arrive quand l’Antre de la Wyverne est exploré.'],
  },
};

export const CREATURE_PRIORITIES = [
  { icon: '🏠', label: 'Le plus de points de bâtiment (petit = 1, grand = 3)' },
  { icon: '👥', label: 'Le plus d’unités' },
  { icon: '🌾', label: 'Le plus de ressources (tuiles + bâtiments)' },
];

export const CREATURE_MOVE_RULES = [
  'Une créature DOIT se déplacer si possible ; sinon elle s’active sans bouger.',
  'Elle va dans un territoire adjacent en ignorant les frontières difficiles (jamais à travers une frontière infranchissable).',
  'Elle n’entre jamais dans un territoire déjà occupé par une autre créature.',
  'Elle va d’abord vers un territoire avec des unités de joueurs ; vers un territoire neutre seulement s’il n’y a pas d’autre choix.',
  'En cas d’égalité : appliquer les priorités de la carte de gauche à droite. Égalité persistante → le premier joueur choisit.',
  'Puis appliquer son effet (déplacement AVANT effet).',
];
