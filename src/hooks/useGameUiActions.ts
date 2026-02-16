import { useMemo } from "react";
import { createNavigationActions } from "./gameUiActions/createNavigationActions";
import { createSessionActions } from "./gameUiActions/createSessionActions";
import type { UseGameUiActionsParams } from "./gameUiActions/types";

export function useGameUiActions(params: UseGameUiActionsParams) {
  const {
    stateRef,
    gameNowRef,
    keysRef,
    screenRef,
    touchEnabledRef,
    mapOpenRef,
    confirmRestartRef,
    pausedRef,
    equipmentOpenRef,
    controlsReturnToGameRef,
    bestiaryReturnToGameRef,
    mapReturnToPauseRef,
    resetTouchInput,
    setScreen,
    setStatus,
    setItemsLeft,
    setCoinsCollected,
    setSpikesLeft,
    setBombsLeft,
    setLoseReason,
    setConfirmRestartOpen,
    setPaused,
    setEquipmentOpen,
    setControlsReturnToGame,
    setBestiaryReturnToGame,
    setMapOpen,
  } = params;

  const stableParams = useMemo<UseGameUiActionsParams>(
    () => ({
      stateRef,
      gameNowRef,
      keysRef,
      screenRef,
      touchEnabledRef,
      mapOpenRef,
      confirmRestartRef,
      pausedRef,
      equipmentOpenRef,
      controlsReturnToGameRef,
      bestiaryReturnToGameRef,
      mapReturnToPauseRef,
      resetTouchInput,
      setScreen,
      setStatus,
      setItemsLeft,
      setCoinsCollected,
      setSpikesLeft,
      setBombsLeft,
      setLoseReason,
      setConfirmRestartOpen,
      setPaused,
      setEquipmentOpen,
      setControlsReturnToGame,
      setBestiaryReturnToGame,
      setMapOpen,
    }),
    [
      bestiaryReturnToGameRef,
      confirmRestartRef,
      controlsReturnToGameRef,
      equipmentOpenRef,
      gameNowRef,
      keysRef,
      mapOpenRef,
      mapReturnToPauseRef,
      pausedRef,
      resetTouchInput,
      screenRef,
      setBestiaryReturnToGame,
      setBombsLeft,
      setCoinsCollected,
      setConfirmRestartOpen,
      setControlsReturnToGame,
      setEquipmentOpen,
      setItemsLeft,
      setLoseReason,
      setMapOpen,
      setPaused,
      setScreen,
      setSpikesLeft,
      setStatus,
      stateRef,
      touchEnabledRef,
    ]
  );

  const navigation = useMemo(() => createNavigationActions(stableParams), [stableParams]);
  const session = useMemo(
    () => createSessionActions(stableParams, navigation),
    [navigation, stableParams]
  );

  return useMemo(
    () => ({
      pauseGame: navigation.pauseGame,
      openMap: navigation.openMap,
      closeMap: navigation.closeMap,
      openEquipment: navigation.openEquipment,
      closeEquipment: navigation.closeEquipment,
      openControls: navigation.openControls,
      closeControls: navigation.closeControls,
      openBestiary: navigation.openBestiary,
      closeBestiary: navigation.closeBestiary,
      goToMainMenu: navigation.goToMainMenu,
      openRestartConfirm: session.openRestartConfirm,
      closeRestartConfirm: session.closeRestartConfirm,
      restart: session.restart,
      startNewGame: session.startNewGame,
      resumeFromPause: session.resumeFromPause,
      openEquipmentFromPause: session.openEquipmentFromPause,
      resumeFromEquipment: session.resumeFromEquipment,
      restartFromConfirm: session.restartFromConfirm,
    }),
    [navigation, session]
  );
}
