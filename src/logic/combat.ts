import { DIE_FACES, type DieFaceId } from '../data/reference';
import type { ClanId } from '../types';
import { translate, type Language } from '../i18n/messages';

export interface PlayerSide {
  kind: 'player';
  units: number;
  warchief: ClanId | null;
  /** Svarn : territoire ouvert ou avec symbole savoir */
  svarnBoost: boolean;
  kaija: boolean;
  bonusPoints: number;
  fortresses: number;
  towers: number;
  scorchedEarth: boolean;
  food: number;
  extraSkulls: number;
  die: DieFaceId;
  /** Pour la face 💀/⚔️ : true = perte, false = point */
  choiceSkull: boolean;
}

export interface CreatureSide {
  kind: 'creature';
  combatValue: number;
  die: DieFaceId;
}

export type Side = PlayerSide | CreatureSide;

export interface SideResult {
  figures: number;
  score: number;
  skullsInflicted: number;
  foodUsed: number;
  breakdown: string[];
}

export interface CombatResult {
  attacker: SideResult;
  defender: SideResult;
  attackerLosses: number;
  defenderLosses: number;
  winner: 'attacker' | 'defender' | 'none';
  explanation: string;
}

export function warchiefValue(side: PlayerSide, role: 'attacker' | 'defender'): number {
  if (!side.warchief) return 0;
  if (side.warchief === 'wolf' && role === 'attacker') return 3;
  if (side.warchief === 'bear' && role === 'defender') return 3;
  if (side.warchief === 'boar' && side.svarnBoost) return 3;
  return 2;
}

function evalSide(side: Side, role: 'attacker' | 'defender', vsCreature: boolean, language: Language): SideResult {
  const t = (message: string, value: number) => translate(language, message, { value });
  const face = DIE_FACES.find((f) => f.id === side.die)!;
  const breakdown: string[] = [];
  if (side.kind === 'creature') {
    // Une créature choisit toujours la perte sur la face 💀/⚔️.
    const skulls = face.skulls + (face.id === 'choice' ? 1 : 0);
    breakdown.push(t('Valeur de combat : {value}', side.combatValue), t('Dé : +{value}', face.points));
    return {
      figures: Infinity,
      score: side.combatValue + face.points,
      skullsInflicted: skulls,
      foodUsed: 0,
      breakdown,
    };
  }
  const figures = side.units + (side.warchief ? 1 : 0) + (side.kaija ? 1 : 0);
  let score = side.units;
  breakdown.push(t('Unités : +{value}', side.units));
  const wc = warchiefValue(side, role);
  if (wc) {
    score += wc;
    breakdown.push(t('Chef de guerre : +{value}', wc));
  }
  if (side.kaija) {
    score += 2;
    breakdown.push('Kaija : +2');
  }
  if (side.bonusPoints) {
    score += side.bonusPoints;
    breakdown.push(t('Bonus (carte/clan) : +{value}', side.bonusPoints));
  }
  if (role === 'defender' && side.fortresses) {
    score += side.fortresses * 2;
    breakdown.push(t('Forteresse : +{value}', side.fortresses * 2));
  }
  if (side.scorchedEarth) {
    score += 1;
    breakdown.push(translate(language, 'Terre brûlée : +1'));
  }
  const foodUsed = Math.max(0, Math.min(side.food, figures));
  if (foodUsed) {
    score += foodUsed;
    breakdown.push(translate(language, foodUsed < side.food ? 'Nourriture : +{value} (max {max})' : 'Nourriture : +{value}', { value: foodUsed, max: figures }));
  }
  const choicePoint = face.id === 'choice' && !side.choiceSkull ? 1 : 0;
  const choiceSkull = face.id === 'choice' && side.choiceSkull ? 1 : 0;
  const diePoints = face.points + choicePoint;
  if (diePoints) {
    score += diePoints;
    breakdown.push(t('Dé : +{value}', diePoints));
  }
  let skulls = face.skulls + choiceSkull + side.extraSkulls;
  if (role === 'defender') skulls += side.towers;
  if (vsCreature && skulls > 0) {
    breakdown.push(t('({value} 💀 ignoré(s) contre une créature)', skulls));
    skulls = 0;
  }
  return { figures, score, skullsInflicted: skulls, foodUsed, breakdown };
}

export function resolveCombat(attacker: Side, defender: Side, language: Language = 'fr'): CombatResult {
  const vsCreature = attacker.kind === 'creature' || defender.kind === 'creature';
  const a = evalSide(attacker, 'attacker', vsCreature, language);
  const d = evalSide(defender, 'defender', vsCreature, language);

  let skullsOnDefender = a.skullsInflicted;
  if (defender.kind === 'player' && defender.warchief === 'goat' && skullsOnDefender > 0) {
    skullsOnDefender -= 1;
    d.breakdown.push(translate(language, 'Halvard : ignore 1 💀 de l’attaquant'));
  }
  const skullsOnAttacker = d.skullsInflicted;

  const attackerWiped = attacker.kind === 'player' && skullsOnAttacker >= a.figures;
  const defenderWiped = defender.kind === 'player' && skullsOnDefender >= d.figures;

  const attackerLosses = attacker.kind === 'player' ? Math.min(skullsOnAttacker, a.figures) : 0;
  const defenderLosses = defender.kind === 'player' ? Math.min(skullsOnDefender, d.figures) : 0;

  let winner: CombatResult['winner'];
  let explanation: string;
  if (attackerWiped && defenderWiped) {
    winner = 'none';
    explanation = 'Les deux camps perdent toutes leurs unités : personne ne gagne.';
  } else if (attackerWiped) {
    winner = 'defender';
    explanation = 'L’attaquant subit autant de pertes que d’unités : il perd.';
  } else if (defenderWiped) {
    winner = 'attacker';
    explanation = 'Le défenseur subit autant de pertes que d’unités : il perd.';
  } else if (a.score > d.score) {
    winner = 'attacker';
    explanation = translate(language, 'Score {attacker} contre {defender} : l’attaquant gagne.', { attacker: a.score, defender: d.score });
  } else if (a.score < d.score) {
    winner = 'defender';
    explanation = translate(language, 'Score {attacker} contre {defender} : le défenseur gagne.', { attacker: a.score, defender: d.score });
  } else {
    winner = 'defender';
    explanation = translate(language, 'Égalité {score} partout : le défenseur gagne.', { score: a.score });
  }
  return { attacker: a, defender: d, attackerLosses, defenderLosses, winner, explanation: translate(language, explanation) };
}

export function defaultPlayerSide(): PlayerSide {
  return {
    kind: 'player',
    units: 3,
    warchief: null,
    svarnBoost: false,
    kaija: false,
    bonusPoints: 0,
    fortresses: 0,
    towers: 0,
    scorchedEarth: false,
    food: 0,
    extraSkulls: 0,
    die: 'x2',
    choiceSkull: false,
  };
}
