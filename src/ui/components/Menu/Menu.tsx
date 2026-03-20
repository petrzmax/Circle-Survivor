import { AudioSystem } from '@/domain/audio/AudioSystem';
import { EventBus } from '@/events/EventBus';
import { CharacterType, GameState } from '@/types/enums';
import { GAME_VERSION } from '@/version';
import { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { container } from 'tsyringe';
import type { LeaderboardPlayerStats, LeaderboardWeapon } from '../../Leaderboard';
import { CharacterSelect } from '../CharacterSelect';
import { LeaderboardComponent } from '../Leaderboard';
import { Settings } from '../Settings';
import styles from './Menu.module.scss';

interface MenuProps {
  gameState: GameState;
}

export function Menu({ gameState }: MenuProps): JSX.Element | null {
  const [showMenuLeaderboard, setShowMenuLeaderboard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [, forceUpdate] = useState(0);
  const [finalWave, setFinalWave] = useState(1);
  const [finalXp, setFinalXp] = useState(0);

  const characterRef = useRef<CharacterType>(CharacterType.NORMIK);
  const gameOverData = useRef<{
    wave: number;
    score: number;
    character: CharacterType;
    weapons: LeaderboardWeapon[];
    items: string[];
    playerStats: LeaderboardPlayerStats;
  } | null>(null);

  useEffect(() => {
    const subs = [
      EventBus.on('gameOver', ({ wave, score, weapons, items, playerStats }) => {
        setFinalWave(wave);
        setFinalXp(score);
        gameOverData.current = {
          wave,
          score,
          character: characterRef.current,
          weapons,
          items,
          playerStats,
        };
      }),
      EventBus.on('characterSelected', ({ characterType }) => {
        characterRef.current = characterType;
      }),
    ];
    return (): void => {
      subs.forEach((s) => {
        s.unsubscribe();
      });
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
    if (showSettings) {
      return (
        <Settings
          onClose={(): void => {
            setShowSettings(false);
          }}
        />
      );
    }

    if (showMenuLeaderboard) {
      return (
        <div class={styles.overlay}>
          <h2>🏆 TOP 10</h2>
          <LeaderboardComponent mode="menu" />
          <button
            class={styles.menuLeaderboardClose}
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
      <div class={styles.overlay}>
        <button
          class={styles.settingsBtn}
          onClick={(): void => {
            setShowSettings(true);
          }}
        >
          ⚙️
        </button>
        <div class={styles.version}>
          Circle Survivor{' '}
          <a
            class={styles.versionLink}
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
        <p class={styles.controls}>
          WASD / Strzałki - ruch | Auto-strzelanie | Kliknij postać aby wybrać
        </p>
        <button
          class={styles.menuLeaderboardBtn}
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
    if (showSettings) {
      return (
        <Settings
          onClose={(): void => {
            setShowSettings(false);
          }}
        />
      );
    }

    return (
      <div class={styles.overlay}>
        <button
          class={styles.settingsBtn}
          onClick={(): void => {
            setShowSettings(true);
          }}
        >
          ⚙️
        </button>
        <h2>⏸️ PAUZA</h2>
        <p>Gra wstrzymana</p>
        <p class={styles.controls}>ESC - wznów grę</p>
        <button onClick={handleResume}>▶ Wznów</button>
        <button onClick={handleToggleAudio}>
          {audioEnabled ? '🔊 Dźwięk: WŁ' : '🔇 Dźwięk: WYŁ'}
        </button>
        <button class={styles.quitBtn} onClick={handleQuit}>
          🚪 Wyjdź do menu
        </button>
      </div>
    );
  }

  // Game Over
  if (gameState === GameState.GAME_OVER) {
    return (
      <div class={styles.overlay}>
        <h2>💀 GAME OVER</h2>
        <p>
          Przetrwałeś do fali: <span>{finalWave}</span>
        </p>
        <p>
          Zdobyte XP: <span>{finalXp}</span>
        </p>
        <LeaderboardComponent mode="gameOver" gameOverData={gameOverData.current} />
        <button onClick={handleRestart}>🔄 Zagraj ponownie</button>
      </div>
    );
  }

  return null;
}
