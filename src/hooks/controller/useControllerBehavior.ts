import type { GameViewProps } from "../../ui/gameView/types";
import { useControllerInteractions } from "./useControllerInteractions";
import { useControllerLifecycle } from "./useControllerLifecycle";
import type { ControllerRefs } from "./useControllerRefs";
import { useControllerRuntime } from "./useControllerRuntime";
import type { ControllerStateModel } from "./useControllerState";

type UseControllerBehaviorParams = {
  refs: ControllerRefs;
  state: ControllerStateModel;
};

export function useControllerBehavior({
  refs,
  state,
}: UseControllerBehaviorParams): GameViewProps {
  const runtime = useControllerRuntime({ refs });
  const interactions = useControllerInteractions({ refs, state, runtime });

  useControllerLifecycle({
    refs,
    state,
    resetTouchInput: interactions.resetTouchInput,
    runtime,
  });

  const {
    screen,
    mapOpen,
    status,
    loseReason,
    touchEnabled,
    compactHud,
    paused,
    confirmRestartOpen,
    equipmentOpen,
    controlsReturnToGame,
    bestiaryReturnToGame,
    itemsLeft,
    coinsCollected,
    spikesLeft,
    bombsLeft,
    playerHearts,
    helpText,
  } = state;
  const { canvasRef, hudTopRef, inventoryRef, joystickRef, joystickZoneRef, joystickKnobRef } = refs;
  const { uiActions, joystickActions } = interactions;

  return {
    view: {
      screen,
      mapOpen,
      status,
      loseReason,
      touchEnabled,
      compactHud,
      paused,
      confirmRestartOpen,
      equipmentOpen,
      controlsReturnToGame,
      bestiaryReturnToGame,
      itemsLeft,
      coinsCollected,
      spikesLeft,
      bombsLeft,
      playerHearts,
      helpText,
    },
    refs: {
      canvasRef,
      stateRef: refs.stateRef,
      gameNowRef: refs.gameNowRef,
      fogSpritesRef: refs.fogSpritesRef,
      exploreCloudSpritesRef: refs.exploreCloudSpritesRef,
      hudTopRef,
      inventoryRef,
      joystickRef,
      joystickZoneRef,
      joystickKnobRef,
    },
    actions: {
      onPauseGame: uiActions.pauseGame,
      onOpenEquipment: uiActions.openEquipment,
      onOpenMap: uiActions.openMap,
      onCloseMap: uiActions.closeMap,
      onCloseEquipment: uiActions.closeEquipment,
      onOpenControls: uiActions.openControls,
      onCloseControls: uiActions.closeControls,
      onOpenBestiary: uiActions.openBestiary,
      onCloseBestiary: uiActions.closeBestiary,
      onOpenRestartConfirm: uiActions.openRestartConfirm,
      onCloseRestartConfirm: uiActions.closeRestartConfirm,
      onGoToMainMenu: uiActions.goToMainMenu,
      onStartNewGame: uiActions.startNewGame,
      onRestartConfirmed: uiActions.restartFromConfirm,
      onResumeFromPause: uiActions.resumeFromPause,
      onPauseOpenEquipment: uiActions.openEquipmentFromPause,
      onResumeFromEquipment: uiActions.resumeFromEquipment,
      onJoystickPointerDown: joystickActions.onJoystickPointerDown,
      onJoystickPointerMove: joystickActions.onJoystickPointerMove,
      onJoystickPointerUp: joystickActions.onJoystickPointerUp,
      onTrapPointerDown: joystickActions.onTrapPointerDown,
      onBombPointerDown: joystickActions.onBombPointerDown,
      onSwordPointerDown: joystickActions.onSwordPointerDown,
    },
  };
}
