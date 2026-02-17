import type { UIScreen } from "../../game/model/types";
import type { UseGameUiActionsParams } from "./types";
import { deferStateUpdate } from "../../game/utils/deferredState";

export type NavigationActions = {
  goToScreen: (next: UIScreen) => void;
  pauseGame: () => void;
  openMap: () => void;
  closeMap: () => void;
  openEquipment: () => void;
  closeEquipment: () => void;
  openControls: (fromGame: boolean) => void;
  closeControls: () => void;
  openBestiary: (fromGame: boolean) => void;
  closeBestiary: () => void;
  goToMainMenu: () => void;
};

export function createNavigationActions(params: UseGameUiActionsParams): NavigationActions {
  const goToScreen = (next: UIScreen) => {
    params.screenRef.current = next;
    // Defer React state update to prevent blocking input handling
    deferStateUpdate(() => params.setScreen(next));
  };

  const pauseGame = () => {
    params.keysRef.current.clear();
    params.resetTouchInput();
    params.pausedRef.current = true;
    // Defer React state update to prevent blocking input handling
    deferStateUpdate(() => params.setPaused(true));
  };

  const closeMap = () => {
    if (!params.mapOpenRef.current) return;
    params.keysRef.current.clear();
    params.resetTouchInput();
    const returnToPause = params.mapReturnToPauseRef.current;
    params.mapOpenRef.current = false;
    params.mapReturnToPauseRef.current = false;
    params.pausedRef.current = returnToPause;
    // Batch deferred updates
    deferStateUpdate(() => {
      params.setMapOpen(false);
      params.setPaused(returnToPause);
    });
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
    params.pausedRef.current = true;
    // Batch deferred updates
    deferStateUpdate(() => {
      params.setMapOpen(true);
      params.setPaused(true);
    });
  };

  const openEquipment = () => {
    if (params.screenRef.current !== "game") return;
    if (params.stateRef.current.status !== "playing") return;
    if (params.mapOpenRef.current) return;
    pauseGame();
    params.equipmentOpenRef.current = true;
    // Defer React state update
    deferStateUpdate(() => params.setEquipmentOpen(true));
  };

  const closeEquipment = () => {
    params.equipmentOpenRef.current = false;
    // Defer React state update
    deferStateUpdate(() => params.setEquipmentOpen(false));
  };

  const openControls = (fromGame: boolean) => {
    params.controlsReturnToGameRef.current = fromGame;
    // Defer React state update
    deferStateUpdate(() => params.setControlsReturnToGame(fromGame));
    goToScreen("controls");
  };

  const closeControls = () => {
    const returnToGame = params.controlsReturnToGameRef.current;
    params.controlsReturnToGameRef.current = false;
    // Defer React state update
    deferStateUpdate(() => params.setControlsReturnToGame(false));
    goToScreen(returnToGame ? "game" : "menu");
  };

  const openBestiary = (fromGame: boolean) => {
    params.bestiaryReturnToGameRef.current = fromGame;
    // Defer React state update
    deferStateUpdate(() => params.setBestiaryReturnToGame(fromGame));
    goToScreen("bestiary");
  };

  const closeBestiary = () => {
    const returnToGame = params.bestiaryReturnToGameRef.current;
    params.bestiaryReturnToGameRef.current = false;
    // Defer React state update
    deferStateUpdate(() => params.setBestiaryReturnToGame(false));
    goToScreen(returnToGame ? "game" : "menu");
  };

  const goToMainMenu = () => {
    params.keysRef.current.clear();
    params.mapOpenRef.current = false;
    params.mapReturnToPauseRef.current = false;
    params.equipmentOpenRef.current = false;
    params.controlsReturnToGameRef.current = false;
    params.bestiaryReturnToGameRef.current = false;
    params.resetTouchInput();
    params.confirmRestartRef.current = false;
    params.pausedRef.current = false;
    
    // Batch all deferred updates to minimize React re-renders
    deferStateUpdate(() => {
      params.setMapOpen(false);
      params.setEquipmentOpen(false);
      params.setControlsReturnToGame(false);
      params.setBestiaryReturnToGame(false);
      params.setConfirmRestartOpen(false);
      params.setPaused(false);
    });
    
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
    openBestiary,
    closeBestiary,
    goToMainMenu,
  };
}
