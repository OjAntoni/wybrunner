import { useCallback, type MutableRefObject } from "react";
import { placeBomb as performPlaceBomb, placeSpike as performPlaceSpike } from "../../game/actions/equipment";
import type { GameState } from "../../game/model/types";

type UseRuntimeEquipmentParams = {
  stateRef: MutableRefObject<GameState>;
  gameNowRef: MutableRefObject<number>;
  setSpikesLeft: (value: number) => void;
  setBombsLeft: (value: number) => void;
  setCoinsCollected: (value: number) => void;
};

export function useRuntimeEquipment({
  stateRef,
  gameNowRef,
  setSpikesLeft,
  setBombsLeft,
  setCoinsCollected,
}: UseRuntimeEquipmentParams) {
  const placeSpike = useCallback(() => {
    performPlaceSpike(
      stateRef.current,
      setSpikesLeft,
      setCoinsCollected,
      gameNowRef.current
    );
  }, [gameNowRef, setCoinsCollected, setSpikesLeft, stateRef]);

  const placeBomb = useCallback(() => {
    performPlaceBomb(
      stateRef.current,
      setBombsLeft,
      setCoinsCollected,
      gameNowRef.current
    );
  }, [gameNowRef, setBombsLeft, setCoinsCollected, stateRef]);

  return { placeSpike, placeBomb };
}
