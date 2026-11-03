import { useEffect, useReducer, useState } from 'react';
import { ConfigScreen } from './components/ConfigScreen';
import { FinalScore } from './components/FinalScore';
import { GameScreen } from './components/GameScreen';
import { Reference } from './components/Reference';
import { SetupScreen } from './components/SetupScreen';
import { Modal } from './components/ui';
import { GameContext } from './state/context';
import { loadStore, saveStore, storeReducer } from './state/store';
import { useI18n } from './i18n';

export default function App() {
  const [store, dispatch] = useReducer(storeReducer, undefined, loadStore);
  const [rulesOpen, setRulesOpen] = useState(false);
  const { language, setLanguage, t } = useI18n();
  const state = store.present;

  useEffect(() => saveStore(store), [store]);

  return (
    <GameContext.Provider value={{ state, dispatch, canUndo: store.past.length > 0 }}>
      <header className="app-header">
        <h1 className="brand">
          <img src={`${import.meta.env.BASE_URL}logo.svg`} alt="" width="56" height="56" />
          <span className="brand-name">
            Northgard             <span className="brand-subtitle">{t('Compagnon de jeu')}</span>
          </span>
        </h1>
        <div className="row header-actions">
          <label className="language-select">
            <select aria-label="Langue / Language" value={language} onChange={(e) => setLanguage(e.target.value as 'fr' | 'en')}>
              <option value="fr">Français</option>
              <option value="en">English</option>
            </select>
          </label>
          {state.stage !== 'play' && (
            <button className="ghost" onClick={() => setRulesOpen(true)}>
              📜 {t('Règles')}
            </button>
          )}
          <button
            className="ghost"
            disabled={store.past.length === 0}
            onClick={() => dispatch({ type: 'UNDO' })}
            title={t('Annuler la dernière action')}
          >
            ↶ {t('Annuler')}
          </button>
          {state.stage !== 'config' && (
            <button
              className="ghost danger"
              onClick={() => {
                if (confirm(t('Abandonner la partie en cours et en commencer une nouvelle ?'))) dispatch({ type: 'RESET' });
              }}
            >
              {t('Nouvelle partie')}
            </button>
          )}
        </div>
      </header>
      <main>
        {state.stage === 'config' && <ConfigScreen />}
        {state.stage === 'setup' && <SetupScreen />}
        {state.stage === 'play' && <GameScreen />}
        {state.stage === 'final' && <FinalScore />}
      </main>
      <footer className="app-footer">
        Northgard: Uncharted Lands · {t('Compagnon non officiel')}
        <span>{t('Créé par des joueurs, pour les joueurs. Non affilié aux créateurs du jeu.')}</span>
      </footer>
      {rulesOpen && (
        <Modal title={t('Règles')} wide onClose={() => setRulesOpen(false)}>
          <Reference />
        </Modal>
      )}
    </GameContext.Provider>
  );
}
