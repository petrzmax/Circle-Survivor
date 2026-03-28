import { DISPLAYED_STATS } from '@/config/stats-display.config';
import type { LeaderboardPlayerStats } from '@/ui/Leaderboard';
import { TOOLTIP_OFFSET, TOOLTIP_WIDTH, ViewportScaler } from '@/utils/viewport-scaler';
import { JSX } from 'preact';
import { useState } from 'preact/hooks';
import styles from './StatsColumn.module.scss';

interface TooltipState {
  text: string;
  x: number;
  y: number;
}

interface StatsColumnProps {
  stats: LeaderboardPlayerStats;
}

export function StatsColumn({ stats }: StatsColumnProps): JSX.Element {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const handleMouseMove = (e: MouseEvent): void => {
    setTooltip((prev) => {
      if (!prev) return null;
      const local = ViewportScaler.viewportToLocal(e.clientX, e.clientY);
      return { ...prev, x: local.x, y: local.y };
    });
  };

  const showTooltip = (e: MouseEvent, description: string): void => {
    const local = ViewportScaler.viewportToLocal(e.clientX, e.clientY);
    setTooltip({ text: description, x: local.x, y: local.y });
  };

  return (
    <div class={styles.column} onMouseMove={handleMouseMove}>
      <div class={styles.sectionLabel}>📊 Statystyki</div>
      <div class={styles.stats}>
        {DISPLAYED_STATS.map((stat) => {
          const formatted = stat.format(stats);
          const numVal = parseFloat(formatted);
          const colorClass =
            numVal > 0 ? styles.positive : numVal < 0 ? styles.negative : styles.neutral;
          return (
            <div
              class={styles.stat}
              key={stat.key}
              onMouseEnter={(e: MouseEvent) => {
                showTooltip(e, stat.description);
              }}
              onMouseLeave={() => {
                setTooltip(null);
              }}
            >
              <span>
                {stat.emoji} {stat.label}
              </span>
              <span class={`${styles.statValue} ${colorClass}`}>{formatted}</span>
            </div>
          );
        })}
      </div>
      {tooltip && (
        <div
          class={styles.tooltip}
          style={{
            left: `${tooltip.x - TOOLTIP_WIDTH - TOOLTIP_OFFSET}px`,
            top: `${tooltip.y}px`,
            transform: 'translateY(-100%)',
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  );
}
