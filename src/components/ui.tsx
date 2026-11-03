import type { ReactNode } from 'react';
import { colorCss } from '../data/clans';
import { useGame } from '../state/context';
import { useGameData, useI18n } from '../i18n';

export function Panel(props: { title?: ReactNode; children: ReactNode; className?: string; aside?: ReactNode }) {
  return (
    <section className={`panel ${props.className ?? ''}`}>
      {(props.title || props.aside) && (
        <header className="panel-head">
          {props.title && <h3>{props.title}</h3>}
          {props.aside}
        </header>
      )}
      {props.children}
    </section>
  );
}

export function Check(props: { checkKey: string; children: ReactNode }) {
  const { state, dispatch } = useGame();
  const checked = state.checks.includes(props.checkKey);
  return (
    <label className={`check ${checked ? 'done' : ''}`}>
      <input type="checkbox" checked={checked} onChange={() => dispatch({ type: 'TOGGLE_CHECK', key: props.checkKey })} />
      <span>{props.children}</span>
    </label>
  );
}

export function PlayerTag(props: { index: number; showClan?: boolean }) {
  const { state } = useGame();
  const { CLANS } = useGameData();
  const { t } = useI18n();
  const p = state.config.players[props.index];
  if (!p) return null;
  const clan = CLANS[p.clan];
  return (
    <span className="player-tag" style={{ borderColor: colorCss(p.color) }}>
      <span className="dot" style={{ background: colorCss(p.color) }} />
      {p.name}
      {props.showClan !== false && (
        <span className="muted">
          {' '}
          {clan.emoji} {clan.name.replace('Clan ', '')}
        </span>
      )}
      {state.firstPlayer === props.index && state.stage === 'play' && (
        <span title={t('Marqueur Premier joueur')} className="first-marker">
          ①
        </span>
      )}
    </span>
  );
}

export function Modal(props: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const { t } = useI18n();
  return (
    <div className="modal-backdrop" onClick={props.onClose}>
      <div className={`modal ${props.wide ? 'wide' : ''}`} onClick={(e) => e.stopPropagation()}>
        <header className="panel-head">
          <h3>{props.title}</h3>
          <button className="ghost" onClick={props.onClose} aria-label={t('Fermer')}>
            ✕
          </button>
        </header>
        {props.children}
      </div>
    </div>
  );
}

export function NumberField(props: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  const min = props.min ?? 0;
  const max = props.max ?? 99;
  const set = (v: number) => props.onChange(Math.min(max, Math.max(min, v)));
  return (
    <label className="number-field">
      <span>{props.label}</span>
      <span className="stepper">
        <button type="button" onClick={() => set(props.value - 1)}>
          −
        </button>
        <input type="number" value={props.value} min={min} max={max} onChange={(e) => set(Number(e.target.value) || 0)} />
        <button type="button" onClick={() => set(props.value + 1)}>
          +
        </button>
      </span>
    </label>
  );
}

export function Tip(props: { children: ReactNode; kind?: 'info' | 'warn' | 'clan' | 'module' }) {
  return <div className={`tip ${props.kind ?? 'info'}`}>{props.children}</div>;
}
