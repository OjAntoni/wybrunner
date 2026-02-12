import type { GameViewActions, GameViewModel } from "../types";

type RestartConfirmOverlayProps = {
  view: Pick<GameViewModel, "touchEnabled" | "confirmRestartOpen">;
  actions: Pick<GameViewActions, "onCloseRestartConfirm" | "onRestartConfirmed">;
};

export function RestartConfirmOverlay({ view, actions }: RestartConfirmOverlayProps) {
  const { touchEnabled, confirmRestartOpen } = view;
  const { onCloseRestartConfirm, onRestartConfirmed } = actions;

  if (!confirmRestartOpen) return null;

  return (
    <div className="overlay overlay-confirm">
      <div className="overlay-box confirm-box">
        <div className="overlay-title">Restart?</div>
        <div className="overlay-text">
          This will generate a new maze and reset your inventory.
        </div>
        <div className="confirm-actions">
          <button className="overlay-button" onClick={onCloseRestartConfirm}>
            Cancel
          </button>
          <button className="overlay-button confirm-danger" onClick={onRestartConfirmed}>
            Restart
          </button>
        </div>
        <div className="menu-hint">
          {touchEnabled ? (
            "Tap Restart to confirm or Cancel to keep playing."
          ) : (
            <>
              <span className="keycap">Enter</span> confirm <span className="keycap">Esc</span>{" "}
              cancel
            </>
          )}
        </div>
      </div>
    </div>
  );
}
