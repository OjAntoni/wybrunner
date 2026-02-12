import type { GameViewActions, GameViewModel } from "../types";

type EndOverlayProps = {
  view: Pick<GameViewModel, "status" | "loseReason" | "touchEnabled">;
  actions: Pick<GameViewActions, "onGoToMainMenu">;
};

function getLoseTitle(status: GameViewModel["status"], reason: GameViewModel["loseReason"]) {
  if (status === "win") return "You Escaped!";
  if (reason === "trap") return "Trapped!";
  if (reason === "arrow") return "Skewered!";
  if (reason === "helper") return "Intercepted!";
  return "Caught!";
}

function getLoseText(status: GameViewModel["status"], reason: GameViewModel["loseReason"]) {
  if (status === "win") return "All artifacts collected.";
  if (reason === "trap") return "You stepped on a trap.";
  if (reason === "arrow") return "A wall thrower landed a hit.";
  if (reason === "helper") return "A hunter found you.";
  return "The monster matched your pace.";
}

export function EndOverlay({ view, actions }: EndOverlayProps) {
  const { status, loseReason, touchEnabled } = view;
  const { onGoToMainMenu } = actions;

  if (status === "playing") return null;

  return (
    <div className="overlay">
      <div className="overlay-box">
        <div className="overlay-title">{getLoseTitle(status, loseReason)}</div>
        <div className="overlay-text">{getLoseText(status, loseReason)}</div>
        <button className="overlay-button" onClick={onGoToMainMenu}>
          Main Menu
        </button>
        <div className="menu-hint">
          {touchEnabled ? (
            "Tap Main Menu to continue."
          ) : (
            <>
              Press <span className="keycap">Enter</span> or <span className="keycap">Esc</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
