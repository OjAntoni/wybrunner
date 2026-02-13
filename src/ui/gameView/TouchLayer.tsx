import { BOMB_PURCHASE_COINS, SPIKE_PURCHASE_COINS } from "../../game/config/constants";
import type { GameViewActions, GameViewModel, GameViewRefs } from "./types";

type TouchLayerProps = {
  view: Pick<GameViewModel, "spikesLeft" | "bombsLeft">;
  refs: Pick<GameViewRefs, "joystickRef" | "joystickZoneRef" | "joystickKnobRef">;
  actions: Pick<
    GameViewActions,
    | "onPauseGame"
    | "onOpenEquipment"
    | "onJoystickPointerDown"
    | "onJoystickPointerMove"
    | "onJoystickPointerUp"
    | "onTrapPointerDown"
    | "onBombPointerDown"
    | "onSwordPointerDown"
  >;
};

function TouchCostBadge({ amount }: { amount: number }) {
  return (
    <span className="touch-action-cost" aria-hidden="true">
      <svg className="cost-coin-icon" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="8" />
        <rect x="11" y="7" width="2" height="10" fill="#05070c" opacity="0.35" />
      </svg>
      <span>{amount}</span>
    </span>
  );
}

export function TouchLayer({ view, refs, actions }: TouchLayerProps) {
  const { spikesLeft, bombsLeft } = view;
  const spikeOutOfStock = spikesLeft <= 0;
  const bombOutOfStock = bombsLeft <= 0;
  const { joystickRef, joystickZoneRef, joystickKnobRef } = refs;
  const {
    onPauseGame,
    onOpenEquipment,
    onJoystickPointerDown,
    onJoystickPointerMove,
    onJoystickPointerUp,
    onTrapPointerDown,
    onBombPointerDown,
    onSwordPointerDown,
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
        ref={joystickZoneRef}
        className="touch-joystick-zone"
        onPointerDown={onJoystickPointerDown}
        onPointerMove={onJoystickPointerMove}
        onPointerUp={onJoystickPointerUp}
        onPointerCancel={onJoystickPointerUp}
      >
        <div ref={joystickRef} className="touch-joystick">
          <div className="touch-joystick-ring" />
          <div ref={joystickKnobRef} className="touch-joystick-knob" />
        </div>
      </div>

      <div className="touch-actions">
        <button
          className="touch-action touch-action-sword"
          onPointerDown={onSwordPointerDown}
          aria-label="Sword attack"
          type="button"
        >
          <svg className="touch-action-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 18 L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
            <rect x="4" y="16" width="6" height="2" rx="1" />
          </svg>
        </button>
        <div className="touch-actions-row">
          <button
            className={`touch-action touch-action-trap${spikeOutOfStock ? " touch-action-has-cost" : ""}`}
            onPointerDown={onTrapPointerDown}
            aria-label="Place trap"
            type="button"
          >
            {spikeOutOfStock && <TouchCostBadge amount={SPIKE_PURCHASE_COINS} />}
            <svg className="touch-action-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2 L18 10 L12 8 L6 10 Z" fill="currentColor" />
              <rect x="10.5" y="10" width="3" height="10" />
              <rect x="7" y="20" width="10" height="2" />
            </svg>
            <span className="touch-action-count">x{spikesLeft}</span>
          </button>
          <button
            className={`touch-action touch-action-bomb${bombOutOfStock ? " touch-action-has-cost" : ""}`}
            onPointerDown={onBombPointerDown}
            aria-label="Place bomb"
            type="button"
          >
            {bombOutOfStock && <TouchCostBadge amount={BOMB_PURCHASE_COINS} />}
            <svg className="touch-action-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10" cy="14" r="6" />
              <rect x="14" y="6" width="6" height="2" />
              <circle cx="20" cy="6" r="2" />
            </svg>
            <span className="touch-action-count">x{bombsLeft}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
