export interface RuleSection {
  id: string;
  title: string;
  items: string[];
}

export const PHASE_LABELS = {
  start: '1. Début de l’année',
  actions: '2. Actions',
  creatures: '2.5 Créatures',
  harvest: '3. Récolte',
  winter: '4. Hiver',
  end: '5. Fin de l’année',
} as const;

export const TURN_OPTIONS = [
  {
    id: 'play',
    label: 'A. Jouer une carte',
    icon: '🃏',
    rule:
      'Jouez 1 carte de votre main face visible dans votre zone active et résolvez son action. Les cartes Éclair ⚡ peuvent être jouées en nombre illimité avant et après l’action principale (une à la fois).',
  },
  {
    id: 'wait',
    label: 'B. Attendre',
    icon: '⏳',
    rule: 'Placez 1 carte de votre main dans la zone active SANS résoudre son effet.',
  },
  {
    id: 'replace',
    label: 'C. Remplacer une carte',
    icon: '🔄',
    rule: 'Placez 1 carte dans la zone active sans effet, payez 1 savoir, puis piochez 1 carte.',
  },
  {
    id: 'remove',
    label: 'D. Retirer une carte',
    icon: '🗑️',
    rule: 'Remettez 1 carte de votre main dans la boîte (retirée du jeu), payez 2 savoir, puis piochez 2 cartes.',
  },
  {
    id: 'upgrade',
    label: 'E. Améliorer',
    icon: '⬆️',
    rule:
      'Placez 1 carte dans la zone active sans effet OU retirez-la du jeu (au choix), payez 3 savoir, et prenez une de vos cartes d’amélioration de Clan EN MAIN (jouable lors d’un tour suivant).',
  },
] as const;

export const CARD_ACTIONS = [
  {
    id: 'recruit',
    label: 'Recruter',
    icon: '➕',
    rules: [
      'Placez jusqu’au nombre indiqué de nouvelles unités dans des territoires que vous contrôlez (répartition libre).',
      'Pas de limite par territoire ; limité seulement par les figurines de votre réserve.',
      'Camp d’entraînement : +1 unité par Camp dans un territoire où vous recrutez au moins 1 unité.',
      'Si vous n’avez plus d’unités sur la carte, vous pouvez recruter dans un territoire neutre.',
    ],
  },
  {
    id: 'explore',
    label: 'Explorer',
    icon: '🧭',
    rules: [
      'Piochez 1 tuile et placez-la orthogonalement, à côté d’un de VOS territoires OUVERTS.',
      'Les frontières doivent se prolonger (pas de frontière interrompue).',
      'Interdit de fusionner des territoires contenant des unités de joueurs différents (pas de combat par exploration).',
      'Si aucune tuile piochée ne peut être placée : sous la pile, et piochez-en une autre. Les « trous » sont autorisés.',
      'Fermer un territoire que vous contrôlez : + renommée = nombre de tuiles du territoire fermé. Fermer celui d’un autre : personne ne gagne.',
    ],
  },
  {
    id: 'move',
    label: 'Déplacer',
    icon: '🥾',
    rules: [
      'Chaque mouvement : déplacez autant d’unités que voulu d’un territoire contrôlé vers un territoire adjacent (1 frontière).',
      'Frontière difficile (jaune) : coûte 1 mouvement supplémentaire (dans la même action uniquement).',
      'On ne traverse pas un territoire ennemi : entrer chez un ennemi arrête le mouvement et déclenche un combat.',
      'Effectuez TOUS les mouvements, puis résolvez TOUS les combats (le joueur actif choisit l’ordre).',
      'Créatures : après les mouvements et avant les combats, déclarez au plus 1 créature attaquée par territoire partagé.',
    ],
  },
  {
    id: 'build',
    label: 'Construire',
    icon: '🔨',
    rules: [
      'Placez 1 bâtiment dans un territoire que vous contrôlez, sur un emplacement correspondant.',
      'Petit bâtiment : 1 bois. Grand bâtiment : 3 bois.',
      'Pas deux bâtiments du même type dans un même territoire.',
      'La Pierre gravée ne se construit que sur un petit emplacement avec le symbole Pierre gravée.',
      'Les bâtiments ne peuvent jamais être déplacés ni retirés.',
    ],
  },
  {
    id: 'draw',
    label: 'Piocher',
    icon: '📥',
    rules: [
      'Suivez la carte : garder en main / défausser / remettre sur la pioche (vous choisissez l’ordre).',
      'Ne s’applique qu’aux cartes piochées par cette action.',
      'La carte jouée reste dans la zone active (pas dans la défausse).',
      'S’il n’y a pas assez de cartes (pioche + défausse), l’action ne peut pas être jouée.',
    ],
  },
  {
    id: 'special',
    label: 'Spéciale',
    icon: '✨',
    rules: [
      'Suivez simplement le texte de la carte.',
      'Les cartes ont toujours raison : leur texte prime sur le livret de règles.',
    ],
  },
] as const;

