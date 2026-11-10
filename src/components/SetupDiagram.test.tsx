import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { LanguageContext } from '../i18n/hooks';
import { translate, type Language } from '../i18n/messages';
import { buildSetupSteps } from '../logic/setup';
import { GameContext } from '../state/context';
import { initialState } from '../state/store';
import type { GameState } from '../types';
import { SetupDiagram } from './SetupDiagram';

function configured(count: number): GameState {
  const clans = ['bear', 'boar', 'goat', 'raven', 'snake'] as const;
  const colors = ['red', 'blue', 'yellow', 'purple', 'green'];
  return {
    ...initialState(),
    stage: 'setup',
    config: {
      players: Array.from({ length: count }, (_, i) => ({
        id: `p${i}`, name: `Player ${i + 1}`, color: colors[i], clan: clans[i],
      })),
      modules: initialState().config.modules,
    },
  };
}

function diagram(state: GameState, language: Language = 'en'): string {
  const steps = buildSetupSteps(state.config, state.firstPlayer, language);
  return renderToStaticMarkup(
    <LanguageContext.Provider value={{ language, setLanguage: vi.fn(), t: (message, values) => translate(language, message, values) }}>
      <GameContext.Provider value={{ state, dispatch: vi.fn(), canUndo: false }}>
        <SetupDiagram steps={steps} />
      </GameContext.Provider>
    </LanguageContext.Provider>,
  );
}

describe('setup table diagram', () => {
  it('links every enabled setup step and hides disabled modules', () => {
    const state = configured(3);
    const html = diagram(state);
    expect(html).toContain('<details class="setup-diagram panel" open="">');
    expect(html).toContain('<summary class="diagram-summary">');
    for (const step of buildSetupSteps(state.config, 0)) {
      expect(html).toContain(`href="#setup-step-${step.id}"`);
    }
    expect(html).not.toContain('setup-step-K2');
    expect(html).not.toContain('setup-step-L2');
    expect(html).not.toContain('setup-step-L3');
    expect(html).not.toContain('setup-step-T');
    expect(html).toContain('1 starting tile(s) in the center');
    expect(html).toContain('Then 6 tiles placed');
    expect(html).toContain('0/13 steps ready');
  });

  it('reflects completion without counting stale disabled steps', () => {
    const state = { ...configured(2), setupDone: ['A', 'K2', 'not-a-step'] };
    const html = diagram(state);
    expect(html).toContain('1/13 steps ready');
    expect(html).toContain('diagram-step done');
    expect(html).toContain('checked=""');
    expect(html).toContain('Complete step B: Year track');
    expect(html).toContain('Do this next');
  });

  it('shows five-player, long-game and expansion quantities', () => {
    const state = configured(5);
    state.config.modules = {
      ...state.config.modules, longGame: true, creatures: true, warchiefs: true,
      environmentTiles: true, envTiles: ['wyvernDen', 'greatLake'],
    };
    const html = diagram(state);
    expect(html).toContain('2 starting tile(s) in the center');
    expect(html).toContain('Then 10 tiles placed');
    expect(html).toContain('Duration: 10 years');
    expect(html).toContain('15 + 30');
    expect(html).toContain('14 units · 3 upgrades set aside');
    expect(html).toContain('setup-step-K2');
    expect(html).toContain('setup-step-L2');
    expect(html).toContain('setup-step-L3');
    expect(html).toContain('Borgild');
  });

  it('updates seat order and starting resources with the first player', () => {
    const state = { ...configured(5), firstPlayer: 3 };
    const html = diagram(state);
    const areas = html.split('<article').slice(1);
    expect(areas).toHaveLength(5);
    expect(areas[0]).toContain('Player 4');
    expect(areas[0]).toContain('First player');
    expect(areas[0]).toContain('2 food + 2 wood');
    expect(areas[3]).toContain('Player 2');
    expect(areas[3]).toContain('3 food + 2 wood');
  });

  it('supports French and team setup without changing player names', () => {
    const state = configured(4);
    state.config.modules.teamPlay = true;
    const html = diagram(state, 'fr');
    expect(html).toContain('Plan de la table');
    expect(html).toContain('Player 1');
    expect(html).toContain('setup-step-T');
    expect(html).toContain('Pioche · 7 cartes');
  });
});
