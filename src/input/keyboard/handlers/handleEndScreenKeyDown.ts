import type { KeyDownHandlerParams } from "./types";

export function handleEndScreenKeyDown({ e, refs, callbacks, ctx }: KeyDownHandlerParams) {
  // End screen: lead back to main menu (no restart suggestion here).
  if (refs.confirmRestartRef.current || refs.stateRef.current.status === "playing") {
    return false;
  }

  if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
    callbacks.goToMainMenu();
    e.preventDefault();
    return true;
  }

  if (ctx.dirKey || ctx.lowerKey === "r") {
    e.preventDefault();
    return true;
  }

  return false;
}
