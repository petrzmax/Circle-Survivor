/**
 * Leaderboard system - supports both local (localStorage) and global (JSONBin.io) scores
 * Matches original js/leaderboard.js exactly.
 */

// ============ Types ============

export interface LeaderboardEntry {
  name: string;
  wave: number;
  xp: number;
  character: string;
  date: string;
}

// ============ Leaderboard Class ============

export class Leaderboard {
  // JSONBin.io configuration - injected by Vite at build time
  private JSONBIN_BIN_ID = __JSONBIN_BIN_ID__ || null;
  private JSONBIN_API_KEY = __JSONBIN_API_KEY__ || null;

  // Local storage key
  private LOCAL_STORAGE_KEY = 'circle_survivor_leaderboard';

  // Max entries to keep
  private MAX_ENTRIES = 10;

  // Cache for global scores
  private globalScores: LeaderboardEntry[] = [];
  private lastFetch = 0;
  private CACHE_DURATION = 60000; // 1 minute cache

  // Debug mode
  private DEBUG = false;

  // ============ LOCAL LEADERBOARD ============

  getLocalScores(): LeaderboardEntry[] {
    try {
      const data = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading local leaderboard:', e);
      return [];
    }
  }

  saveLocalScore(entry: LeaderboardEntry): LeaderboardEntry[] {
    try {
      const scores = this.getLocalScores();
      scores.push(entry);

      // Sort by wave (desc), then by xp (desc), then by date (desc)
      scores.sort((a, b) => {
        if (b.wave !== a.wave) return b.wave - a.wave;
        if (b.xp !== a.xp) return b.xp - a.xp;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      // Keep only top entries
      const topScores = scores.slice(0, this.MAX_ENTRIES);
      localStorage.setItem(this.LOCAL_STORAGE_KEY, JSON.stringify(topScores));

      return topScores;
    } catch (e) {
      console.error('Error saving local score:', e);
      return [];
    }
  }

  // ============ GLOBAL LEADERBOARD (JSONBin.io) ============

  isGlobalEnabled(): boolean {
    return !!(this.JSONBIN_BIN_ID && this.JSONBIN_API_KEY);
  }

  async fetchGlobalScores(): Promise<LeaderboardEntry[]> {
    if (!this.isGlobalEnabled()) return [];

    // Use cache if fresh
    if (Date.now() - this.lastFetch < this.CACHE_DURATION && this.globalScores.length > 0) {
      return this.globalScores;
    }

    try {
      const response = await fetch(`https://api.jsonbin.io/v3/b/${this.JSONBIN_BIN_ID}/latest`, {
        headers: {
          'X-Access-Key': this.JSONBIN_API_KEY!,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (this.DEBUG) console.log('JSONBin response:', response.status, errorData);
        throw new Error(`Failed to fetch global scores: ${response.status}`);
      }

      const data = await response.json();
      this.globalScores = data.record?.scores || [];
      this.lastFetch = Date.now();

      return this.globalScores;
    } catch (e) {
      if (this.DEBUG) console.error('Error fetching global leaderboard:', e);
      return this.globalScores; // Return cached data on error
    }
  }

  async saveGlobalScore(entry: LeaderboardEntry): Promise<LeaderboardEntry[] | null> {
    if (!this.isGlobalEnabled()) return null;

    try {
      // First, fetch current scores
      const currentScores = await this.fetchGlobalScores();
      const scores = [...currentScores, entry];

      // Sort and limit
      scores.sort((a, b) => {
        if (b.wave !== a.wave) return b.wave - a.wave;
        if (b.xp !== a.xp) return b.xp - a.xp;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      const topScores = scores.slice(0, this.MAX_ENTRIES);

      // Save back to JSONBin
      const response = await fetch(`https://api.jsonbin.io/v3/b/${this.JSONBIN_BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Key': this.JSONBIN_API_KEY!,
        },
        body: JSON.stringify({ scores: topScores }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (this.DEBUG) console.log('JSONBin save response:', response.status, errorData);
        throw new Error(`Failed to save global score: ${response.status}`);
      }

      this.globalScores = topScores;
      this.lastFetch = Date.now();

      return topScores;
    } catch (e) {
      console.error('Error saving global score:', e);
      return null;
    }
  }

  // ============ COMBINED API ============

  async submitScore(playerName: string, wave: number, xp: number, character: string): Promise<LeaderboardEntry[]> {
    const entry: LeaderboardEntry = {
      name: playerName.substring(0, 20), // Limit name length
      wave: wave,
      xp: xp,
      character: character,
      date: new Date().toISOString(),
    };

    // Always save locally
    const localScores = this.saveLocalScore(entry);

    // Try to save globally
    if (this.isGlobalEnabled()) {
      await this.saveGlobalScore(entry);
    }

    return localScores;
  }

  async getScores(type: string = 'local'): Promise<LeaderboardEntry[]> {
    if (type === 'global' && this.isGlobalEnabled()) {
      return await this.fetchGlobalScores();
    }
    return this.getLocalScores();
  }

  // Check if score qualifies for leaderboard
  qualifiesForLeaderboard(wave: number, xp: number): boolean {
    const scores = this.getLocalScores();
    if (scores.length < this.MAX_ENTRIES) return true;

    const lowestScore = scores[scores.length - 1];
    if (!lowestScore) return true;
    return wave > lowestScore.wave || (wave === lowestScore.wave && xp > lowestScore.xp);
  }

  // Get player's rank for a score
  getRank(wave: number, xp: number): number {
    const scores = this.getLocalScores();
    let rank = 1;
    for (const score of scores) {
      if (score.wave > wave || (score.wave === wave && score.xp > xp)) {
        rank++;
      } else {
        break;
      }
    }
    return rank;
  }

  // Format date for display
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Render leaderboard HTML
  renderLeaderboard(scores: LeaderboardEntry[], highlightName: string | null = null): string {
    if (!scores || scores.length === 0) {
      return '<li class="no-scores">Brak wyników - bądź pierwszy!</li>';
    }

    return scores
      .map((score, index) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
        const isHighlighted = highlightName && score.name === highlightName;
        const charEmoji = this.getCharacterEmoji(score.character);

        return `
                <li class="${isHighlighted ? 'highlighted' : ''}">
                    <span class="rank">${medal}</span>
                    <span class="name">${charEmoji} ${this.escapeHtml(score.name)}</span>
                    <span class="score">Fala ${score.wave} | ${score.xp} XP</span>
                </li>
            `;
      })
      .join('');
  }

  getCharacterEmoji(character: string): string {
    const emojis: Record<string, string> = {
      // TODO hmm there are no characters like janusz and grazyna... but maybe they should?
      janusz: '💼',
      wypaleniec: '🔥',
      cwaniak: '😎',
      grazyna: '👩',
    };
    return emojis[character] || '🎮';
  }

  escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
