import { useCallback, type MutableRefObject } from "react";
import { placeBomb as performPlaceBomb, placeSpike as performPlaceSpike } from "../../game/actions/equipment";
import type { GameState } from "../../game/model/types";

type UseRuntimeEquipmentParams = {
  stateRef: MutableRefObject<GameState>;
  setSpikesLeft: (value: number) => void;
  setBombsLeft: (value: number) => void;
  setCoinsCollected: (value: number) => void;
};

export function useRuntimeEquipment({
  stateRef,
  setSpikesLeft,
  setBombsLeft,
  setCoinsCollected,
}: UseRuntimeEquipmentParams) {
  const placeSpike = useCallback(() => {
    performPlaceSpike(stateRef.current, setSpikesLeft, setCoinsCollected);
  }, [setCoinsCollected, setSpikesLeft, stateRef]);

  const placeBomb = useCallback(() => {
    performPlaceBomb(stateRef.current, setBombsLeft, setCoinsCollected);
  }, [setBombsLeft, setCoinsCollected, stateRef]);

  return { placeSpike, placeBomb };
}
