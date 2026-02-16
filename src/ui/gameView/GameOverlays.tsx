import { memo } from "react";
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
    | "onOpenBestiary"
    | "onOpenRestartConfirm"
    | "onCloseEquipment"
    | "onResumeFromEquipment"
    | "onCloseRestartConfirm"
    | "onRestartConfirmed"
  >;
};

function GameOverlaysComponent({ view, actions }: GameOverlaysProps) {
  const showEndOverlay = view.status !== "playing";
  const showPauseOverlay =
    view.paused &&
    !view.mapOpen &&
    view.status === "playing" &&
    !view.confirmRestartOpen &&
    !view.equipmentOpen;
  const showMapOverlay = view.mapOpen && view.status === "playing" && !view.confirmRestartOpen;
  const showEquipmentOverlay =
    view.equipmentOpen && view.status === "playing" && !view.confirmRestartOpen;
  const showRestartConfirmOverlay = view.confirmRestartOpen;

  return (
    <>
      {showEndOverlay && (
        <EndOverlay
          view={view}
          actions={{ onGoToMainMenu: actions.onGoToMainMenu }}
        />
      )}
      {showPauseOverlay && (
        <PauseOverlay
          view={view}
          actions={{
            onResumeFromPause: actions.onResumeFromPause,
            onPauseOpenEquipment: actions.onPauseOpenEquipment,
            onOpenMap: actions.onOpenMap,
            onOpenControls: actions.onOpenControls,
            onOpenBestiary: actions.onOpenBestiary,
            onOpenRestartConfirm: actions.onOpenRestartConfirm,
            onGoToMainMenu: actions.onGoToMainMenu,
          }}
        />
      )}
      {showMapOverlay && (
        <MapOverlay
          view={view}
          actions={{
            onCloseMap: actions.onCloseMap,
          }}
        />
      )}
      {showEquipmentOverlay && (
        <EquipmentOverlay
          view={view}
          actions={{
            onCloseEquipment: actions.onCloseEquipment,
            onResumeFromEquipment: actions.onResumeFromEquipment,
          }}
        />
      )}
      {showRestartConfirmOverlay && (
        <RestartConfirmOverlay
          view={view}
          actions={{
            onCloseRestartConfirm: actions.onCloseRestartConfirm,
            onRestartConfirmed: actions.onRestartConfirmed,
          }}
        />
      )}
    </>
  );
}

export const GameOverlays = memo(GameOverlaysComponent, (prev, next) => {
  const sameViewShell =
    prev.view.status === next.view.status &&
    prev.view.loseReason === next.view.loseReason &&
    prev.view.touchEnabled === next.view.touchEnabled &&
    prev.view.paused === next.view.paused &&
    prev.view.mapOpen === next.view.mapOpen &&
    prev.view.confirmRestartOpen === next.view.confirmRestartOpen &&
    prev.view.equipmentOpen === next.view.equipmentOpen &&
    prev.view.stateRef === next.view.stateRef &&
    prev.view.gameNowRef === next.view.gameNowRef &&
    prev.view.fogSpritesRef === next.view.fogSpritesRef &&
    prev.view.exploreCloudSpritesRef === next.view.exploreCloudSpritesRef;

  if (!sameViewShell) return false;

  const equipmentOpen = prev.view.equipmentOpen || next.view.equipmentOpen;
  if (equipmentOpen) {
    if (
      prev.view.spikesLeft !== next.view.spikesLeft ||
      prev.view.bombsLeft !== next.view.bombsLeft ||
      prev.view.itemsLeft !== next.view.itemsLeft ||
      prev.view.coinsCollected !== next.view.coinsCollected
    ) {
      return false;
    }
  }

  return (
    prev.actions.onGoToMainMenu === next.actions.onGoToMainMenu &&
    prev.actions.onResumeFromPause === next.actions.onResumeFromPause &&
    prev.actions.onPauseOpenEquipment === next.actions.onPauseOpenEquipment &&
    prev.actions.onOpenMap === next.actions.onOpenMap &&
    prev.actions.onCloseMap === next.actions.onCloseMap &&
    prev.actions.onOpenControls === next.actions.onOpenControls &&
    prev.actions.onOpenBestiary === next.actions.onOpenBestiary &&
    prev.actions.onOpenRestartConfirm === next.actions.onOpenRestartConfirm &&
    prev.actions.onCloseEquipment === next.actions.onCloseEquipment &&
    prev.actions.onResumeFromEquipment === next.actions.onResumeFromEquipment &&
    prev.actions.onCloseRestartConfirm === next.actions.onCloseRestartConfirm &&
    prev.actions.onRestartConfirmed === next.actions.onRestartConfirmed
  );
});
