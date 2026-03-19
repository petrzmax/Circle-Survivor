import { CHARACTER_TYPES } from '@/config/characters.config';
import { EventBus } from '@/events/EventBus';
import { CharacterType } from '@/types/enums';
import { JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { container } from 'tsyringe';
import {
  Leaderboard as LeaderboardService,
  type LeaderboardEntry,
  type LeaderboardPlayerStats,
  type LeaderboardWeapon,
} from '../Leaderboard';
import { LoadoutDetailView } from './LoadoutDetailView';

interface LeaderboardProps {
  mode: 'gameOver' | 'menu';
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

export function LeaderboardComponent({ mode }: LeaderboardProps): JSX.Element {
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

  // Subscribe to game events directly instead of prop drilling
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
    if (!playerName.trim() || !gameOverData.current) return;

    setIsSubmitting(true);
    try {
      await leaderboardService.submitScore(
        playerName.trim(),
        gameOverData.current.wave,
        gameOverData.current.score,
        gameOverData.current.character,
        gameOverData.current.weapons,
        gameOverData.current.items,
        gameOverData.current.playerStats,
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

  const listClass =
    mode === 'menu' ? 'leaderboard-list leaderboard-list--large' : 'leaderboard-list';

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
      <div id="leaderboard-container">
        {/* Score submission (game over mode only) */}
        {mode === 'gameOver' && !hasSubmitted && (
          <div id="score-submit">
            <input
              type="text"
              id="player-name"
              placeholder="Twoje imię..."
              maxLength={20}
              value={playerName}
              onInput={(e): void => {
                setPlayerName((e.target as HTMLInputElement).value);
              }}
            />
            <button id="submit-score-btn" onClick={onSubmitClick} disabled={isSubmitting}>
              {isSubmitting ? '⏳ Saving...' : '📊 Zapisz wynik'}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div class="leaderboard-tabs">
          <button
            class={`tab-btn ${activeTab === 'local' ? 'active' : ''}`}
            onClick={(): void => {
              setActiveTab('local');
            }}
          >
            🏠 Lokalne
          </button>
          <button
            class={`tab-btn ${activeTab === 'global' ? 'active' : ''}`}
            onClick={(): void => {
              setActiveTab('global');
            }}
          >
            🌍 Globalne
          </button>
        </div>

        {/* Content */}
        <div class="leaderboard-content">
          <h3>🏆 TOP 10</h3>
          {isLoading ? (
            <ol class={listClass}>
              <li class="no-scores">⏳ Ładowanie...</li>
            </ol>
          ) : (
            <ol class={listClass}>
              {scores.length === 0 ? (
                <li class="no-scores">Brak wyników - bądź pierwszy!</li>
              ) : (
                scores.map((score, index) => (
                  <li
                    key={`${score.name}-${index}`}
                    class={`leaderboard-entry ${score.name === highlightedName ? 'highlighted' : ''}`}
                    onClick={(): void => {
                      setSelectedEntry(score);
                    }}
                  >
                    <span class="rank">{getMedal(index)}</span>
                    <span class="name">
                      {getCharacterEmoji(score.character)} {score.name}
                    </span>
                    <span class="score">
                      Fala {score.wave} | {score.xp} XP
                    </span>
                    <span class="entry-arrow">›</span>
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
