import type { KeyDownHandlerParams } from "./types";

export function handlePlayingKeyDown({ e, refs, callbacks, ctx }: KeyDownHandlerParams) {
  let handled = false;

  if (ctx.dirKey) {
    refs.keysRef.current.add(ctx.dirKey);
    e.preventDefault();
    handled = true;
  }

  if (e.key === " " || ctx.lowerKey === "e") {
    callbacks.placeSpike();
    e.preventDefault();
    handled = true;
  }

  if (ctx.lowerKey === "b") {
    callbacks.placeBomb();
    e.preventDefault();
    handled = true;
  }

  if (ctx.lowerKey === "r") {
    callbacks.openRestartConfirm();
    e.preventDefault();
    handled = true;
  }

  if (ctx.lowerKey === "i") {
    callbacks.openEquipment();
    e.preventDefault();
    handled = true;
  }

  if (ctx.lowerKey === "m" && !refs.touchEnabledRef.current) {
    callbacks.openMap();
    e.preventDefault();
    handled = true;
  }

  return handled;
}
