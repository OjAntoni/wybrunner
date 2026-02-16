import type { KeyDownHandlerParams } from "./types";

export function handlePausedKeyDown({ e, refs, callbacks, ctx }: KeyDownHandlerParams) {
  if (!refs.pausedRef.current) return false;

  if (ctx.lowerKey === "r") {
    callbacks.openRestartConfirm();
    e.preventDefault();
    return true;
  }

  if (ctx.lowerKey === "i") {
    callbacks.setEquipmentOpen(true);
    e.preventDefault();
    return true;
  }

  if (ctx.lowerKey === "m" && !refs.touchEnabledRef.current) {
    callbacks.openMap();
    e.preventDefault();
    return true;
  }

  if (ctx.lowerKey === "b") {
    callbacks.openBestiary(true);
    e.preventDefault();
    return true;
  }

  if (ctx.dirKey) {
    e.preventDefault();
    return true;
  }

  return false;
}
