import { ControlsMenuContent, MainMenuContent } from "./menu";
import type { GameViewActions, GameViewModel } from "./types";

type MenuOverlayProps = {
  view: Pick<GameViewModel, "screen" | "touchEnabled" | "controlsReturnToGame">;
  actions: Pick<GameViewActions, "onStartNewGame" | "onOpenControls" | "onCloseControls">;
};

export function MenuOverlay({ view, actions }: MenuOverlayProps) {
  const { screen, touchEnabled, controlsReturnToGame } = view;
  const { onStartNewGame, onOpenControls, onCloseControls } = actions;

  return (
    <div className={`overlay overlay-menu${screen === "menu" ? " overlay-menu-main" : ""}`}>
      <div className="overlay-box menu-box">
        {screen === "menu" ? (
          <MainMenuContent
            view={{ touchEnabled }}
            actions={{ onStartNewGame, onOpenControls }}
          />
        ) : (
          <ControlsMenuContent
            view={{ touchEnabled, controlsReturnToGame }}
            actions={{ onStartNewGame, onCloseControls }}
          />
        )}
      </div>
    </div>
  );
}
