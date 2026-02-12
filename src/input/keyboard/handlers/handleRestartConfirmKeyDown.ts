import type { KeyDownHandlerParams } from "./types";

export function handleRestartConfirmKeyDown({ e, refs, callbacks, ctx }: KeyDownHandlerParams) {
  if (!refs.confirmRestartRef.current) return false;

  if (e.key === "Enter" || e.key === " ") {
    callbacks.restart();
    callbacks.closeRestartConfirm();
    e.preventDefault();
    return true;
  }

  if (e.key === "Escape") {
    callbacks.closeRestartConfirm();
    e.preventDefault();
    return true;
  }

  if (ctx.dirKey || ctx.lowerKey === "m") {
    e.preventDefault();
    return true;
  }

  return false;
}
