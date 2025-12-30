/**
 * Formatting utilities for converting types and values to display strings.
 */

import { EnemyType } from '@/types/enums';

/**
 * Converts an EnemyType enum value to a human-readable display name.
 * Examples:
 * - basic → "Basic"
 * - bossSwarm → "Boss Swarm"
 * - zigzag → "Zigzag"
 */
export function getEnemyDisplayName(type: EnemyType): string {
  // Convert camelCase to space-separated words
  // bossSwarm -> Boss Swarm
  // basic -> Basic
  return (
    type
      // Insert space before uppercase letters
      .replace(/([A-Z])/g, ' $1')
      // Capitalize first letter of each word
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
      .trim()
  );
}
