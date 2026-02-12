import type { UIScreen } from "../../game/model/types";
import type { UseGameUiActionsParams } from "./types";

export type NavigationActions = {
  goToScreen: (next: UIScreen) => void;
  pauseGame: () => void;
  openMap: () => void;
  closeMap: () => void;
  openEquipment: () => void;
  closeEquipment: () => void;
  openControls: (fromGame: boolean) => void;
  closeControls: () => void;
  goToMainMenu: () => void;
};

export function createNavigationActions(params: UseGameUiActionsParams): NavigationActions {
  const goToScreen = (next: UIScreen) => {
    params.screenRef.current = next;
    params.setScreen(next);
  };

  const pauseGame = () => {
    params.keysRef.current.clear();
    params.resetTouchInput();
    params.pausedRef.current = true;
    params.setPaused(true);
  };

  const closeMap = () => {
    if (!params.mapOpenRef.current) return;
    params.keysRef.current.clear();
    params.resetTouchInput();
    const returnToPause = params.mapReturnToPauseRef.current;
    params.mapOpenRef.current = false;
    params.mapReturnToPauseRef.current = false;
    params.setMapOpen(false);
    params.pausedRef.current = returnToPause;
    params.setPaused(returnToPause);
  };

  const openMap = () => {
    if (params.screenRef.current !== "game") return;
    if (params.stateRef.current.status !== "playing") return;
    if (params.confirmRestartRef.current) return;
    if (params.equipmentOpenRef.current) return;
    if (params.mapOpenRef.current) return;

    params.keysRef.current.clear();
    params.resetTouchInput();
    const wasPaused = params.pausedRef.current;
    params.mapReturnToPauseRef.current = wasPaused;
    params.mapOpenRef.current = true;
    params.setMapOpen(true);
    params.pausedRef.current = true;
    params.setPaused(true);
  };

  const openEquipment = () => {
    if (params.screenRef.current !== "game") return;
    if (params.stateRef.current.status !== "playing") return;
    if (params.mapOpenRef.current) return;
    pauseGame();
    params.equipmentOpenRef.current = true;
    params.setEquipmentOpen(true);
  };

  const closeEquipment = () => {
    params.equipmentOpenRef.current = false;
    params.setEquipmentOpen(false);
  };

  const openControls = (fromGame: boolean) => {
    params.controlsReturnToGameRef.current = fromGame;
    params.setControlsReturnToGame(fromGame);
    goToScreen("controls");
  };

  const closeControls = () => {
    const returnToGame = params.controlsReturnToGameRef.current;
    params.controlsReturnToGameRef.current = false;
    params.setControlsReturnToGame(false);
    goToScreen(returnToGame ? "game" : "menu");
  };

  const goToMainMenu = () => {
    params.keysRef.current.clear();
    params.mapOpenRef.current = false;
    params.mapReturnToPauseRef.current = false;
    params.setMapOpen(false);
    params.equipmentOpenRef.current = false;
    params.setEquipmentOpen(false);
    params.controlsReturnToGameRef.current = false;
    params.setControlsReturnToGame(false);
    params.resetTouchInput();
    params.confirmRestartRef.current = false;
    params.setConfirmRestartOpen(false);
    params.pausedRef.current = false;
    params.setPaused(false);
    goToScreen("menu");
  };

  return {
    goToScreen,
    pauseGame,
    openMap,
    closeMap,
    openEquipment,
    closeEquipment,
    openControls,
    closeControls,
    goToMainMenu,
  };
}
