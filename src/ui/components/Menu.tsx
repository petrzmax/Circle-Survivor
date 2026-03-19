import { AudioSystem } from '@/domain/audio/AudioSystem';
import { EventBus } from '@/events/EventBus';
import { GameState } from '@/types/enums';
import { GAME_VERSION } from '@/version';
import { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { container } from 'tsyringe';
import { CharacterSelect } from './CharacterSelect';
import { LeaderboardComponent } from './Leaderboard';

interface MenuProps {
  gameState: GameState;
}

export function Menu({ gameState }: MenuProps): JSX.Element | null {
  const [showMenuLeaderboard, setShowMenuLeaderboard] = useState(false);
  const [, forceUpdate] = useState(0);
  const [finalWave, setFinalWave] = useState(1);
  const [finalXp, setFinalXp] = useState(0);

  useEffect(() => {
    const sub = EventBus.on('gameOver', ({ wave, score }) => {
      setFinalWave(wave);
      setFinalXp(score);
    });
    return (): void => {
      sub.unsubscribe();
    };
  }, []);

  const audioSystem = container.resolve(AudioSystem);

  const audioEnabled = audioSystem.isEnabled();

  const handleResume = (): void => {
    EventBus.emit('resumeRequested', undefined);
  };
  const handleQuit = (): void => {
    EventBus.emit('quitToMenuRequested', undefined);
  };
  const handleRestart = (): void => {
    EventBus.emit('restartRequested', undefined);
  };
  const handleToggleAudio = (): void => {
    audioSystem.toggle();
    forceUpdate((n) => n + 1);
  };

  // Start Screen
  if (gameState === GameState.MENU) {
    if (showMenuLeaderboard) {
      return (
        <div id="menu-leaderboard">
          <h2>🏆 TOP 10</h2>
          <LeaderboardComponent mode="menu" />
          <button
            id="menu-leaderboard-close"
            onClick={(): void => {
              setShowMenuLeaderboard(false);
            }}
          >
            ⬅ Powrót
          </button>
        </div>
      );
    }

    return (
      <div id="start-screen">
        <div id="game-version">
          Circle Survivor{' '}
          <a
            id="version-number"
            href={
              GAME_VERSION === 'dev'
                ? 'https://github.com/petrzmax/Circle-Survivor/releases'
                : `https://github.com/petrzmax/Circle-Survivor/releases/tag/v${GAME_VERSION}`
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            {GAME_VERSION}
          </a>{' '}
          - Artur Petrzak 2025
        </div>
        <h1>🎮 CIRCLE SURVIVOR</h1>
        <p>Wybierz swoją postać!</p>
        <CharacterSelect />
        <p class="controls">WASD / Strzałki - ruch | Auto-strzelanie | Kliknij postać aby wybrać</p>
        <button
          id="menu-leaderboard-btn"
          onClick={(): void => {
            setShowMenuLeaderboard(true);
          }}
        >
          🏆 TOP 10
        </button>
      </div>
    );
  }

  // Pause Menu
  if (gameState === GameState.PAUSED) {
    return (
      <div id="pause-menu">
        <h2>⏸️ PAUZA</h2>
        <p>Gra wstrzymana</p>
        <p class="controls">ESC - wznów grę</p>
        <button id="resume-btn" onClick={handleResume}>
          ▶ Wznów
        </button>
        <button id="sound-toggle" onClick={handleToggleAudio}>
          {audioEnabled ? '🔊 Dźwięk: WŁ' : '🔇 Dźwięk: WYŁ'}
        </button>
        <button id="quit-btn" onClick={handleQuit}>
          🚪 Wyjdź do menu
        </button>
      </div>
    );
  }

  // Game Over
  if (gameState === GameState.GAME_OVER) {
    return (
      <div id="game-over">
        <h2>💀 GAME OVER</h2>
        <p>
          Przetrwałeś do fali: <span id="final-wave">{finalWave}</span>
        </p>
        <p>
          Zdobyte XP: <span id="final-xp">{finalXp}</span>
        </p>
        <LeaderboardComponent mode="gameOver" />
        <button id="restart-btn" onClick={handleRestart}>
          🔄 Zagraj ponownie
        </button>
      </div>
    );
  }

  return null;
}
