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
  const runtime = useControllerRuntime({ refs, state });
  const interactions = useControllerInteractions({ refs, state, runtime });

  useControllerLifecycle({
    refs,
    state,
    resetTouchInput: interactions.resetTouchInput,
    runtime,
  });

  const {
    screen,
    status,
    loseReason,
    touchEnabled,
    compactHud,
    paused,
    confirmRestartOpen,
    equipmentOpen,
    controlsReturnToGame,
    itemsLeft,
    coinsCollected,
    spikesLeft,
    bombsLeft,
    helpText,
  } = state;
  const { canvasRef, hudTopRef, inventoryRef, joystickRef, joystickKnobRef } = refs;
  const { uiActions, joystickActions } = interactions;

  return {
    view: {
      screen,
      status,
      loseReason,
      touchEnabled,
      compactHud,
      paused,
      confirmRestartOpen,
      equipmentOpen,
      controlsReturnToGame,
      itemsLeft,
      coinsCollected,
      spikesLeft,
      bombsLeft,
      helpText,
    },
    refs: {
      canvasRef,
      hudTopRef,
      inventoryRef,
      joystickRef,
      joystickKnobRef,
    },
    actions: {
      onPauseGame: uiActions.pauseGame,
      onOpenEquipment: uiActions.openEquipment,
      onCloseEquipment: uiActions.closeEquipment,
      onOpenControls: uiActions.openControls,
      onCloseControls: uiActions.closeControls,
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
    },
  };
}
