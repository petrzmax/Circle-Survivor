import { ItemEffect } from './shop.config';

export interface StatLabel {
  emoji: string;
  label: string;
  description: string;
}

/**
 * Human-readable labels for every ItemEffect key.
 * To add a new stat, just add an entry here — it will be available everywhere.
 */
export const STAT_LABELS: Record<keyof ItemEffect, StatLabel> = {
  maxHp: {
    emoji: '❤️',
    label: 'Życie',
    description: 'Maksymalna ilość punktów życia.',
  },
  armor: {
    emoji: '🛡️',
    label: 'Pancerz',
    description:
      'Redukuje otrzymywane obrażenia o wyświetlany procent. Efektywność każdego kolejnego punktu pancerza maleje.',
  },
  regen: {
    emoji: '💚',
    label: 'Regeneracja',
    description: 'Ilość HP regenerowanych co sekundę.',
  },
  dodge: {
    emoji: '💨',
    label: 'Unik',
    description: 'Szansa na całkowite uniknięcie obrażeń z każdego trafienia. Maks. 60%.',
  },
  damageMultiplier: {
    emoji: '⚔️',
    label: 'Obrażenia',
    description: 'Zwiększa wszystkie zadawane obrażenia o wyświetlany procent.',
  },
  critChance: {
    emoji: '🎯',
    label: 'Szansa na kryt',
    description: 'Szansa, że atak zada obrażenia krytyczne.',
  },
  critDamage: {
    emoji: '💥',
    label: 'Obrażenia kryt',
    description: 'Zwiększa obrażenia krytyczne o wyświetlany procent.',
  },
  attackSpeedMultiplier: {
    emoji: '⚡',
    label: 'Szybkość ataku',
    description: 'Zwiększa szybkość ataku wszystkich broni o wyświetlany procent.',
  },
  speedMultiplier: {
    emoji: '🏃',
    label: 'Prędkość',
    description: 'Zwiększa prędkość ruchu gracza o wyświetlany procent.',
  },
  lifesteal: {
    emoji: '🧛',
    label: 'Szansa na kradzież życia',
    description: 'Szansa na odzyskanie 1 HP przy każdym trafieniu wroga.',
  },
  thorns: {
    emoji: '🌵',
    label: 'Odbicie obrażeń',
    description: 'Procent otrzymanych obrażeń zwracany atakującemu. Omija pancerz i unik wroga.',
  },
  luck: {
    emoji: '🍀',
    label: 'Szczęście',
    description: 'Zwiększa szansę na wypadnięcie serca z pokonanych wrogów.',
  },
  xpMultiplier: {
    emoji: '⭐',
    label: 'Mnożnik XP',
    description: 'Zwiększa ilość zdobywanych XP.',
  },
  goldMultiplier: {
    emoji: '💰',
    label: 'Mnożnik złota',
    description: 'Zwiększa ilość zdobywanego złota z monet.',
  },
  pickupRange: {
    emoji: '🧲',
    label: 'Zasięg zbierania',
    description:
      'Zasięg (w pikselach), w którym przedmioty są automatycznie przyciągane do gracza.',
  },
  explosionRadius: {
    emoji: '💣',
    label: 'Zasięg eksplozji',
    description:
      'Zwiększa promień eksplozji wybuchów. Obrażenia maleją do 20% na krawędzi wybuchu.',
  },
  pierce: {
    emoji: '➡️',
    label: 'Przebicie',
    description: 'Dodatkowa ilość wrogów, przez których przelatuje pocisk przed zniknięciem.',
  },
  projectileCount: {
    emoji: '🔢',
    label: 'Ilość pocisków',
    description: 'Dodatkowe pociski wystrzeliwane przy każdym ataku broni.',
  },
  knockback: {
    emoji: '💪',
    label: 'Odrzut',
    description: 'Zwiększa siłę odrzutu wrogów przy trafieniu.',
  },
  attackRange: {
    emoji: '🔭',
    label: 'Zasięg ataku',
    description: 'Zwiększa maksymalny zasięg broni.',
  },
  maxWeapons: {
    emoji: '🗡️',
    label: 'Maks. broni',
    description: 'Maksymalna ilość broni możliwych do wyposażenia jednocześnie.',
  },
};