export const BUILDINGS = [
  { name: 'Silo à nourriture', size: 'Petit (1 bois)', effect: 'Récolte : +1 nourriture.' },
  { name: 'Cabane de bûcheron', size: 'Petit (1 bois)', effect: 'Récolte : +1 bois.' },
  { name: 'Tour de défense', size: 'Petit (1 bois)', effect: 'Combat : le défenseur inflige +1 perte (crâne) par Tour.' },
  {
    name: 'Camp d’entraînement',
    size: 'Petit (1 bois)',
    effect: 'Recrutement : +1 unité par Camp dans le territoire où vous recrutez (seulement « recruter »).',
  },
  { name: 'Pierre gravée', size: 'Petit (1 bois), emplacement spécial', effect: 'Récolte : +1 savoir.' },
  { name: 'Forteresse', size: 'Grand (3 bois)', effect: 'Combat : +2 points de combat au défenseur.' },
  { name: 'Forge', size: 'Grand (3 bois)', effect: 'Début d’année : piochez +1 carte par Forge contrôlée.' },
  { name: 'Autel des Rois', size: 'Grand (3 bois)', effect: 'Récolte : +3 renommée par Autel contrôlé.' },
];

/** Coût de l'Hiver selon le nombre d'unités sur la carte. */
export const WINTER_COSTS = [
  { min: 1, max: 3, food: 0, wood: 0 },
  { min: 4, max: 6, food: 1, wood: 0 },
  { min: 7, max: 9, food: 2, wood: 0 },
  { min: 10, max: 12, food: 3, wood: 1 },
  { min: 13, max: Infinity, food: 4, wood: 2 },
];

export const DIE_FACES = [
  { id: 'x2', label: '⚔️×2', desc: '2 points de combat', points: 2, skulls: 0 },
  { id: 'x3', label: '⚔️×3', desc: '3 points de combat', points: 3, skulls: 0 },
  { id: 'choice', label: '💀 / ⚔️', desc: 'Au choix : 1 point OU 1 perte', points: 0, skulls: 0 },
  { id: 'x2s', label: '⚔️×2 + 💀', desc: '2 points + 1 perte', points: 2, skulls: 1 },
  { id: 'ss', label: '💀💀', desc: '2 pertes', points: 0, skulls: 2 },
  { id: 'x1s', label: '⚔️ + 💀', desc: '1 point + 1 perte', points: 1, skulls: 1 },
] as const;

export type DieFaceId = (typeof DIE_FACES)[number]['id'];

