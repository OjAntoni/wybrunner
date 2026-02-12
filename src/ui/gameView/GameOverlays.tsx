import {
  EndOverlay,
  EquipmentOverlay,
  PauseOverlay,
  RestartConfirmOverlay,
} from "./overlays";
import type { GameViewActions, GameViewModel } from "./types";

type GameOverlaysProps = {
  view: Pick<
    GameViewModel,
    | "status"
    | "loseReason"
    | "touchEnabled"
    | "paused"
    | "confirmRestartOpen"
    | "equipmentOpen"
    | "spikesLeft"
    | "bombsLeft"
    | "itemsLeft"
    | "coinsCollected"
  >;
  actions: Pick<
    GameViewActions,
    | "onGoToMainMenu"
    | "onResumeFromPause"
    | "onPauseOpenEquipment"
    | "onOpenControls"
    | "onOpenRestartConfirm"
    | "onCloseEquipment"
    | "onResumeFromEquipment"
    | "onCloseRestartConfirm"
    | "onRestartConfirmed"
  >;
};

export function GameOverlays({ view, actions }: GameOverlaysProps) {
  return (
    <>
      <EndOverlay
        view={view}
        actions={{ onGoToMainMenu: actions.onGoToMainMenu }}
      />
      <PauseOverlay
        view={view}
        actions={{
          onResumeFromPause: actions.onResumeFromPause,
          onPauseOpenEquipment: actions.onPauseOpenEquipment,
          onOpenControls: actions.onOpenControls,
          onOpenRestartConfirm: actions.onOpenRestartConfirm,
          onGoToMainMenu: actions.onGoToMainMenu,
        }}
      />
      <EquipmentOverlay
        view={view}
        actions={{
          onCloseEquipment: actions.onCloseEquipment,
          onResumeFromEquipment: actions.onResumeFromEquipment,
        }}
      />
      <RestartConfirmOverlay
        view={view}
        actions={{
          onCloseRestartConfirm: actions.onCloseRestartConfirm,
          onRestartConfirmed: actions.onRestartConfirmed,
        }}
      />
    </>
  );
}
