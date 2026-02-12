import { MenuOverlay } from "./MenuOverlay";
import type { GameViewActions, GameViewModel } from "./types";

type MenuScreenViewProps = {
  view: Pick<GameViewModel, "screen" | "touchEnabled" | "controlsReturnToGame">;
  actions: Pick<GameViewActions, "onStartNewGame" | "onOpenControls" | "onCloseControls">;
};

export function MenuScreenView({ view, actions }: MenuScreenViewProps) {
  return (
    <MenuOverlay
      view={{
        screen: view.screen === "controls" ? "controls" : "menu",
        touchEnabled: view.touchEnabled,
        controlsReturnToGame: view.controlsReturnToGame,
      }}
      actions={{
        onStartNewGame: actions.onStartNewGame,
        onOpenControls: actions.onOpenControls,
        onCloseControls: actions.onCloseControls,
      }}
    />
  );
}
