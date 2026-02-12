import { GameScreenView } from "./gameView/GameScreenView";
import { MenuScreenView } from "./gameView/MenuScreenView";
import type { GameViewProps } from "./gameView/index";

export function GameView({ view, refs, actions }: GameViewProps) {
  return (
    <div className="app">
      <canvas ref={refs.canvasRef} className="game-canvas" />
      {view.screen === "game" ? (
        <GameScreenView view={view} refs={refs} actions={actions} />
      ) : (
        <MenuScreenView
          view={{
            screen: view.screen,
            touchEnabled: view.touchEnabled,
            controlsReturnToGame: view.controlsReturnToGame,
          }}
          actions={{
            onStartNewGame: actions.onStartNewGame,
            onOpenControls: actions.onOpenControls,
            onCloseControls: actions.onCloseControls,
          }}
        />
      )}
    </div>
  );
}
