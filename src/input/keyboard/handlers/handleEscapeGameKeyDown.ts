import type { KeyDownHandlerParams } from "./types";

export function handleEscapeGameKeyDown({ e, refs, callbacks }: KeyDownHandlerParams) {
  if (e.key !== "Escape") return false;

  if (refs.stateRef.current.status === "playing") {
    if (refs.pausedRef.current) {
      callbacks.setPaused(false);
    } else {
      callbacks.pauseGame();
    }
  }
  e.preventDefault();
  return true;
}
