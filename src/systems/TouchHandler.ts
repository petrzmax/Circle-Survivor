/**
 * TouchHandler - Virtual joystick for touch devices via nipplejs.
 * Mirrors the GamepadHandler API surface so InputSystem can consume it uniformly.
 */

import { EventBus } from '@/events/EventBus';
import { GameState } from '@/types/enums';
import { clamp } from '@/utils/math';
import nipplejs, { type EventData, type JoystickManager, type JoystickOutputData } from 'nipplejs';

export interface TouchAnalog {
  x: number;
  y: number;
}

export class TouchHandler {
  private manager: JoystickManager | null = null;
  private analog: TouchAnalog = { x: 0, y: 0 };
  private isActive = false;
  private zone: HTMLElement | null = null;

  /** Whether the device supports touch input */
  public static isTouchDevice(): boolean {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  public setup(): void {
    if (!TouchHandler.isTouchDevice()) return;

    this.zone = document.getElementById('touch-zone');
    if (!this.zone) return;

    // Show touch zone but not interactive yet (waits for PLAYING state)
    this.zone.classList.add('active');

    // Also show fullscreen button on touch devices
    document.getElementById('fullscreen-btn')?.style.setProperty('display', 'block');

    this.manager = nipplejs.create({
      zone: this.zone,
      mode: 'dynamic',
      color: 'rgba(255, 255, 255, 0.25)',
      size: 120,
      restOpacity: 0,
      fadeTime: 100,
    });

    this.manager.on('move', this.onMove);
    this.manager.on('end', this.onEnd);

    // Only capture touches during gameplay
    EventBus.on('stateEntered', ({ state }) => {
      this.setTouchEnabled(state === GameState.PLAYING);
    });
  }

  public getAnalog(): TouchAnalog {
    return this.analog;
  }

  public isTouchActive(): boolean {
    return this.isActive;
  }

  public destroy(): void {
    if (this.manager) {
      this.manager.off('move', this.onMove);
      this.manager.off('end', this.onEnd);
      this.manager.destroy();
      this.manager = null;
    }
  }

  private setTouchEnabled(enabled: boolean): void {
    if (!this.zone) return;
    this.zone.style.pointerEvents = enabled ? 'auto' : 'none';
    if (!enabled) {
      this.analog = { x: 0, y: 0 };
      this.isActive = false;
    }
  }

  private onMove = (_evt: EventData, data: JoystickOutputData): void => {
    // force is 0 at center, ~1 at edge. Clamp to 1 for consistency.
    const strength = clamp(data.force, 0, 1);
    this.analog = {
      x: data.vector.x * strength,
      y: -data.vector.y * strength, // nipplejs Y is inverted (up = positive)
    };
    this.isActive = true;
  };

  private onEnd = (): void => {
    this.analog = { x: 0, y: 0 };
    this.isActive = false;
  };
}
