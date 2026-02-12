import type { Vec } from "../model/types";
import { clamp } from "../utils/math";
import { TILE_SIZE } from "../config/constants";

export function getCamera(
  player: Vec,
  viewW: number,
  viewH: number,
  worldW: number,
  worldH: number
) {
  let x = player.x * TILE_SIZE - viewW / 2;
  let y = player.y * TILE_SIZE - viewH / 2;
  if (worldW <= viewW) x = (worldW - viewW) / 2;
  else x = clamp(x, 0, worldW - viewW);
  if (worldH <= viewH) y = (worldH - viewH) / 2;
  else y = clamp(y, 0, worldH - viewH);
  return { x, y };
}
