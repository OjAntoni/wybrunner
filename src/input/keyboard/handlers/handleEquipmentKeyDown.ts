import type { KeyDownHandlerParams } from "./types";

export function handleEquipmentKeyDown({ e, refs, callbacks, ctx }: KeyDownHandlerParams) {
  if (!refs.equipmentOpenRef.current) return false;

  if (e.key === "Escape" || ctx.lowerKey === "i") {
    callbacks.closeEquipment();
    e.preventDefault();
    return true;
  }

  if (ctx.dirKey || e.key === " " || ctx.lowerKey === "e" || ctx.lowerKey === "b" || ctx.lowerKey === "r") {
    e.preventDefault();
    return true;
  }

  return false;
}
