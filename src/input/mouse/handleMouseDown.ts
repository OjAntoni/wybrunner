import type { MouseCallbacks, MouseControlRefs } from "./types";

export function handleMouseDown(
  e: PointerEvent,
  refs: MouseControlRefs,
  callbacks: MouseCallbacks
) {
  if (e.button !== 0) return false;
  if (e.pointerType !== "mouse") return false;
  if (refs.screenRef.current !== "game") return false;
  if (refs.pausedRef.current) return false;
  if (refs.confirmRestartRef.current) return false;
  if (refs.mapOpenRef.current) return false;
  if (refs.equipmentOpenRef.current) return false;
  if (refs.stateRef.current.status !== "playing") return false;

  callbacks.swingSword();
  e.preventDefault();
  return true;
}
