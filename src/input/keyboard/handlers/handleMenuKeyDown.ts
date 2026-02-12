import type { KeyDownHandlerParams } from "./types";

export function handleMenuKeyDown({ e, refs, callbacks, ctx }: KeyDownHandlerParams) {
  const controlsFromGame =
    refs.screenRef.current === "controls" && refs.controlsReturnToGameRef.current;

  if (controlsFromGame && (e.key === "Enter" || e.key === " " || e.key === "Escape")) {
    callbacks.closeControls();
    e.preventDefault();
    return true;
  }

  if (e.key === "Enter" || e.key === " ") {
    callbacks.startNewGame();
    e.preventDefault();
    return true;
  }

  if (ctx.lowerKey === "c") {
    callbacks.openControls(false);
    e.preventDefault();
    return true;
  }

  if (e.key === "Escape") {
    callbacks.closeControls();
    e.preventDefault();
    return true;
  }

  if (ctx.dirKey) {
    e.preventDefault();
    return true;
  }

  return false;
}
