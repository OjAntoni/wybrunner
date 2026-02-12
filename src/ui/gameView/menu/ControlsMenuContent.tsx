import type { GameViewActions, GameViewModel } from "../types";
import { KeyboardControlsList } from "./KeyboardControlsList";
import { TouchControlsList } from "./TouchControlsList";

type ControlsMenuContentProps = {
  view: Pick<GameViewModel, "touchEnabled" | "controlsReturnToGame">;
  actions: Pick<GameViewActions, "onStartNewGame" | "onCloseControls">;
};

export function ControlsMenuContent({ view, actions }: ControlsMenuContentProps) {
  const { touchEnabled, controlsReturnToGame } = view;
  const { onStartNewGame, onCloseControls } = actions;

  return (
    <>
      <div className="menu-title">Controls</div>
      <div className="controls-panel">
        {touchEnabled ? <TouchControlsList /> : <KeyboardControlsList />}
        <div className="controls-divider" />
        <div className="controls-blurb">
          Collect all <span className="keycap">10</span> artifacts to win. Avoid traps and hunters.
          Artifacts may trigger boosters, traps, or temporary fog.
        </div>
      </div>
      <div className="menu-options">
        <button className="menu-button" onClick={onCloseControls}>
          Back
        </button>
        {!touchEnabled && !controlsReturnToGame && (
          <button className="menu-button primary" onClick={onStartNewGame}>
            Start
          </button>
        )}
      </div>
      <div className="menu-hint">
        {touchEnabled ? (
          controlsReturnToGame ? "Tap Back to return to the paused game." : "Tap Back to return."
        ) : (
          <>
            Press <span className="keycap">Esc</span> to go back
          </>
        )}
      </div>
    </>
  );
}
