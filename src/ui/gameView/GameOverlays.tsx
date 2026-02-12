import {
  EndOverlay,
  EquipmentOverlay,
  MapOverlay,
  PauseOverlay,
  RestartConfirmOverlay,
} from "./overlays";
import type { GameViewActions, GameViewModel, GameViewRefs } from "./types";

type GameOverlaysProps = {
  view: Pick<
    GameViewModel,
    | "status"
    | "loseReason"
    | "touchEnabled"
    | "paused"
    | "mapOpen"
    | "confirmRestartOpen"
    | "equipmentOpen"
    | "spikesLeft"
    | "bombsLeft"
    | "itemsLeft"
    | "coinsCollected"
  > &
    Pick<GameViewRefs, "stateRef" | "gameNowRef" | "fogSpritesRef" | "exploreCloudSpritesRef">;
  actions: Pick<
    GameViewActions,
    | "onGoToMainMenu"
    | "onResumeFromPause"
    | "onPauseOpenEquipment"
    | "onOpenMap"
    | "onCloseMap"
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
          onOpenMap: actions.onOpenMap,
          onOpenControls: actions.onOpenControls,
          onOpenRestartConfirm: actions.onOpenRestartConfirm,
          onGoToMainMenu: actions.onGoToMainMenu,
        }}
      />
      <MapOverlay
        view={view}
        actions={{
          onCloseMap: actions.onCloseMap,
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