export const REFERENCE: RuleSection[] = [
  {
    id: 'goal',
    title: '🎯 But du jeu',
    items: [
      'Victoire immédiate : en Fin d’année, contrôler 3 territoires FERMÉS contenant chacun au moins 1 grand bâtiment (Autel des Rois, Forge, Forteresse).',
      'Sinon : le plus de renommée à la fin de la 7e année.',
      'La victoire 1 prime sur la victoire 2.',
      'Égalités (victoire 1) : plus de renommée, puis plus de territoires contrôlés, puis plus d’unités sur la carte, puis plus de bâtiments.',
    ],
  },
  {
    id: 'deck',
    title: '🃏 Deck building',
    items: [
      '4 zones : pioche (face cachée), main, zone active (cartes jouées cette année), défausse.',
      'On ne mélange la défausse pour refaire une pioche QUE lorsqu’on doit piocher dans une pioche vide (à n’importe quelle phase).',
      'Les cartes de la zone active ne retournent à la défausse que lorsque vous passez.',
    ],
  },
  {
    id: 'glossary',
    title: '📖 Glossaire',
    items: [
      'Territoire contrôlé : au moins 1 de vos unités dedans. Neutre : aucune unité (même avec des bâtiments).',
      'Territoire fermé : entièrement délimité par des frontières ; ne peut plus être étendu.',
      'Adjacent : au moins une frontière commune (un coin ne suffit pas).',
      'Frontière difficile (jaune) : +1 mouvement pour la franchir ; jamais franchissable en retraite.',
      'Frontière infranchissable (orange, Wilderness) : jamais franchissable ; territoires non adjacents.',
    ],
  },
  {
    id: 'combat',
    title: '⚔️ Combat (étapes)',
    items: [
      '1. Forces : 1 point par unité (Chef de guerre ×2, Kaija ×2).',
      '2. Bonus : attaquant = bonus de la carte Déplacement / clan ; défenseur = bâtiments (Forteresse +2, Tour +1 perte) / clan.',
      '3. Nourriture : en commençant par l’attaquant, chaque camp défausse jusqu’à 1 nourriture PAR unité ; +1 point par nourriture.',
      '4. Dés : l’attaquant lance d’abord et décide du 💀/⚔️ avant que le défenseur lance.',
      '5. Vainqueur : si un camp subit autant de pertes que d’unités, il perd. Sinon, le plus haut score gagne ; égalité → défenseur.',
      '6. Pertes : retirez 1 unité par 💀 reçu.',
      '7. Retraite : le perdant répartit ses unités restantes dans des territoires adjacents amis ou neutres par frontière normale, hors combat. Sinon, elles sont retirées.',
      'Les bâtiments ne sont jamais détruits ; ils changent de propriétaire.',
    ],
  },
  {
    id: 'fame',
    title: '⭐ Sources de renommée',
    items: [
      'Exploration : fermer un territoire que l’on contrôle = nombre de tuiles du territoire.',
      'Récolte : territoire fermé de 2 tuiles = 1 ; de 3 tuiles ou plus = 2 (1 tuile = 0).',
      'Récolte : 3 par Autel des Rois.',
      'Fin de partie : valeur des cartes Développement et Succès ; 1 par lot de 3 ressources ; −5 par carte Troubles.',
      'Module Créatures : vaincre une créature (valeur sur la carte).',
    ],
  },
  {
    id: 'secondChance',
    title: '🔁 Seconde chance',
    items: [
      'En Fin d’année, un joueur sans unité sur la carte place 3 nouvelles unités dans un territoire neutre (même deck, ressources et renommée).',
      'S’il n’y a aucun territoire neutre : il pioche une tuile et la place pour en créer un.',
    ],
  },
  {
    id: 'variants',
    title: '🎲 Variantes',
    items: [
      'Partie longue : 10 ans, retourner la piste ; 3 cartes Dév. précoces et 6 avancées par joueur ; seule la victoire à la renommée compte.',
      'Équipes (4 joueurs) : coéquipiers face à face ; échanges de ressources 1:1 à la Récolte ; victoire 1 = 5 territoires fermés avec grand bâtiment ; scores additionnés.',
      'Plus de créatures ! : en passant, après avoir pris sa carte, le joueur PEUT faire apparaître une créature (seulement s’il y a moins de créatures que de joueurs) dans un territoire avec repaire libre (sinon n’importe quel territoire sans créature). Elle ne bouge pas mais s’active.',
    ],
  },
];
