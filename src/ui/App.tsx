import { useState, useEffect } from 'preact/hooks';
import { JSX } from 'preact';
import { GameState } from '@/types/enums';
import { useGameState } from './hooks/useGameState';
import { HUD } from './components/HUD';
import { Shop } from './components/Shop';
import { Menu } from './components/Menu';
import { EventBus } from '@/core/EventBus';

/**
 * Root Preact component for all UI overlays.
 * Self-contained - listens to EventBus, no external dependencies needed.
 */
export function App(): JSX.Element {
  const gameState = useGameState();

  // Player state - updated via hudUpdate event
  const [playerState, setPlayerState] = useState({
    hp: 100,
    maxHp: 100,
    gold: 0,
    xp: 0,
    armor: 0,
    damageMultiplier: 1,
    critChance: 0,
    dodge: 0,
    regen: 0,
    weapons: [] as Array<{ type: string; name: string; level: number }>,
    maxWeapons: 3,
    items: [] as string[],
  });

  // Wave info
  const [waveNumber, setWaveNumber] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [isWaveActive, setIsWaveActive] = useState(false);

  // Game over stats
  const [finalWave, setFinalWave] = useState(1);
  const [finalXp, setFinalXp] = useState(0);
  const [character, setCharacter] = useState<string>('normik');

  // Listen to events that update player state
  useEffect(() => {
    const subs = [
      // Main HUD update - receives all player stats
      EventBus.on('hudUpdate', (data) => {
        setPlayerState((prev) => ({
          ...prev,
          hp: data.hp,
          maxHp: data.maxHp,
          gold: data.gold,
          xp: data.xp,
          armor: data.armor,
          damageMultiplier: data.damageMultiplier,
          critChance: data.critChance,
          dodge: data.dodge,
          regen: data.regen,
        }));
        setWaveNumber(data.waveNumber);
        setTimeRemaining(data.timeRemaining);
        setIsWaveActive(data.isWaveActive);
      }),
      EventBus.on('waveStart', ({ waveNumber: wave }) => {
        setWaveNumber(wave);
      }),
      EventBus.on('gameOver', ({ wave, score }) => {
        setFinalWave(wave);
        setFinalXp(score);
      }),
      EventBus.on('gameStart', ({ characterType }) => {
        setCharacter(characterType);
      }),
      // Shop opened - receive player state for shop
      EventBus.on('shopOpened', ({ waveNumber: wave, playerState: state }) => {
        setWaveNumber(wave);
        setPlayerState((prev) => ({
          ...prev,
          gold: state.gold,
          weapons: state.weapons,
          maxWeapons: state.maxWeapons,
          items: state.items ?? prev.items,
        }));
      }),
      // Shop player updated after purchase
      EventBus.on('shopPlayerUpdated', (state) => {
        setPlayerState((prev) => ({
          ...prev,
          gold: state.gold,
          weapons: state.weapons,
          maxWeapons: state.maxWeapons,
          items: state.items,
        }));
      }),
    ];

    return (): void => {
      subs.forEach((s) => {
        s.unsubscribe();
      });
    };
  }, []);

  const showHUD = [GameState.PLAYING, GameState.SHOP, GameState.PAUSED].includes(gameState);
  const showShop = gameState === GameState.SHOP;

  return (
    <>
      <HUD
        visible={showHUD}
        playerState={playerState}
        waveNumber={waveNumber}
        timeRemaining={timeRemaining}
        isWaveActive={isWaveActive}
      />
      <Shop visible={showShop} playerState={playerState} waveNumber={waveNumber} />
      <Menu gameState={gameState} finalWave={finalWave} finalXp={finalXp} character={character} />
    </>
  );
}
