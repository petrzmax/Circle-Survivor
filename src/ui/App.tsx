import { DevMenu } from '@/debug/DevMenu';
import { EventBus } from '@/events/EventBus';
import { CharacterType, GameState } from '@/types/enums';
import { JSX } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import toast, { Toaster } from 'react-hot-toast';
import { HUD } from './components/HUD';
import { Menu } from './components/Menu';
import { Shop } from './components/Shop';
import { WaveClearOverlay } from './components/WaveClearOverlay';
import { useGameState } from './hooks/useGameState';

/**
 * Root Preact component for all UI overlays.
 * Self-contained - listens to EventBus, no external dependencies needed.
 * Player and wave state handled by hooks inside child components.
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

  // Game over stats
  const [finalWave, setFinalWave] = useState(1);
  const [finalXp, setFinalXp] = useState(0);
  const [character, setCharacter] = useState<CharacterType>(CharacterType.NORMIK);

  useEffect(() => {
    const subs = [
      EventBus.on('gameOver', ({ wave, score }) => {
        setFinalWave(wave);
        setFinalXp(score);
      }),
      EventBus.on('characterSelected', ({ characterType }) => {
        setCharacter(characterType);
      }),
    ];

    return (): void => {
      subs.forEach((s) => {
        s.unsubscribe();
      });
    };
  }, []);

  const showHUD = [GameState.PLAYING, GameState.WAVE_CLEARED, GameState.SHOP, GameState.PAUSED].includes(gameState);
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
      <HUD visible={showHUD} />
      <Shop visible={showShop} />
      <WaveClearOverlay />
      <Menu gameState={gameState} finalWave={finalWave} finalXp={finalXp} character={character} />
      {import.meta.env.DEV && <DevMenu />}
    </>
  );
}
