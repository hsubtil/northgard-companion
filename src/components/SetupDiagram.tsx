import { colorCss } from '../data/clans';
import { useGameData, useI18n } from '../i18n';
import { advancedPerPlayer, earlyPerPlayer, orderFrom, startingResources, totalYears, upgradeCardsPerPlayer } from '../logic/rules';
import type { SetupStep } from '../logic/setup';
import { useGame } from '../state/context';

export function SetupDiagram({ steps }: { steps: SetupStep[] }) {
  const { state, dispatch } = useGame();
  const { t } = useI18n();
  const { CLANS } = useGameData();
  const { players, modules } = state.config;
  const nextStep = steps.find((step) => !state.setupDone.includes(step.id));
  const doneCount = steps.filter((step) => state.setupDone.includes(step.id)).length;

  function stepControls(ids: string[]) {
    return ids.map((id) => {
      const step = steps.find((item) => item.id === id);
      if (!step) return null;
      const done = state.setupDone.includes(id);
      return (
        <div key={id} className={`diagram-step ${done ? 'done' : ''} ${nextStep?.id === id ? 'current' : ''}`}>
          <label>
            <input
              type="checkbox"
              checked={done}
              onChange={() => dispatch({ type: 'TOGGLE_SETUP', id })}
              aria-label={t('Valider l’étape {letter} : {title}', { letter: step.letter, title: step.title })}
            />
            <span className="letter">{step.letter}</span>
          </label>
          <a
            href={`#setup-step-${id}`}
            onClick={(event) => {
              event.preventDefault();
              document.getElementById(`setup-step-${id}`)?.focus();
            }}
          >
            {step.title}
          </a>
          <span className="diagram-status">
            {done ? t('Prêt') : nextStep?.id === id ? t('À faire maintenant') : t('À préparer')}
          </span>
        </div>
      );
    });
  }

  return (
    <details className="setup-diagram panel" open>
      <summary className="diagram-summary">
        <span>{t('Plan de la table')}</span>
        <span className="badge" aria-live="polite">
          {t('{done}/{total} étapes prêtes', { done: doneCount, total: steps.length })}
        </span>
      </summary>
      <p className="muted small">
        {t('Disposition indicative, pas une carte à reproduire. Cliquez sur un intitulé pour voir les consignes ; cochez une étape pour toute la table une fois terminée.')}
      </p>
      <div className="diagram-table">
        <section className="diagram-zone diagram-supply">
          <h4>{t('Réserve commune')}</h4>
          <div className="diagram-tokens" aria-hidden="true">
            <span>⚔</span><span>★</span><span>🌾</span><span>🪵</span><span>📖</span><span>⌂</span>
          </div>
          {stepControls(['A'])}
        </section>
        <section className="diagram-zone diagram-years">
          <h4>{t('Piste des années')}</h4>
          <div className="diagram-track" aria-label={t('Durée : {years} ans', { years: totalYears(modules) })}>
            {Array.from({ length: totalYears(modules) }, (_, i) => (
              <span key={i} className={i === 0 ? 'current' : ''}>{i + 1}</span>
            ))}
          </div>
          {stepControls(['B'])}
        </section>
        <section className="diagram-zone diagram-cards">
          <h4>{t('Cartes communes')}</h4>
          <div className="diagram-decks">
            <div className="diagram-deck">
              <strong>10</strong><span>{t('Cartes Troubles')}</span>
            </div>
            <div className="diagram-deck">
              <strong>{earlyPerPlayer(modules) * players.length} + {advancedPerPlayer(modules) * players.length}</strong>
              <span>{t('Précoces au-dessus des avancées')}</span>
            </div>
            <div className="diagram-deck face-up">
              <strong>{players.length}</strong><span>{t('Cartes Succès visibles')}</span>
            </div>
          </div>
          {stepControls(['C', 'D', 'E'])}
        </section>
        <section className="diagram-zone diagram-map">
          <h4>{t('Zone de carte centrale')}</h4>
          <div className="diagram-map-art" aria-hidden="true">
            <span className="diagram-tile ghost" />
            <span className="diagram-tile">⌂</span>
            {players.length === 5 && <span className="diagram-tile">⌂</span>}
            <span className="diagram-tile ghost" />
          </div>
          <p>
            {t('{count} tuile(s) de départ au centre', { count: players.length === 5 ? 2 : 1 })}<br />
            <span className="muted">{t('Puis {count} tuiles posées par les joueurs en 2 tours.', { count: players.length * 2 })}</span>
          </p>
          {stepControls(['F', 'L', 'L2', 'L3'])}
        </section>
        {modules.creatures && (
          <section className="diagram-zone diagram-creatures">
            <h4>{t('Espace Créatures')}</h4>
            <div className="diagram-creature-flow">
              <span className="diagram-deck" aria-hidden="true">🐾</span>
              <span>{t('Pioche → ligne, de gauche à droite')}</span>
            </div>
            <p className="muted small">{t('{count} créature(s) enregistrée(s)', { count: state.creatureLine.length })}</p>
            {stepControls(['K2'])}
          </section>
        )}
        <section className="diagram-zone diagram-players">
          <h4>{t('Espaces des joueurs · ordre horaire')}</h4>
          <p className="muted small">{t('Les quantités ci-dessous sont celles de la mise en place, pas un inventaire de partie.')}</p>
          <div className="diagram-player-grid">
            {orderFrom(state.firstPlayer, players.length).map((playerIndex, seat) => {
              const player = players[playerIndex];
              const resources = startingResources(seat + 1);
              return (
                <article key={player.id} className="diagram-player" style={{ borderColor: colorCss(player.color) }}>
                  <div className="row wrap">
                    <span className="seat">{seat + 1}</span>
                    <strong>{player.name}</strong>
                    {seat === 0 && <span className="badge">{t('Premier joueur')}</span>}
                  </div>
                  <p>{CLANS[player.clan].emoji} {CLANS[player.clan].name}</p>
                  <div className="diagram-personal-cards">
                    <span>{t('Pioche · 7 cartes')}</span>
                    <span>{t('Aide de jeu')}</span>
                    <span>{t('Défausse · vide')}</span>
                  </div>
                  <p>{t('{food} nourriture + {wood} bois', { food: resources.food, wood: resources.wood })}</p>
                  <p className="small muted">
                    {t('14 unités · {count} améliorations de côté', { count: upgradeCardsPerPlayer(modules) })}
                  </p>
                  {modules.warchiefs && <p className="small">{CLANS[player.clan].warchief.name}</p>}
                  {player.clan === 'bear' && <p className="small">Kaija</p>}
                  {player.clan === 'snake' && <p className="small">{t('Jeton Terre brûlée')}</p>}
                </article>
              );
            })}
          </div>
          {stepControls(['G', 'H', 'I', 'J', 'K', 'T'])}
        </section>
      </div>
      <div className="diagram-ready">{stepControls(['M'])}</div>
    </details>
  );
}
