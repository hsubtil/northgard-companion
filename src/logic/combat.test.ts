import { describe, expect, it } from 'vitest';
import { defaultPlayerSide, resolveCombat, type PlayerSide } from './combat';

const side = (patch: Partial<PlayerSide>): PlayerSide => ({ ...defaultPlayerSide(), ...patch });

describe('combat — exemples du livret de règles', () => {
  it('exemple #1 : le défenseur anéanti perd malgré un meilleur score', () => {
    const r = resolveCombat(
      side({ units: 5, food: 2, die: 'ss' }),
      side({ units: 2, fortresses: 1, towers: 1, food: 2, die: 'x2' }),
    );
    expect(r.attacker.score).toBe(7);
    expect(r.defender.score).toBe(8);
    expect(r.attackerLosses).toBe(1);
    expect(r.defenderLosses).toBe(2);
    expect(r.winner).toBe('attacker');
  });

  it('exemple #2 : égalité → le défenseur gagne', () => {
    const r = resolveCombat(
      side({ units: 4, bonusPoints: 1, die: 'x1s' }),
      side({ units: 2, fortresses: 1, towers: 1, food: 2, die: 'choice', choiceSkull: true }),
    );
    expect(r.attacker.score).toBe(6);
    expect(r.defender.score).toBe(6);
    expect(r.attackerLosses).toBe(2);
    expect(r.defenderLosses).toBe(1);
    expect(r.winner).toBe('defender');
  });

  it('combat contre un Loup : la créature choisit 💀, les 💀 du joueur ne comptent pas, égalité au défenseur', () => {
    const r = resolveCombat(side({ units: 3, food: 1, die: 'x1s' }), { kind: 'creature', combatValue: 5, die: 'choice' });
    expect(r.attacker.score).toBe(5);
    expect(r.defender.score).toBe(5);
    expect(r.defender.skullsInflicted).toBe(1);
    expect(r.attackerLosses).toBe(1);
    expect(r.defenderLosses).toBe(0);
    expect(r.winner).toBe('defender');
  });

  it('Valkyrie déchue attaque : la créature choisit 💀', () => {
    const r = resolveCombat({ kind: 'creature', combatValue: 7, die: 'choice' }, side({ units: 3, food: 3, die: 'ss' }));
    expect(r.attacker.score).toBe(7);
    expect(r.defender.score).toBe(6);
    expect(r.defenderLosses).toBe(1);
    expect(r.winner).toBe('attacker');
  });

  it('la nourriture est limitée à 1 par figurine (chef = 1 figurine)', () => {
    const r = resolveCombat(side({ units: 1, warchief: 'stag', food: 5, die: 'x2' }), side({ units: 1, die: 'x2' }));
    expect(r.attacker.foodUsed).toBe(2);
    expect(r.attacker.score).toBe(1 + 2 + 2 + 2);
  });

  it('pouvoirs des chefs : Egil ×3 en attaque, Borgild ×3 en défense, Halvard ignore 1 💀', () => {
    const egil = resolveCombat(side({ units: 0, warchief: 'wolf', die: 'x2' }), side({ units: 1, warchief: 'bear', die: 'x2' }));
    expect(egil.attacker.score).toBe(5);
    expect(egil.defender.score).toBe(1 + 3 + 2);
    const halvard = resolveCombat(side({ units: 3, die: 'ss' }), side({ units: 1, warchief: 'goat', die: 'x2' }));
    expect(halvard.defenderLosses).toBe(1);
    expect(halvard.winner).toBe('defender');
  });

  it('les deux camps anéantis : personne ne gagne', () => {
    const r = resolveCombat(side({ units: 1, die: 'ss' }), side({ units: 1, die: 'ss' }));
    expect(r.winner).toBe('none');
  });
});
