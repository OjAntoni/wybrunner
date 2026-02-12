import type { GameViewProps } from "../ui/gameView/types";
import {
  useControllerBehavior,
  useControllerRefs,
  useControllerState,
} from "./controller";

export function useGameAppController(): GameViewProps {
  const refs = useControllerRefs();
  const state = useControllerState();
  return useControllerBehavior({ refs, state });
}
