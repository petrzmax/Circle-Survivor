/**
 * InputSystem - Unified input coordinator.
 * Merges keyboard and gamepad input into a single InputState.
 * Provides analog input values when gamepad is used.
 */

import { StateManager } from '@/managers/StateManager';
import { singleton } from 'tsyringe';
import { GamepadHandler } from './GamepadHandler';
import { InputHandler, KeyState } from './InputHandler';
import { TouchHandler } from './TouchHandler';

/**
 * Extended input state with optional analog values.
 * Digital booleans for backward compatibility.
 * Analog values (-1 to 1) for precise gamepad control.
 */
export interface ExtendedInputState {
  // Digital (for backward compatibility)
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;

  // Analog (optional - present when gamepad provides input)
  analogX?: number;
  analogY?: number;
}

/**
 * InputSystem - coordinates keyboard and gamepad input.
 */
@singleton()
export class InputSystem {
  private keyboardHandler: InputHandler;
  private gamepadHandler: GamepadHandler;
  private touchHandler: TouchHandler;

  /** Threshold for converting analog to digital */
  private readonly analogThreshold: number = 0.3;

  public constructor(stateManager: StateManager) {
    this.keyboardHandler = new InputHandler(stateManager);
    this.gamepadHandler = new GamepadHandler();
    this.touchHandler = new TouchHandler();
    this.setup();
  }

  /**
   * Initialize all input handlers
   */
  public setup(): void {
    this.keyboardHandler.setup();
    this.gamepadHandler.setup();
    this.touchHandler.setup();
  }

  /**
   * Poll gamepad state - call every frame
   */
  public poll(): void {
    this.gamepadHandler.poll();
  }

  /**
   * Get unified input state from all sources.
   * Merges keyboard and gamepad input with OR logic.
   * Provides analog values when gamepad is active.
   */
  public getInputState(): ExtendedInputState {
    // Get keyboard state
    const keys = this.keyboardHandler.getKeys();
    const kbState = this.getKeyboardState(keys);

    // Get gamepad state
    const gpState = this.getGamepadState();

    // Get touch state
    const touchAnalog = this.touchHandler.getAnalog();
    const hasTouchInput =
      this.touchHandler.isTouchActive() &&
      (Math.abs(touchAnalog.x) > 0.01 || Math.abs(touchAnalog.y) > 0.01);

    // Check if gamepad is providing meaningful analog input
    const hasGamepadAnalog =
      gpState.analogX !== undefined &&
      gpState.analogY !== undefined &&
      (Math.abs(gpState.analogX) > 0.01 || Math.abs(gpState.analogY) > 0.01);

    // Convert touch analog to digital
    const touchUp = hasTouchInput && touchAnalog.y < -this.analogThreshold;
    const touchDown = hasTouchInput && touchAnalog.y > this.analogThreshold;
    const touchLeft = hasTouchInput && touchAnalog.x < -this.analogThreshold;
    const touchRight = hasTouchInput && touchAnalog.x > this.analogThreshold;

    // Merge: OR logic for digital
    const result: ExtendedInputState = {
      up: kbState.up || gpState.up || touchUp,
      down: kbState.down || gpState.down || touchDown,
      left: kbState.left || gpState.left || touchLeft,
      right: kbState.right || gpState.right || touchRight,
    };

    // Include analog values (touch takes priority over gamepad)
    if (hasTouchInput) {
      result.analogX = touchAnalog.x;
      result.analogY = touchAnalog.y;
    } else if (hasGamepadAnalog) {
      result.analogX = gpState.analogX;
      result.analogY = gpState.analogY;
    }

    return result;
  }

  /**
   * Check if any gamepad is connected
   */
  public isGamepadConnected(): boolean {
    return this.gamepadHandler.isConnected();
  }

  /**
   * Get raw keyboard handler (for backward compatibility if needed)
   */
  public getKeyboardHandler(): InputHandler {
    return this.keyboardHandler;
  }

  /**
   * Get raw gamepad handler (for advanced usage)
   */
  public getGamepadHandler(): GamepadHandler {
    return this.gamepadHandler;
  }

  /**
   * Convert keyboard key state to directional input
   */
  private getKeyboardState(keys: KeyState): ExtendedInputState {
    return {
      up: keys.w === true || keys.arrowup === true,
      down: keys.s === true || keys.arrowdown === true,
      left: keys.a === true || keys.arrowleft === true,
      right: keys.d === true || keys.arrowright === true,
    };
  }

  /**
   * Get gamepad state with analog values and digital conversion
   */
  private getGamepadState(): ExtendedInputState {
    if (!this.gamepadHandler.isConnected()) {
      return { up: false, down: false, left: false, right: false };
    }

    const leftStick = this.gamepadHandler.getLeftStick();
    const dpad = this.gamepadHandler.getDPad();

    // Convert analog stick to digital with threshold
    const stickUp = leftStick.y < -this.analogThreshold;
    const stickDown = leftStick.y > this.analogThreshold;
    const stickLeft = leftStick.x < -this.analogThreshold;
    const stickRight = leftStick.x > this.analogThreshold;

    return {
      // Digital: D-Pad OR analog stick (with threshold)
      up: dpad.up || stickUp,
      down: dpad.down || stickDown,
      left: dpad.left || stickLeft,
      right: dpad.right || stickRight,

      // Analog: raw stick values (already deadzone-applied)
      analogX: leftStick.x,
      analogY: leftStick.y,
    };
  }

  /**
   * Cleanup both handlers
   */
  public destroy(): void {
    this.keyboardHandler.destroy();
    this.gamepadHandler.destroy();
    this.touchHandler.destroy();
  }
}
