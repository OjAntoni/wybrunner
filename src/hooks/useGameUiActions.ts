import { createNavigationActions } from "./gameUiActions/createNavigationActions";
import { createSessionActions } from "./gameUiActions/createSessionActions";
import type { UseGameUiActionsParams } from "./gameUiActions/types";

export function useGameUiActions(params: UseGameUiActionsParams) {
  const navigation = createNavigationActions(params);
  const session = createSessionActions(params, navigation);

  return {
    pauseGame: navigation.pauseGame,
    openMap: navigation.openMap,
    closeMap: navigation.closeMap,
    openEquipment: navigation.openEquipment,
    closeEquipment: navigation.closeEquipment,
    openControls: navigation.openControls,
    closeControls: navigation.closeControls,
    goToMainMenu: navigation.goToMainMenu,
    openRestartConfirm: session.openRestartConfirm,
    closeRestartConfirm: session.closeRestartConfirm,
    restart: session.restart,
    startNewGame: session.startNewGame,
    resumeFromPause: session.resumeFromPause,
    openEquipmentFromPause: session.openEquipmentFromPause,
    resumeFromEquipment: session.resumeFromEquipment,
    restartFromConfirm: session.restartFromConfirm,
  };
}
