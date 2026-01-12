import { JSX } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { Leaderboard as LeaderboardService } from '../Leaderboard';

interface LeaderboardProps {
  mode: 'gameOver' | 'menu';
  finalWave?: number;
  finalXp?: number;
  character?: string;
}

interface LeaderboardEntry {
  name: string;
  wave: number;
  xp: number;
  character?: string;
}

// Shared leaderboard service instance
const leaderboardService = new LeaderboardService();

function getMedal(index: number): string {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `${index + 1}.`;
}

function getCharacterEmoji(character?: string): string {
  // TODO, these are also in config, why not use?
  const emojis: Record<string, string> = {
    janusz: '💼',
    wypaleniec: '🔥',
    cwaniak: '😎',
    grazyna: '👩',
    normik: '🙂',
  };
  return character ? (emojis[character] ?? '🎮') : '🎮';
}

export function LeaderboardComponent({
  mode,
  finalWave,
  finalXp,
  character,
}: LeaderboardProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<'local' | 'global'>('local');
  const [scores, setScores] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [highlightedName, setHighlightedName] = useState<string | null>(null);
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
    if (!playerName.trim() || finalWave === undefined || finalXp === undefined) return;

    setIsSubmitting(true);
    try {
      await leaderboardService.submitScore(
        playerName.trim(),
        finalWave,
        finalXp,
        character ?? 'normik',
      );
      localStorage.setItem('circle_survivor_player_name', playerName.trim());
      setHasSubmitted(true);
      setHighlightedName(playerName.trim());
      await loadScores('local');
    } catch (error) {
      console.error('Failed to submit score:', error);
    }
    setIsSubmitting(false);
  };

  const onSubmitClick = (): void => {
    void handleSubmit();
  };

  // Use different list ID based on mode for proper CSS styling
  const listId = mode === 'menu' ? 'menu-leaderboard-list' : 'leaderboard-list';

  return (
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
          <ol id={listId}>
            <li class="no-scores">⏳ Ładowanie...</li>
          </ol>
        ) : (
          <ol id={listId}>
            {scores.length === 0 ? (
              <li class="no-scores">Brak wyników - bądź pierwszy!</li>
            ) : (
              scores.map((score, index) => (
                <li
                  key={`${score.name}-${index}`}
                  class={score.name === highlightedName ? 'highlighted' : ''}
                >
                  <span class="rank">{getMedal(index)}</span>
                  <span class="name">
                    {getCharacterEmoji(score.character)} {score.name}
                  </span>
                  <span class="score">
                    Fala {score.wave} | {score.xp} XP
                  </span>
                </li>
              ))
            )}
          </ol>
        )}
      </div>
    </div>
  );
}
