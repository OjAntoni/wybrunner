import { MenuOverlay } from "./MenuOverlay";
import type { GameViewActions, GameViewModel } from "./types";

type MenuScreenViewProps = {
  view: Pick<GameViewModel, "screen" | "touchEnabled" | "controlsReturnToGame" | "bestiaryReturnToGame">;
  actions: Pick<
    GameViewActions,
    "onStartNewGame" | "onOpenControls" | "onCloseControls" | "onOpenBestiary" | "onCloseBestiary"
  >;
};

export function MenuScreenView({ view, actions }: MenuScreenViewProps) {
  return (
    <MenuOverlay
      view={{
        screen: view.screen === "controls" || view.screen === "bestiary" ? view.screen : "menu",
        touchEnabled: view.touchEnabled,
        controlsReturnToGame: view.controlsReturnToGame,
        bestiaryReturnToGame: view.bestiaryReturnToGame,
      }}
        actions={{
          onStartNewGame: actions.onStartNewGame,
          onOpenControls: actions.onOpenControls,
          onCloseControls: actions.onCloseControls,
          onOpenBestiary: actions.onOpenBestiary,
          onCloseBestiary: actions.onCloseBestiary,
        }}
      />
  );
}
