import { useMemo, useState } from "react";
import { ITEMS_TARGET } from "../../game/config/constants";
import type {
  GameStatus,
  LoseReason,
  UIScreen,
} from "../../game/model/types";

export type ControllerStateModel = {
  screen: UIScreen;
  mapOpen: boolean;
  status: GameStatus;
  itemsLeft: number;
  coinsCollected: number;
  spikesLeft: number;
  bombsLeft: number;
  loseReason: LoseReason;
  confirmRestartOpen: boolean;
  paused: boolean;
  equipmentOpen: boolean;
  touchEnabled: boolean;
  compactHud: boolean;
  controlsReturnToGame: boolean;
  helpText: string;
  setScreen: (value: UIScreen) => void;
  setMapOpen: (value: boolean) => void;
  setStatus: (value: GameStatus) => void;
  setItemsLeft: (value: number) => void;
  setCoinsCollected: (value: number) => void;
  setSpikesLeft: (value: number) => void;
  setBombsLeft: (value: number) => void;
  setLoseReason: (value: LoseReason) => void;
  setConfirmRestartOpen: (value: boolean) => void;
  setPaused: (value: boolean) => void;
  setEquipmentOpen: (value: boolean) => void;
  setTouchEnabled: (value: boolean) => void;
  setCompactHud: (value: boolean) => void;
  setControlsReturnToGame: (value: boolean) => void;
};

export function useControllerState(): ControllerStateModel {
  const [screen, setScreen] = useState<UIScreen>("menu");
  const [mapOpen, setMapOpen] = useState(false);
  const [status, setStatus] = useState<GameStatus>("playing");
  const [itemsLeft, setItemsLeft] = useState(ITEMS_TARGET);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [spikesLeft, setSpikesLeft] = useState(3);
  const [bombsLeft, setBombsLeft] = useState(1);
  const [loseReason, setLoseReason] = useState<LoseReason>("caught");
  const [confirmRestartOpen, setConfirmRestartOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);
  const [touchEnabled, setTouchEnabled] = useState(false);
  const [compactHud, setCompactHud] = useState(false);
  const [controlsReturnToGame, setControlsReturnToGame] = useState(false);

  const helpText = useMemo(
    () =>
      touchEnabled
        ? "Use the joystick to move. Tap Trap and Bomb buttons to place gear."
        : "Move with WASD or arrow keys. Press M for map. Collect 10 artifacts.",
    [touchEnabled]
  );

  return {
    screen,
    mapOpen,
    status,
    itemsLeft,
    coinsCollected,
    spikesLeft,
    bombsLeft,
    loseReason,
    confirmRestartOpen,
    paused,
    equipmentOpen,
    touchEnabled,
    compactHud,
    controlsReturnToGame,
    helpText,
    setScreen,
    setMapOpen,
    setStatus,
    setItemsLeft,
    setCoinsCollected,
    setSpikesLeft,
    setBombsLeft,
    setLoseReason,
    setConfirmRestartOpen,
    setPaused,
    setEquipmentOpen,
    setTouchEnabled,
    setCompactHud,
    setControlsReturnToGame,
  };
}
