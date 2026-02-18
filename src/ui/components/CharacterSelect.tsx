import { JSX } from 'preact';
import { EventBus } from '@/events/EventBus';
import { CharacterType } from '@/types/enums';
import { CHARACTER_TYPES, CharacterConfig } from '@/config/characters.config';
import { WEAPON_TYPES } from '@/domain/weapons/config';

function getSpecialStat(charType: CharacterType, config: CharacterConfig): JSX.Element {
  const baseSpeed = 240;
  const speedDiff = Math.round((config.speed / baseSpeed - 1) * 100);

  // Each character shows their unique bonus
  if (charType === CharacterType.WYPALENIEC) {
    // Wypaleniec: shows damage bonus
    const dmgBonus = Math.round((config.damageMultiplier - 1) * 100);
    return (
      <>
        <li>⚔️ Obrażenia: +{dmgBonus}%</li>
        <li>🦶 Szybkość: {speedDiff}%</li>
      </>
    );
  } else if (charType === CharacterType.CWANIAK) {
    // Cwaniak: shows gold bonus and speed
    const goldBonus = Math.round((config.goldMultiplier - 1) * 100);
    return (
      <>
        <li>🦶 Szybkość: +{speedDiff}%</li>
        <li>💰 Złoto: +{goldBonus}%</li>
      </>
    );
  } else {
    // Normik: shows balanced stats
    const dmgBonus = Math.round((config.damageMultiplier - 1) * 100);
    return (
      <>
        <li>
          ⚔️ Obrażenia: {dmgBonus >= 0 ? '+' : ''}
          {dmgBonus}%
        </li>
        <li>
          🦶 Szybkość: {speedDiff >= 0 ? '+' : ''}
          {speedDiff}%
        </li>
      </>
    );
  }
}

export function CharacterSelect(): JSX.Element {
  const handleSelect = (type: CharacterType): void => {
    EventBus.emit('characterSelected', { characterType: type });
  };

  return (
    <div id="character-select">
      {Object.entries(CHARACTER_TYPES).map(([type, config]) => {
        const charType = type as CharacterType;

        return (
          <div
            key={type}
            class="character-card"
            data-character={type}
            onClick={(): void => {
              handleSelect(charType);
            }}
          >
            <div class="character-icon">{config.emoji}</div>
            <h3>{config.name}</h3>
            <p class="character-desc">{config.description}</p>
            <ul class="character-stats">
              <li>❤️ HP: {config.maxHp}</li>
              {getSpecialStat(charType, config)}
              <li>🔫 Broń: {getWeaponName(config.startingWeapon)}</li>
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function getWeaponName(weaponType: string): string {
  const weaponConfig = WEAPON_TYPES[weaponType as keyof typeof WEAPON_TYPES];
  return weaponConfig.name;
}
