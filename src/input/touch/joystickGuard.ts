import type { MutableRefObject } from "react";
import type { GameState, UIScreen } from "../../game/model/types";

export type JoystickGuardRefs = {
  screenRef: MutableRefObject<UIScreen>;
  pausedRef: MutableRefObject<boolean>;
  confirmRestartRef: MutableRefObject<boolean>;
  equipmentOpenRef: MutableRefObject<boolean>;
  stateRef: MutableRefObject<GameState>;
};

export function canStartJoystickGesture(
  touchEnabled: boolean,
  pointerType: string,
  refs: JoystickGuardRefs
) {
  if (!touchEnabled || pointerType === "mouse") return false;
  if (refs.screenRef.current !== "game") return false;
  if (
    refs.pausedRef.current ||
    refs.confirmRestartRef.current ||
    refs.equipmentOpenRef.current ||
    refs.stateRef.current.status !== "playing"
  ) {
    return false;
  }
  return true;
}
