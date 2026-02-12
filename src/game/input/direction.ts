import type { Vec } from "../model/types";
import { keyToDir } from "../../input/keymap";

export function getInputDirection(keys: Set<string>, touchMove: Vec): Vec {
  let dx = 0;
  let dy = 0;

  keys.forEach((key) => {
    const dir = keyToDir[key];
    if (!dir) return;
    dx += dir.x;
    dy += dir.y;
  });

  dx += touchMove.x;
  dy += touchMove.y;

  const len = Math.hypot(dx, dy);
  if (len > 1) {
    return { x: dx / len, y: dy / len };
  }
  if (len < 0.0001) {
    return { x: 0, y: 0 };
  }
  return { x: dx, y: dy };
}
