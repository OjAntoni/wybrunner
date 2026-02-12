import type { GameViewActions, GameViewModel } from "../types";

type PauseOverlayProps = {
  view: Pick<
    GameViewModel,
    "status" | "touchEnabled" | "paused" | "confirmRestartOpen" | "equipmentOpen"
  >;
  actions: Pick<
    GameViewActions,
    "onResumeFromPause" | "onPauseOpenEquipment" | "onOpenControls" | "onOpenRestartConfirm" | "onGoToMainMenu"
  >;
};

export function PauseOverlay({ view, actions }: PauseOverlayProps) {
  const { status, touchEnabled, paused, confirmRestartOpen, equipmentOpen } = view;
  const {
    onResumeFromPause,
    onPauseOpenEquipment,
    onOpenControls,
    onOpenRestartConfirm,
    onGoToMainMenu,
  } = actions;

  if (!paused || status !== "playing" || confirmRestartOpen || equipmentOpen) return null;

  return (
    <div className="overlay overlay-pause">
      <div className="overlay-box pause-box">
        <div className="overlay-title">Paused</div>
        <div className="overlay-text">
          {touchEnabled ? (
            "Game paused. Open equipment, view controls, or resume."
          ) : (
            <>
              Press <span className="keycap">Esc</span> to resume.
            </>
          )}
        </div>
        <div className="confirm-actions">
          <button className="overlay-button" onClick={onResumeFromPause}>
            Resume
          </button>
          <button className="overlay-button" onClick={onPauseOpenEquipment}>
            Equipment
          </button>
          <button className="overlay-button" onClick={() => onOpenControls(true)}>
            Controls
          </button>
          <button className="overlay-button" onClick={onOpenRestartConfirm}>
            Restart
          </button>
          <button className="overlay-button" onClick={onGoToMainMenu}>
            Main Menu
          </button>
        </div>
        <div className="menu-hint">
          {touchEnabled ? (
            "Use the buttons below to resume, open equipment, restart, or return to menu."
          ) : (
            <>
              <span className="keycap">Esc</span> resume <span className="keycap">I</span> equipment{" "}
              <span className="keycap">R</span> restart
            </>
          )}
        </div>
      </div>
    </div>
  );
}
