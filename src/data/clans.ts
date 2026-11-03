import type { ClanId } from '../types';

export interface ClanInfo {
  id: ClanId;
  name: string;
  emoji: string;
  power: string;
  warchief: { name: string; title: string; power: string };
}

export const CLANS: Record<ClanId, ClanInfo> = {
  bear: {
    id: 'bear',
    name: 'Clan de l’Ours',
    emoji: '🐻',
    power:
      'Kaija, l’Ourse cuirassée : se recrute comme une unité normale (même en mise en place). Vaut ×2 en combat. Peut se déplacer avec d’autres unités mais ne peut PAS entrer dans un territoire ennemi. Ne compte pas pour le coût de l’Hiver.',
    warchief: {
      name: 'Borgild',
      title: 'Cheffe de guerre de l’Ours',
      power: 'Si Borgild est en défense, elle vaut ×3 au lieu de ×2.',
    },
  },
  boar: {
    id: 'boar',
    name: 'Clan du Sanglier',
    emoji: '🐗',
    power: 'Chaque fois que le Sanglier explore SANS fermer de territoire, il gagne 1 savoir.',
    warchief: {
      name: 'Svarn',
      title: 'Chef de guerre du Sanglier',
      power:
        'Si Svarn est dans un territoire ouvert ou un territoire avec un symbole savoir (les icônes des bâtiments ne comptent pas), il vaut ×3 au lieu de ×2.',
    },
  },
  goat: {
    id: 'goat',
    name: 'Clan de la Chèvre',
    emoji: '🐐',
    power: 'Chaque fois que la Chèvre construit : +1 nourriture pour un petit bâtiment, +2 nourriture pour un grand.',
    warchief: {
      name: 'Halvard',
      title: 'Chef de guerre de la Chèvre',
      power: 'Si Halvard est en défense, ignorez 1 perte (crâne) infligée par l’attaquant.',
    },
  },
  raven: {
    id: 'raven',
    name: 'Clan du Corbeau',
    emoji: '🐦‍⬛',
    power:
      'Chaque fois que le Corbeau ferme un (des) territoire(s) qu’il contrôle en explorant, il collecte immédiatement les ressources de ces territoires (tuiles et bâtiments) comme lors de la Récolte.',
    warchief: {
      name: 'Liv',
      title: 'Cheffe de guerre du Corbeau',
      power:
        'À l’étape 4 du combat, vous pouvez relancer le dé une fois (le nouveau résultat s’impose). Si Liv attaque, la relance se fait avant le jet du défenseur.',
    },
  },
  snake: {
    id: 'snake',
    name: 'Clan du Serpent',
    emoji: '🐍',
    power:
      'Jeton Terre brûlée : avant de résoudre une carte de Clan (initiale ou amélioration), le Serpent peut placer le jeton dans un territoire neutre ou ennemi adjacent à ses territoires. +1 point de combat (attaque ou défense) dans ce territoire. À la Récolte, si le jeton est en territoire ennemi, le Serpent peut y prendre 1 ressource (y compris d’un bâtiment) à la place du propriétaire.',
    warchief: {
      name: 'Signy',
      title: 'Cheffe de guerre du Serpent',
      power: 'À l’étape 1 du combat, vous pouvez placer le jeton Terre brûlée dans le territoire de Signy.',
    },
  },
  stag: {
    id: 'stag',
    name: 'Clan du Cerf',
    emoji: '🦌',
    power:
      'Chaque fois que le Cerf conquiert un nouveau territoire par un combat : +1 renommée. Quand il ferme un (des) territoire(s) qu’il contrôle en explorant : +1 renommée supplémentaire par territoire.',
    warchief: {
      name: 'Brand',
      title: 'Chef de guerre du Cerf',
      power:
        'À l’étape 1 du combat, vous pouvez déplacer 1 unité alliée d’un territoire adjacent dans le territoire de Brand (en ignorant les frontières difficiles).',
    },
  },
  wolf: {
    id: 'wolf',
    name: 'Clan du Loup',
    emoji: '🐺',
    power: 'Chaque fois que le Loup gagne un combat en tant qu’attaquant, il gagne 1 nourriture.',
    warchief: {
      name: 'Egil',
      title: 'Chef de guerre du Loup',
      power: 'Si Egil attaque, il vaut ×3 au lieu de ×2.',
    },
  },
};

export const CLAN_IDS = Object.keys(CLANS) as ClanId[];

export const PLAYER_COLORS: { id: string; label: string; css: string }[] = [
  { id: 'red', label: 'Rouge', css: '#c0392b' },
  { id: 'blue', label: 'Bleu', css: '#2e86de' },
  { id: 'yellow', label: 'Jaune', css: '#f1c40f' },
  { id: 'purple', label: 'Violet', css: '#8e44ad' },
  { id: 'green', label: 'Vert', css: '#27ae60' },
  { id: 'white', label: 'Blanc', css: '#ecf0f1' },
];

export function colorCss(id: string): string {
  return PLAYER_COLORS.find((c) => c.id === id)?.css ?? '#888';
}
