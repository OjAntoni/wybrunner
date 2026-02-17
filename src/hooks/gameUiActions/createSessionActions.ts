import { ITEMS_TARGET, PLAYER_HEARTS_MAX } from "../../game/config/constants";
import { initGame } from "../../game/model/initGame";
import {
  updateCoinsDom,
  updateHeartsDom,
  updateSpikesDom,
  updateBombsDom,
  updateArtifactsDom,
} from "../../game/utils/updateGameUi";
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
    params.mapOpenRef.current = false;
    params.mapReturnToPauseRef.current = false;
    params.setMapOpen(false);
    params.equipmentOpenRef.current = false;
    params.setEquipmentOpen(false);
    params.controlsReturnToGameRef.current = false;
    params.setControlsReturnToGame(false);
    params.bestiaryReturnToGameRef.current = false;
    params.setBestiaryReturnToGame(false);
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
    const next = initGame(params.gameNowRef.current);
    params.stateRef.current = next;
    params.setStatus("playing");
    params.setItemsLeft(ITEMS_TARGET);
    params.setCoinsCollected(0);
    params.setPlayerHearts(PLAYER_HEARTS_MAX);
    // Sync DOM
    updateCoinsDom(0);
    updateHeartsDom(PLAYER_HEARTS_MAX, PLAYER_HEARTS_MAX);
    updateSpikesDom(3);
    updateBombsDom(1);
    updateArtifactsDom(0, ITEMS_TARGET);
    params.setLoseReason("caught");
    params.keysRef.current.clear();
    params.controlsReturnToGameRef.current = false;
    params.setControlsReturnToGame(false);
    params.bestiaryReturnToGameRef.current = false;
    params.setBestiaryReturnToGame(false);
    params.mapOpenRef.current = false;
    params.mapReturnToPauseRef.current = false;
    params.setMapOpen(false);
    params.equipmentOpenRef.current = false;
    params.setEquipmentOpen(false);
    params.resetTouchInput();
    params.pausedRef.current = false;
    params.setPaused(false);
  };

  const startNewGame = () => {
    restart();
    closeRestartConfirm();
    navigation.goToScreen("game");
  };

  const resumeFromPause = () => {
    params.keysRef.current.clear();
    params.mapOpenRef.current = false;
    params.mapReturnToPauseRef.current = false;
    params.setMapOpen(false);
    params.equipmentOpenRef.current = false;
    params.setEquipmentOpen(false);
    params.pausedRef.current = false;
    params.setPaused(false);
  };

  const openEquipmentFromPause = () => {
    params.equipmentOpenRef.current = true;
    params.setEquipmentOpen(true);
  };

  const resumeFromEquipment = () => {
    navigation.closeEquipment();
    params.pausedRef.current = false;
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
