export interface ExpansionInfo {
  id: string;
  name: string;
  available: boolean;
  description: string;
}

/**
 * Extensions connues. Pour ajouter une nouvelle extension (ex. Uncharted Horizon
 * quand ses règles seront disponibles), passez `available` à true et ajoutez ses
 * données/étapes dans src/data et src/logic (voir README).
 */
export const EXPANSIONS: ExpansionInfo[] = [
  {
    id: 'core',
    name: 'Jeu de base',
    available: true,
    description: 'Northgard: Uncharted Lands + module Créatures (Loups, Ours bruns, Draugar, Valkyries déchues).',
  },
  {
    id: 'wilderness',
    name: 'Wilderness',
    available: true,
    description: 'Nouvelles créatures (Draugr Jötunn, Eldthurs, Hvedrung, Guerriers spectraux, Wyverne) + module Tuiles Environnement.',
  },
  {
    id: 'warchiefs',
    name: 'Warchiefs',
    available: true,
    description: 'Module Chefs de guerre (7 héros) + figurine Kaija + plateaux modulaires + 7 nouvelles cartes d’amélioration.',
  },
  {
    id: 'unchartedHorizon',
    name: 'Uncharted Horizon',
    available: false,
    description: 'À venir : les règles ne sont pas encore intégrées. L’application est prête à les accueillir.',
  },
];
