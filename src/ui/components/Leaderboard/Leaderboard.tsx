import { CHARACTER_TYPES } from '@/config/characters.config';
import { CharacterType } from '@/types/enums';
import { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { container } from 'tsyringe';
import {
  Leaderboard as LeaderboardService,
  type LeaderboardEntry,
  type LeaderboardPlayerStats,
  type LeaderboardWeapon,
} from '../../Leaderboard';
import { LoadoutDetailView } from '../LoadoutDetailView';
import styles from './Leaderboard.module.scss';

interface GameOverData {
  wave: number;
  score: number;
  character: CharacterType;
  weapons: LeaderboardWeapon[];
  items: string[];
  playerStats: LeaderboardPlayerStats;
}

interface LeaderboardProps {
  mode: 'gameOver' | 'menu';
  gameOverData?: GameOverData | null;
}

const leaderboardService = container.resolve(LeaderboardService);

function getMedal(index: number): string {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `${index + 1}.`;
}

function getCharacterEmoji(character?: CharacterType): string {
  if (!character) return '🎮';
  const config = CHARACTER_TYPES[character];
  return config.emoji;
}

export function LeaderboardComponent({ mode, gameOverData }: LeaderboardProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<'local' | 'global'>('local');
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [highlightedName, setHighlightedName] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);
  const [playerName, setPlayerName] = useState(
    () => localStorage.getItem('circle_survivor_player_name') ?? '',
  );

  useEffect(() => {
    void loadScores(activeTab);
  }, [activeTab]);

  const loadScores = async (tab: 'local' | 'global'): Promise<void> => {
    setIsLoading(true);
    try {
      const loadedScores = await leaderboardService.getScores(tab);
      setScores(loadedScores);
    } catch (error) {
      console.error('Failed to load scores:', error);
      setScores([]);
    }
    setIsLoading(false);
  };

  const handleSubmit = async (): Promise<void> => {
    if (!playerName.trim() || !gameOverData) return;

    setIsSubmitting(true);
    try {
      await leaderboardService.submitScore(
        playerName.trim(),
        gameOverData.wave,
        gameOverData.score,
        gameOverData.character,
        gameOverData.weapons,
        gameOverData.items,
        gameOverData.playerStats,
      );
      localStorage.setItem('circle_survivor_player_name', playerName.trim());
      setHasSubmitted(true);
      setHighlightedName(playerName.trim());
      await loadScores(activeTab); // Use activeTab instead of hardcoded 'local'
    } catch (error) {
      console.error('Failed to submit score:', error);
    }
    setIsSubmitting(false);
  };

  const onSubmitClick = (): void => {
    void handleSubmit();
  };

  const listClass = mode === 'menu' ? `${styles.list} ${styles.listLarge}` : styles.list;

  return (
    <>
      {selectedEntry && (
        <LoadoutDetailView
          entry={selectedEntry}
          onClose={(): void => {
            setSelectedEntry(null);
          }}
        />
      )}
      <div
        class={mode === 'menu' ? `${styles.container} ${styles.containerLarge}` : styles.container}
      >
        {/* Score submission (game over mode only) */}
        {mode === 'gameOver' && !hasSubmitted && (
          <div class={styles.scoreSubmit}>
            <input
              type="text"
              class={styles.playerName}
              placeholder="Twoje imię..."
              maxLength={20}
              value={playerName}
              onInput={(e): void => {
                setPlayerName((e.target as HTMLInputElement).value);
              }}
            />
            <button class={styles.submitBtn} onClick={onSubmitClick} disabled={isSubmitting}>
              {isSubmitting ? '⏳ Saving...' : '📊 Zapisz wynik'}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div class={styles.tabs}>
          <button
            class={`${styles.tabBtn} ${activeTab === 'local' ? styles.active : ''}`}
            onClick={(): void => {
              setActiveTab('local');
            }}
          >
            🏠 Lokalne
          </button>
          <button
            class={`${styles.tabBtn} ${activeTab === 'global' ? styles.active : ''}`}
            onClick={(): void => {
              setActiveTab('global');
            }}
          >
            🌍 Globalne
          </button>
        </div>

        {/* Content */}
        <div class={styles.content}>
          <h3>🏆 TOP 10</h3>
          {isLoading ? (
            <ol class={listClass}>
              <li class={styles.noScores}>⏳ Ładowanie...</li>
            </ol>
          ) : (
            <ol class={listClass}>
              {scores.length === 0 ? (
                <li class={styles.noScores}>Brak wyników - bądź pierwszy!</li>
              ) : (
                scores.map((score, index) => (
                  <li
                    key={`${score.name}-${index}`}
                    class={`${styles.entry} ${score.name === highlightedName ? styles.highlighted : ''}`}
                    onClick={(): void => {
                      setSelectedEntry(score);
                    }}
                  >
                    <span class={styles.rank}>{getMedal(index)}</span>
                    <span class={styles.name}>
                      {getCharacterEmoji(score.character)} {score.name}
                    </span>
                    <span class={styles.score}>
                      Fala {score.wave} | {score.xp} XP
                    </span>
                    <span class={styles.entryArrow}>›</span>
                  </li>
                ))
              )}
            </ol>
          )}
        </div>
      </div>
    </>
  );
}
