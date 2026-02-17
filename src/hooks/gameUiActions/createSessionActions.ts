import { ITEMS_TARGET, PLAYER_HEARTS_MAX } from "../../game/config/constants";
import { initGame } from "../../game/model/initGame";
import {
  updateCoinsDom,
  updateHeartsDom,
  updateSpikesDom,
  updateBombsDom,
  updateArtifactsDom,
} from "../../game/utils/updateGameUi";
import { deferStateUpdate } from "../../game/utils/deferredState";
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
    params.equipmentOpenRef.current = false;
    params.controlsReturnToGameRef.current = false;
    params.bestiaryReturnToGameRef.current = false;
    params.resetTouchInput();
    params.confirmRestartRef.current = true;
    
    // Batch deferred updates
    deferStateUpdate(() => {
      params.setMapOpen(false);
      params.setEquipmentOpen(false);
      params.setControlsReturnToGame(false);
      params.setBestiaryReturnToGame(false);
      params.setConfirmRestartOpen(true);
    });
  };

  const closeRestartConfirm = () => {
    params.keysRef.current.clear();
    params.confirmRestartRef.current = false;
    deferStateUpdate(() => params.setConfirmRestartOpen(false));
  };

  const restart = () => {
    const next = initGame(params.gameNowRef.current);
    params.stateRef.current = next;
    params.keysRef.current.clear();
    params.controlsReturnToGameRef.current = false;
    params.bestiaryReturnToGameRef.current = false;
    params.mapOpenRef.current = false;
    params.mapReturnToPauseRef.current = false;
    params.equipmentOpenRef.current = false;
    params.pausedRef.current = false;
    
    // Sync DOM immediately
    updateCoinsDom(0);
    updateHeartsDom(PLAYER_HEARTS_MAX, PLAYER_HEARTS_MAX);
    updateSpikesDom(3);
    updateBombsDom(1);
    updateArtifactsDom(0, ITEMS_TARGET);
    
    // Batch deferred React state updates
    deferStateUpdate(() => {
      params.setStatus("playing");
      params.setItemsLeft(ITEMS_TARGET);
      params.setCoinsCollected(0);
      params.setPlayerHearts(PLAYER_HEARTS_MAX);
      params.setLoseReason("caught");
      params.setControlsReturnToGame(false);
      params.setBestiaryReturnToGame(false);
      params.setMapOpen(false);
      params.setEquipmentOpen(false);
      params.setConfirmRestartOpen(false);
      params.setPaused(false);
    });
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
    params.equipmentOpenRef.current = false;
    params.pausedRef.current = false;
    
    deferStateUpdate(() => {
      params.setMapOpen(false);
      params.setEquipmentOpen(false);
      params.setPaused(false);
    });
  };

  const openEquipmentFromPause = () => {
    params.equipmentOpenRef.current = true;
    deferStateUpdate(() => params.setEquipmentOpen(true));
  };

  const resumeFromEquipment = () => {
    navigation.closeEquipment();
    params.pausedRef.current = false;
    deferStateUpdate(() => params.setPaused(false));
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
