/**
 * Leaderboard system - supports both local (localStorage) and global (JSONBin.io) scores
 */

import { CharacterType } from '@/types/enums';
import { singleton } from 'tsyringe';

// ============ Types ============

/** Slim stats snapshot stored in leaderboard entries (no weapons/items/heavy objects). */
export interface LeaderboardPlayerStats {
  maxHp: number;
  armor: number;
  dodge: number;
  regen: number;
  thorns: number;
  lifesteal: number;
  damageMultiplier: number;
  critChance: number;
  critDamage: number;
  attackSpeedMultiplier: number;
  attackRange: number;
  explosionRadius: number;
  knockback: number;
  speedMultiplier: number;
  pickupRange: number;
  luck: number;
  xpMultiplier: number;
  goldMultiplier: number;
}

export interface LeaderboardWeapon {
  type: string;
  level: number;
}

export interface LeaderboardEntry {
  name: string;
  wave: number;
  xp: number;
  character: CharacterType;
  date: string;
  weapons?: LeaderboardWeapon[];
  items?: string[];
  playerStats?: LeaderboardPlayerStats;
}

// JSONBin API response types
interface JSONBinFetchResponse {
  record: {
    scores: LeaderboardEntry[];
  };
}

// ============ Leaderboard Class ============

@singleton()
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

  public getLocalScores(): LeaderboardEntry[] {
    try {
      const data = localStorage.getItem(this.LOCAL_STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data) as LeaderboardEntry[];
    } catch (e) {
      console.error('Error reading local leaderboard:', e);
      return [];
    }
  }

  public saveLocalScore(entry: LeaderboardEntry): LeaderboardEntry[] {
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

  public isGlobalEnabled(): boolean {
    return !!(this.JSONBIN_BIN_ID && this.JSONBIN_API_KEY);
  }

  public async fetchGlobalScores(): Promise<LeaderboardEntry[]> {
    if (!this.isGlobalEnabled()) return [];

    // Use cache if fresh
    if (Date.now() - this.lastFetch < this.CACHE_DURATION && this.globalScores.length > 0) {
      return this.globalScores;
    }

    try {
      if (!this.JSONBIN_API_KEY) {
        throw new Error('JSONBin API key not configured');
      }
      const response = await fetch(`https://api.jsonbin.io/v3/b/${this.JSONBIN_BIN_ID}/latest`, {
        headers: {
          'X-Access-Key': this.JSONBIN_API_KEY,
        },
      });

      if (!response.ok) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const errorData = await response.json().catch(() => ({}));
        if (this.DEBUG) console.log('JSONBin response:', response.status, errorData);
        throw new Error(`Failed to fetch global scores: ${response.status}`);
      }

      const data = (await response.json()) as JSONBinFetchResponse;
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      this.globalScores = data.record.scores || [];
      this.lastFetch = Date.now();

      return this.globalScores;
    } catch (e) {
      if (this.DEBUG) console.error('Error fetching global leaderboard:', e);
      return this.globalScores; // Return cached data on error
    }
  }

  private async saveGlobalScore(entry: LeaderboardEntry): Promise<LeaderboardEntry[] | null> {
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
      if (!this.JSONBIN_API_KEY) {
        throw new Error('JSONBin API key not configured');
      }
      const response = await fetch(`https://api.jsonbin.io/v3/b/${this.JSONBIN_BIN_ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Access-Key': this.JSONBIN_API_KEY,
        },
        body: JSON.stringify({ scores: topScores }),
      });

      if (!response.ok) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

  public async submitScore(
    playerName: string,
    wave: number,
    xp: number,
    character: CharacterType,
    weapons?: LeaderboardWeapon[],
    items?: string[],
    playerStats?: LeaderboardPlayerStats,
  ): Promise<LeaderboardEntry[]> {
    const entry: LeaderboardEntry = {
      name: playerName.substring(0, 20),
      wave: wave,
      xp: xp,
      character: character,
      date: new Date().toISOString(),
      weapons,
      items,
      playerStats,
    };

    // Always save locally
    const localScores = this.saveLocalScore(entry);

    // Try to save globally
    if (this.isGlobalEnabled()) {
      await this.saveGlobalScore(entry);
    }

    return localScores;
  }

  public async getScores(type: string = 'local'): Promise<LeaderboardEntry[]> {
    if (type === 'global' && this.isGlobalEnabled()) {
      return await this.fetchGlobalScores();
    }
    return this.getLocalScores();
  }

  // Check if score qualifies for leaderboard
  public qualifiesForLeaderboard(wave: number, xp: number): boolean {
    const scores = this.getLocalScores();
    if (scores.length < this.MAX_ENTRIES) return true;

    const lowestScore = scores[scores.length - 1];
    if (!lowestScore) return true;
    return wave > lowestScore.wave || (wave === lowestScore.wave && xp > lowestScore.xp);
  }

  // Get player's rank for a score
  public getRank(wave: number, xp: number): number {
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
}
