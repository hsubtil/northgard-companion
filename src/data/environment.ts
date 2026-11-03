import type { EnvTileId, Phase } from '../types';

export interface EnvTileInfo {
  id: EnvTileId;
  name: string;
  emoji: string;
  phases: (Phase | 'setup' | 'explore' | 'move')[];
  requiresCreatures: boolean;
  rule: string;
  notes?: string[];
}

export const ENV_TILES: Record<EnvTileId, EnvTileInfo> = {
  greatLake: {
    id: 'greatLake',
    name: 'Grand Lac',
    emoji: '🌊',
    phases: ['harvest'],
    requiresCreatures: false,
    rule:
      'Infranchissable. À la Récolte, le joueur qui totalise le plus d’unités dans les 4 territoires adjacents au lac gagne 2 nourriture. Égalité : chaque joueur à égalité gagne 1 nourriture.',
    notes: ['Cette nourriture n’appartient à aucun territoire : aucun pouvoir de clan ni carte ne peut l’utiliser.'],
  },
  swamp: {
    id: 'swamp',
    name: 'Marais',
    emoji: '🐸',
    phases: ['move'],
    requiresCreatures: false,
    rule:
      'Les unités peuvent traverser le Marais mais ne peuvent pas y terminer un déplacement ni y battre en retraite. Si des unités le traversent, leur propriétaire en retire une (retour à la réserve).',
    notes: [
      'Les créatures peuvent y terminer leur déplacement.',
      'Si un effet forcerait des unités à s’y arrêter, elles ne peuvent pas y entrer du tout.',
    ],
  },
  ruins: {
    id: 'ruins',
    name: 'Ruines',
    emoji: '🏛️',
    phases: ['harvest'],
    requiresCreatures: false,
    rule:
      'À la Récolte, le joueur contrôlant le territoire des Ruines collecte le savoir et la renommée indiqués sur la tuile — la renommée est gagnée même si le territoire n’est pas fermé.',
  },
  poisonousSwamp: {
    id: 'poisonousSwamp',
    name: 'Marais empoisonné',
    emoji: '☠️',
    phases: ['harvest'],
    requiresCreatures: false,
    rule: 'Infranchissable. À la fin de la Récolte, retirez 1 unité de chaque territoire adjacent.',
  },
  highPeaks: {
    id: 'highPeaks',
    name: 'Hauts Pics',
    emoji: '🏔️',
    phases: ['move'],
    requiresCreatures: false,
    rule:
      'Infranchissables. Les territoires de part et d’autre peuvent tout de même devenir adjacents si d’autres tuiles créent un passage (frontière normale ou difficile).',
  },
  geyser: {
    id: 'geyser',
    name: 'Geyser (×2)',
    emoji: '♨️',
    phases: ['end'],
    requiresCreatures: false,
    rule:
      'En Fin d’année, le joueur contrôlant un territoire avec un Geyser peut y placer 1 unité. Deux fois si les deux Geysers sont dans le même territoire.',
    notes: ['Ne se cumule pas avec le Camp d’entraînement.'],
  },
  ancestralGraveyard: {
    id: 'ancestralGraveyard',
    name: 'Cimetière ancestral',
    emoji: '⚰️',
    phases: ['setup', 'creatures'],
    requiresCreatures: true,
    rule:
      'Au début de la phase Créatures, le propriétaire du territoire du Cimetière peut placer un Guerrier spectral sur n’importe quel territoire avec au moins un repaire de créature. Ajoutez sa carte à la fin de la ligne de créatures.',
    notes: [
      'Mise en place : les Guerriers spectraux (figurines et cartes) sont mis de côté.',
      'Un Guerrier spectral vaincu est retiré du jeu et ne peut pas revenir.',
    ],
  },
  wyvernDen: {
    id: 'wyvernDen',
    name: 'Antre de la Wyverne',
    emoji: '🐉',
    phases: ['setup', 'explore', 'harvest'],
    requiresCreatures: true,
    rule:
      'Quand l’Antre est exploré, placez la Wyverne dessus et sa carte à la fin de la ligne de créatures. Territoire exceptionnel d’une seule tuile : il rapporte 2 renommée à son contrôleur pendant la Récolte.',
    notes: [
      'Mise en place : la Wyverne (figurine + carte) est mise de côté. Ne mélangez pas l’Antre avec les autres tuiles Environnement.',
    ],
  },
};

export const ENV_TILE_IDS = Object.keys(ENV_TILES) as EnvTileId[];
