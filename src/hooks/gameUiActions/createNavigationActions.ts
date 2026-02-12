import type { UIScreen } from "../../game/model/types";
import type { UseGameUiActionsParams } from "./types";

export type NavigationActions = {
  goToScreen: (next: UIScreen) => void;
  pauseGame: () => void;
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
    params.setPaused(true);
  };

  const openEquipment = () => {
    if (params.screenRef.current !== "game") return;
    if (params.stateRef.current.status !== "playing") return;
    pauseGame();
    params.setEquipmentOpen(true);
  };

  const closeEquipment = () => {
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
    openEquipment,
    closeEquipment,
    openControls,
    closeControls,
    goToMainMenu,
  };
}
