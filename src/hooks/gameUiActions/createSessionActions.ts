import { ITEMS_TARGET } from "../../game/config/constants";
import { initGame } from "../../game/model/initGame";
import type { UseGameUiActionsParams } from "./types";
import type { NavigationActions } from "./createNavigationActions";

type SessionActions = {
  openRestartConfirm: () => void;
  closeRestartConfirm: () => void;
  restart: () => void;
  startNewGame: () => void;
  resumeFromPause: () => void;
  openEquipmentFromPause: () => void;
  resumeFromEquipment: () => void;
  restartFromConfirm: () => void;
};

export function createSessionActions(
  params: UseGameUiActionsParams,
  navigation: Pick<NavigationActions, "goToScreen" | "closeEquipment">
): SessionActions {
  const openRestartConfirm = () => {
    params.keysRef.current.clear();
    params.setEquipmentOpen(false);
    params.controlsReturnToGameRef.current = false;
    params.setControlsReturnToGame(false);
    params.resetTouchInput();
    params.confirmRestartRef.current = true;
    params.setConfirmRestartOpen(true);
  };

  const closeRestartConfirm = () => {
    params.keysRef.current.clear();
    params.confirmRestartRef.current = false;
    params.setConfirmRestartOpen(false);
  };

  const restart = () => {
    const next = initGame();
    params.stateRef.current = next;
    params.setStatus("playing");
    params.setItemsLeft(ITEMS_TARGET);
    params.setCoinsCollected(0);
    params.setSpikesLeft(3);
    params.setBombsLeft(1);
    params.setLoseReason("caught");
    params.keysRef.current.clear();
    params.controlsReturnToGameRef.current = false;
    params.setControlsReturnToGame(false);
    params.setEquipmentOpen(false);
    params.resetTouchInput();
    params.setPaused(false);
  };

  const startNewGame = () => {
    restart();
    closeRestartConfirm();
    navigation.goToScreen("game");
  };

  const resumeFromPause = () => {
    params.keysRef.current.clear();
    params.setEquipmentOpen(false);
    params.setPaused(false);
  };

  const openEquipmentFromPause = () => {
    params.setEquipmentOpen(true);
  };

  const resumeFromEquipment = () => {
    navigation.closeEquipment();
    params.setPaused(false);
  };

  const restartFromConfirm = () => {
    restart();
    closeRestartConfirm();
  };

  return {
    openRestartConfirm,
    closeRestartConfirm,
    restart,
    startNewGame,
    resumeFromPause,
    openEquipmentFromPause,
    resumeFromEquipment,
    restartFromConfirm,
  };
}
