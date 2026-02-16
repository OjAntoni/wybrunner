import type { KeyDownHandlerParams } from "./types";

export function handleMenuKeyDown({ e, refs, callbacks, ctx }: KeyDownHandlerParams) {
  const onBestiary = refs.screenRef.current === "bestiary";
  const controlsFromGame =
    refs.screenRef.current === "controls" && refs.controlsReturnToGameRef.current;

  if (controlsFromGame && (e.key === "Enter" || e.key === " " || e.key === "Escape")) {
    callbacks.closeControls();
    e.preventDefault();
    return true;
  }

  if (refs.screenRef.current === "menu" && (e.key === "Enter" || e.key === " ")) {
    callbacks.startNewGame();
    e.preventDefault();
    return true;
  }

  if (ctx.lowerKey === "c") {
    callbacks.openControls(false);
    e.preventDefault();
    return true;
  }

  if (ctx.lowerKey === "b" && refs.screenRef.current === "menu") {
    callbacks.openBestiary(false);
    e.preventDefault();
    return true;
  }

  if (e.key === "Escape") {
    if (onBestiary) {
      callbacks.closeBestiary();
      e.preventDefault();
      return true;
    }
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
