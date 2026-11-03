import { useEffect, useReducer, useState } from 'react';
import { ConfigScreen } from './components/ConfigScreen';
import { FinalScore } from './components/FinalScore';
import { GameScreen } from './components/GameScreen';
import { Reference } from './components/Reference';
import { SetupScreen } from './components/SetupScreen';
import { Modal } from './components/ui';
import { GameContext } from './state/context';
import { loadStore, saveStore, storeReducer } from './state/store';

export default function App() {
  const [store, dispatch] = useReducer(storeReducer, undefined, loadStore);
  const [rulesOpen, setRulesOpen] = useState(false);
  const state = store.present;

  useEffect(() => saveStore(store), [store]);

  return (
    <GameContext.Provider value={{ state, dispatch, canUndo: store.past.length > 0 }}>
      <header className="app-header">
        <h1>
          ᚾ Northgard <span className="muted">Compagnon</span>
        </h1>
        <div className="row">
          {state.stage !== 'play' && (
            <button className="ghost" onClick={() => setRulesOpen(true)}>
              📜 Règles
            </button>
          )}
          <button
            className="ghost"
            disabled={store.past.length === 0}
            onClick={() => dispatch({ type: 'UNDO' })}
            title="Annuler la dernière action"
          >
            ↶ Annuler
          </button>
          {state.stage !== 'config' && (
            <button
              className="ghost danger"
              onClick={() => {
                if (confirm('Abandonner la partie en cours et en commencer une nouvelle ?')) dispatch({ type: 'RESET' });
              }}
            >
              Nouvelle partie
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
      {rulesOpen && (
        <Modal title="Règles" wide onClose={() => setRulesOpen(false)}>
          <Reference />
        </Modal>
      )}
    </GameContext.Provider>
  );
}
