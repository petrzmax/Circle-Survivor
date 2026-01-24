import { DevMenu } from '@/debug/DevMenu';
import { WeaponType } from '@/domain/weapons/type';
import { EventBus } from '@/events/EventBus';
import { CharacterType, GameState } from '@/types/enums';
import { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import toast, { Toaster } from 'react-hot-toast';
import { HUD } from './components/HUD';
import { Menu } from './components/Menu';
import { Shop } from './components/Shop';
import { useGameState } from './hooks/useGameState';

/**
 * Root Preact component for all UI overlays.
 * Self-contained - listens to EventBus, no external dependencies needed.
 */
export function App(): JSX.Element {
  const gameState = useGameState();

  // Global error handler - show all uncaught errors as toasts
  useEffect(() => {
    const handleError = (event: ErrorEvent): void => {
      toast.error(`Error: ${event.message}`);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
      const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
      toast.error(`Unhandled: ${reason}`);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

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
    weapons: [] as Array<{ type: WeaponType; name: string; level: number }>,
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
  const [character, setCharacter] = useState<CharacterType>(CharacterType.NORMIK);

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
      EventBus.on('characterSelected', ({ characterType }) => {
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
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid #0f3460',
          },
        }}
      />
      <HUD
        visible={showHUD}
        playerState={playerState}
        waveNumber={waveNumber}
        timeRemaining={timeRemaining}
        isWaveActive={isWaveActive}
      />
      <Shop visible={showShop} playerState={playerState} waveNumber={waveNumber} />
      <Menu gameState={gameState} finalWave={finalWave} finalXp={finalXp} character={character} />
      {import.meta.env.DEV && <DevMenu />}
    </>
  );
}
