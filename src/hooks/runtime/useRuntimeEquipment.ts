import { useCallback, type MutableRefObject } from "react";
import { placeBomb as performPlaceBomb, placeSpike as performPlaceSpike } from "../../game/actions/equipment";
import type { GameState } from "../../game/model/types";

type UseRuntimeEquipmentParams = {
  stateRef: MutableRefObject<GameState>;
  gameNowRef: MutableRefObject<number>;
};

export function useRuntimeEquipment({
  stateRef,
  gameNowRef,
}: UseRuntimeEquipmentParams) {
  const placeSpike = useCallback(() => {
    performPlaceSpike(
      stateRef.current,
      gameNowRef.current
    );
  }, [gameNowRef, stateRef]);

  const placeBomb = useCallback(() => {
    performPlaceBomb(
      stateRef.current,
      gameNowRef.current
    );
  }, [gameNowRef, stateRef]);

  return { placeSpike, placeBomb };
}
