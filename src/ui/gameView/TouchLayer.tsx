import type { GameViewActions, GameViewModel, GameViewRefs } from "./types";

type TouchLayerProps = {
  view: Pick<GameViewModel, "spikesLeft" | "bombsLeft">;
  refs: Pick<GameViewRefs, "joystickRef" | "joystickKnobRef">;
  actions: Pick<
    GameViewActions,
    | "onPauseGame"
    | "onOpenEquipment"
    | "onJoystickPointerDown"
    | "onJoystickPointerMove"
    | "onJoystickPointerUp"
    | "onTrapPointerDown"
    | "onBombPointerDown"
  >;
};

export function TouchLayer({ view, refs, actions }: TouchLayerProps) {
  const { spikesLeft, bombsLeft } = view;
  const { joystickRef, joystickKnobRef } = refs;
  const {
    onPauseGame,
    onOpenEquipment,
    onJoystickPointerDown,
    onJoystickPointerMove,
    onJoystickPointerUp,
    onTrapPointerDown,
    onBombPointerDown,
  } = actions;
  return (
    <div className="touch-layer">
      <div className="touch-top-actions">
        <button className="touch-top-button" onClick={onPauseGame}>
          Menu
        </button>
        <button className="touch-top-button" onClick={onOpenEquipment}>
          Gear
        </button>
      </div>

      <div
        ref={joystickRef}
        className="touch-joystick"
        onPointerDown={onJoystickPointerDown}
        onPointerMove={onJoystickPointerMove}
        onPointerUp={onJoystickPointerUp}
        onPointerCancel={onJoystickPointerUp}
      >
        <div className="touch-joystick-ring" />
        <div ref={joystickKnobRef} className="touch-joystick-knob" />
      </div>

      <div className="touch-actions">
        <button
          className="touch-action touch-action-trap"
          onPointerDown={onTrapPointerDown}
          disabled={spikesLeft <= 0}
          aria-label="Place trap"
          type="button"
        >
          <svg className="touch-action-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 2 L18 10 L12 8 L6 10 Z" fill="currentColor" />
            <rect x="10.5" y="10" width="3" height="10" />
            <rect x="7" y="20" width="10" height="2" />
          </svg>
          <span className="touch-action-count">x{spikesLeft}</span>
        </button>
        <button
          className="touch-action touch-action-bomb"
          onPointerDown={onBombPointerDown}
          disabled={bombsLeft <= 0}
          aria-label="Place bomb"
          type="button"
        >
          <svg className="touch-action-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10" cy="14" r="6" />
            <rect x="14" y="6" width="6" height="2" />
            <circle cx="20" cy="6" r="2" />
          </svg>
          <span className="touch-action-count">x{bombsLeft}</span>
        </button>
      </div>
    </div>
  );
}
