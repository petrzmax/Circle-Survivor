import { DISPLAYED_STATS } from '@/config/stats-display.config';
import type { LeaderboardPlayerStats } from '@/ui/Leaderboard';
import { JSX } from 'preact';
import styles from './StatsColumn.module.scss';

interface StatsColumnProps {
  stats: LeaderboardPlayerStats;
}

export function StatsColumn({ stats }: StatsColumnProps): JSX.Element {
  return (
    <div class={styles.column}>
      <div class={styles.sectionLabel}>📊 Statystyki</div>
      <div class={styles.stats}>
        {DISPLAYED_STATS.map((stat) => {
          const formatted = stat.format(stats);
          const numVal = parseFloat(formatted);
          const colorClass =
            numVal > 0 ? styles.positive : numVal < 0 ? styles.negative : styles.neutral;
          return (
            <div class={styles.stat} key={stat.key}>
              <span>
                {stat.emoji} {stat.label}
              </span>
              <span class={`${styles.statValue} ${colorClass}`}>{formatted}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
