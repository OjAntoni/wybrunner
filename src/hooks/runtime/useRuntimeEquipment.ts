import { useCallback, type MutableRefObject } from "react";
import { placeBomb as performPlaceBomb, placeSpike as performPlaceSpike } from "../../game/actions/equipment";
import type { GameState } from "../../game/model/types";

type UseRuntimeEquipmentParams = {
  stateRef: MutableRefObject<GameState>;
  setSpikesLeft: (value: number) => void;
  setBombsLeft: (value: number) => void;
};

export function useRuntimeEquipment({
  stateRef,
  setSpikesLeft,
  setBombsLeft,
}: UseRuntimeEquipmentParams) {
  const placeSpike = useCallback(() => {
    performPlaceSpike(stateRef.current, setSpikesLeft);
  }, [setSpikesLeft, stateRef]);

  const placeBomb = useCallback(() => {
    performPlaceBomb(stateRef.current, setBombsLeft);
  }, [setBombsLeft, stateRef]);

  return { placeSpike, placeBomb };
}
