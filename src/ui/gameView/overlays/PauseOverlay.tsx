import type { GameViewActions, GameViewModel } from "../types";

type PauseOverlayProps = {
  view: Pick<
    GameViewModel,
    "status" | "touchEnabled" | "paused" | "mapOpen" | "confirmRestartOpen" | "equipmentOpen"
  >;
  actions: Pick<
    GameViewActions,
    | "onResumeFromPause"
    | "onPauseOpenEquipment"
    | "onOpenMap"
    | "onOpenControls"
    | "onOpenBestiary"
    | "onOpenRestartConfirm"
    | "onGoToMainMenu"
  >;
};

export function PauseOverlay({ view, actions }: PauseOverlayProps) {
  const { status, touchEnabled, paused, mapOpen, confirmRestartOpen, equipmentOpen } = view;
  const {
    onResumeFromPause,
    onPauseOpenEquipment,
    onOpenMap,
    onOpenControls,
    onOpenBestiary,
    onOpenRestartConfirm,
    onGoToMainMenu,
  } = actions;

  if (!paused || mapOpen || status !== "playing" || confirmRestartOpen || equipmentOpen) {
    return null;
  }

  return (
    <div className="overlay overlay-pause">
      <div className="overlay-box pause-box">
        <div className="overlay-title">Paused</div>
        <div className="overlay-text">
          {touchEnabled ? (
            "Game paused. Open map, equipment, controls, bestiary, or resume."
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
          <button className="overlay-button" onClick={onOpenMap}>
            Map
          </button>
          <button className="overlay-button" onClick={() => onOpenControls(true)}>
            Controls
          </button>
          <button className="overlay-button" onClick={() => onOpenBestiary(true)}>
            Bestiary
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
            "Use the buttons below to resume, open map/equipment/controls/bestiary, restart, or return to menu."
          ) : (
            <>
              <span className="keycap">Esc</span> resume <span className="keycap">M</span> map{" "}
              <span className="keycap">I</span> equipment <span className="keycap">B</span> bestiary{" "}
              <span className="keycap">R</span> restart
            </>
          )}
        </div>
      </div>
    </div>
  );
}
