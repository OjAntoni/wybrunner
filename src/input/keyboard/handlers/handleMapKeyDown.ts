import type { KeyDownHandlerParams } from "./types";

export function handleMapKeyDown({ e, refs, callbacks, ctx }: KeyDownHandlerParams) {
  if (!refs.mapOpenRef.current) return false;

  if (e.key === "Escape" || ctx.lowerKey === "m") {
    callbacks.closeMap();
    e.preventDefault();
    return true;
  }

  if (
    ctx.dirKey ||
    e.key === " " ||
    ctx.lowerKey === "e" ||
    ctx.lowerKey === "b" ||
    ctx.lowerKey === "r" ||
    ctx.lowerKey === "i" ||
    ctx.lowerKey === "c"
  ) {
    e.preventDefault();
    return true;
  }

  return false;
}
