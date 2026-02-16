import type { GameViewActions, GameViewModel } from "../types";

type MainMenuContentProps = {
  view: Pick<GameViewModel, "touchEnabled">;
  actions: Pick<GameViewActions, "onStartNewGame" | "onOpenControls" | "onOpenBestiary">;
};

export function MainMenuContent({ view, actions }: MainMenuContentProps) {
  const { touchEnabled } = view;
  const { onStartNewGame, onOpenControls, onOpenBestiary } = actions;

  return (
    <>
      <div className="menu-title">Labyrinth Runner</div>
      <div className="menu-sub">Retro chase in a shifting maze</div>
      <div className="menu-options">
        <button className="menu-button" onClick={onStartNewGame}>
          Start New Game
        </button>
        <button className="menu-button" onClick={() => onOpenControls(false)}>
          Controls
        </button>
        <button className="menu-button" onClick={() => onOpenBestiary(false)}>
          Bestiary
        </button>
      </div>
      <div className="menu-hint">
        {touchEnabled ? (
          "Tap Start New Game, Controls, or Bestiary."
        ) : (
          <>
            Press <span className="keycap">Enter</span> to start, <span className="keycap">C</span>{" "}
            for controls, <span className="keycap">B</span> for bestiary
          </>
        )}
      </div>
    </>
  );
}
