import { DISPLAYED_STATS } from '@/config/stats-display.config';
import type { LeaderboardPlayerStats } from '@/ui/Leaderboard';
import { JSX } from 'preact';

interface StatsColumnProps {
  stats: LeaderboardPlayerStats;
}

export function StatsColumn({ stats }: StatsColumnProps): JSX.Element {
  return (
    <div class="items-column-right">
      <div class="items-section-label">📊 Statystyki</div>
      <div class="items-stats">
        {DISPLAYED_STATS.map((stat) => {
          const formatted = stat.format(stats);
          const numVal = parseFloat(formatted);
          const colorClass =
            numVal > 0 ? 'stat-positive' : numVal < 0 ? 'stat-negative' : 'stat-neutral';
          return (
            <div class="items-stat" key={stat.key}>
              <span>
                {stat.emoji} {stat.label}
              </span>
              <span class={`items-stat-value ${colorClass}`}>{formatted}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
