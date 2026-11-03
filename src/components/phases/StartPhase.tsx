import { DEV_KIND_LABEL, devCardKindForYear, totalYears } from '../../logic/rules';
import { useGame } from '../../state/context';
import { Check, Panel, PlayerTag, Tip } from '../ui';

export function StartPhase() {
  const { state } = useGame();
  const m = state.config.modules;
  const n = state.config.players.length;
  const kind = devCardKindForYear(state.year, m);
  const last = state.year === totalYears(m);
  return (
    <Panel title="1. Début de l’année">
      {last && <Tip kind="warn">⚠️ Dernière année ! Les cartes Succès remplacent les cartes Développement.</Tip>}
      <Check checkKey="draw">
        Chaque joueur pioche <strong>4 cartes</strong> (+1 par Forge contrôlée). Pioche vide → mélangez la défausse pour
        en former une nouvelle.
      </Check>
      <div className="row wrap indent">
        {state.config.players.map((_, i) => (
          <PlayerTag key={i} index={i} />
        ))}
      </div>
      <Check checkKey="dev">
        <PlayerTag index={state.firstPlayer} showClan={false} /> (premier joueur){' '}
        {kind === 'achievement' ? (
          <>
            laisse les <strong>{n} cartes Succès</strong> visibles : elles remplacent les Développements cette année.
          </>
        ) : (
          <>
            révèle <strong>{n} cartes</strong> de la pioche Développement (<em>{DEV_KIND_LABEL[kind]}</em>) à côté de la
            pioche.
          </>
        )}
      </Check>
    </Panel>
  );
}
