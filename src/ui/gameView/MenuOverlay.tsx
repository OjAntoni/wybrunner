import { BestiaryMenuContent, ControlsMenuContent, MainMenuContent } from "./menu";
import type { GameViewActions, GameViewModel } from "./types";

type MenuOverlayProps = {
  view: Pick<GameViewModel, "screen" | "touchEnabled" | "controlsReturnToGame" | "bestiaryReturnToGame">;
  actions: Pick<
    GameViewActions,
    "onStartNewGame" | "onOpenControls" | "onCloseControls" | "onOpenBestiary" | "onCloseBestiary"
  >;
};

export function MenuOverlay({ view, actions }: MenuOverlayProps) {
  const { screen, touchEnabled, controlsReturnToGame, bestiaryReturnToGame } = view;
  const { onStartNewGame, onOpenControls, onCloseControls, onOpenBestiary, onCloseBestiary } =
    actions;
  const menuOverlayClass =
    screen === "menu"
      ? "overlay overlay-menu overlay-menu-main"
      : screen === "bestiary"
        ? "overlay overlay-menu overlay-menu-bestiary"
        : "overlay overlay-menu";
  const menuBoxClass = screen === "bestiary" ? "overlay-box menu-box menu-box-bestiary" : "overlay-box menu-box";

  return (
    <div className={menuOverlayClass}>
      <div className={menuBoxClass}>
        {screen === "menu" ? (
          <MainMenuContent
            view={{ touchEnabled }}
            actions={{ onStartNewGame, onOpenControls, onOpenBestiary }}
          />
        ) : screen === "bestiary" ? (
          <BestiaryMenuContent
            view={{ touchEnabled, bestiaryReturnToGame }}
            actions={{ onCloseBestiary }}
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
