/**
 * GamepadHandler - Gamepad API integration.
 * Polls connected gamepads and provides normalized input state.
 * Uses circular deadzone for analog sticks.
 */

/** Standard gamepad button indices */
export enum GamepadButton {
  A = 0,
  B = 1,
  X = 2,
  Y = 3,
  LB = 4,
  RB = 5,
  LT = 6,
  RT = 7,
  SELECT = 8,
  START = 9,
  L3 = 10,
  R3 = 11,
  DPAD_UP = 12,
  DPAD_DOWN = 13,
  DPAD_LEFT = 14,
  DPAD_RIGHT = 15,
  HOME = 16,
}

/** Standard gamepad axis indices */
export enum GamepadAxis {
  LEFT_STICK_X = 0,
  LEFT_STICK_Y = 1,
  RIGHT_STICK_X = 2,
  RIGHT_STICK_Y = 3,
}

/** 2D vector for stick position */
export interface StickPosition {
  x: number;
  y: number;
}

/** D-Pad state */
export interface DPadState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

/**
 * GamepadHandler - manages gamepad connections and input polling.
 */
export class GamepadHandler {
  /** Connected gamepad indices */
  private connectedIndices = new Set<number>();

  /** Deadzone threshold (0-1) */
  private readonly deadzone: number = 0.15;

  /** Cached gamepad reference (updated each poll) */
  private currentGamepad: Gamepad | null = null;

  /**
   * Initialize gamepad event listeners
   */
  public setup(): void {
    window.addEventListener('gamepadconnected', this.onConnect.bind(this));
    window.addEventListener('gamepaddisconnected', this.onDisconnect.bind(this));

    // Check for already-connected gamepads (Safari workaround)
    this.pollForNewGamepads();
  }

  /**
   * Poll gamepad state - must be called every frame
   */
  public poll(): void {
    const gamepads = navigator.getGamepads();

    // Update current gamepad reference (use first connected)
    this.currentGamepad = null;
    for (const gamepad of gamepads) {
      if (gamepad && this.connectedIndices.has(gamepad.index)) {
        this.currentGamepad = gamepad;
        break;
      }
    }

    // Safari workaround: check for new gamepads each frame
    this.pollForNewGamepads();
  }

  /**
   * Check if any gamepad is connected
   */
  public isConnected(): boolean {
    return this.connectedIndices.size > 0;
  }

  /**
   * Get number of connected gamepads
   */
  public getConnectedCount(): number {
    return this.connectedIndices.size;
  }

  /**
   * Get the primary gamepad (first connected)
   */
  public getGamepad(): Gamepad | null {
    return this.currentGamepad;
  }

  /**
   * Check if a button is currently pressed
   */
  public isButtonPressed(buttonIndex: GamepadButton): boolean {
    if (!this.currentGamepad) return false;
    return this.currentGamepad.buttons[buttonIndex]?.pressed ?? false;
  }

  /**
   * Get raw axis value (-1 to 1)
   */
  public getAxis(axisIndex: GamepadAxis): number {
    if (!this.currentGamepad) return 0;
    return this.currentGamepad.axes[axisIndex] ?? 0;
  }

  /**
   * Get left stick position with circular deadzone applied
   */
  public getLeftStick(): StickPosition {
    if (!this.currentGamepad) return { x: 0, y: 0 };

    const x = this.currentGamepad.axes[GamepadAxis.LEFT_STICK_X] ?? 0;
    const y = this.currentGamepad.axes[GamepadAxis.LEFT_STICK_Y] ?? 0;

    return this.applyCircularDeadzone(x, y);
  }

  /**
   * Get right stick position with circular deadzone applied
   */
  public getRightStick(): StickPosition {
    if (!this.currentGamepad) return { x: 0, y: 0 };

    const x = this.currentGamepad.axes[GamepadAxis.RIGHT_STICK_X] ?? 0;
    const y = this.currentGamepad.axes[GamepadAxis.RIGHT_STICK_Y] ?? 0;

    return this.applyCircularDeadzone(x, y);
  }

  /**
   * Get D-Pad state
   */
  public getDPad(): DPadState {
    if (!this.currentGamepad) {
      return { up: false, down: false, left: false, right: false };
    }

    return {
      up: this.currentGamepad.buttons[GamepadButton.DPAD_UP]?.pressed ?? false,
      down: this.currentGamepad.buttons[GamepadButton.DPAD_DOWN]?.pressed ?? false,
      left: this.currentGamepad.buttons[GamepadButton.DPAD_LEFT]?.pressed ?? false,
      right: this.currentGamepad.buttons[GamepadButton.DPAD_RIGHT]?.pressed ?? false,
    };
  }

  /**
   * Apply circular deadzone to stick input.
   * More precise than per-axis deadzone.
   */
  private applyCircularDeadzone(x: number, y: number): StickPosition {
    const magnitude = Math.sqrt(x * x + y * y);

    if (magnitude < this.deadzone) {
      return { x: 0, y: 0 };
    }

    // Rescale to 0-1 range after deadzone
    const normalized = (magnitude - this.deadzone) / (1 - this.deadzone);
    const scale = normalized / magnitude;

    return {
      x: x * scale,
      y: y * scale,
    };
  }

  /**
   * Poll for gamepads that might have been connected before event listeners.
   * Safari doesn't reliably fire gamepadconnected events.
   */
  private pollForNewGamepads(): void {
    const gamepads = navigator.getGamepads();

    for (const gamepad of gamepads) {
      if (gamepad && !this.connectedIndices.has(gamepad.index)) {
        this.connectedIndices.add(gamepad.index);
        console.log(`🎮 Gamepad detected: "${gamepad.id}" (index: ${gamepad.index})`);
      }
    }
  }

  /**
   * Handle gamepad connection event
   */
  private onConnect(event: GamepadEvent): void {
    const gamepad = event.gamepad;
    this.connectedIndices.add(gamepad.index);
    console.log(`🎮 Gamepad connected: "${gamepad.id}" (index: ${gamepad.index})`);
  }

  /**
   * Handle gamepad disconnection event
   */
  private onDisconnect(event: GamepadEvent): void {
    const gamepad = event.gamepad;
    this.connectedIndices.delete(gamepad.index);
    console.log(`🎮 Gamepad disconnected: "${gamepad.id}" (index: ${gamepad.index})`);

    // Clear current if it was the disconnected one
    if (this.currentGamepad?.index === gamepad.index) {
      this.currentGamepad = null;
    }
  }

  /**
   * Cleanup event listeners
   */
  public destroy(): void {
    window.removeEventListener('gamepadconnected', this.onConnect.bind(this));
    window.removeEventListener('gamepaddisconnected', this.onDisconnect.bind(this));
  }
}
