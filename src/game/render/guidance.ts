import { TILE_SIZE } from "../config/constants";
import type { GameState } from "../model/types";
import { drawArtifactIndicator } from "./primitives";

export function drawGuidanceArrows(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number,
  playerScreenX: number,
  playerScreenY: number
) {
  state.items.forEach((key) => {
    if (!state.discoveredArtifacts.has(key)) return;
    const [x, y] = key.split(",").map(Number);
    const sx = x * TILE_SIZE + TILE_SIZE / 2 - camX;
    const sy = y * TILE_SIZE + TILE_SIZE / 2 - camY;
    const onScreen = sx >= 0 && sx <= viewW && sy >= 0 && sy <= viewH;
    if (onScreen) return;
    drawArtifactIndicator(
      ctx,
      playerScreenX,
      playerScreenY,
      sx,
      sy,
      viewW,
      viewH,
      now
    );
  });

  const monsterScreenX = state.monster.x * TILE_SIZE - camX;
  const monsterScreenY = state.monster.y * TILE_SIZE - camY;
  const monsterOnScreen =
    monsterScreenX >= 0 &&
    monsterScreenX <= viewW &&
    monsterScreenY >= 0 &&
    monsterScreenY <= viewH;
  if (monsterOnScreen) return;
  drawArtifactIndicator(
    ctx,
    playerScreenX,
    playerScreenY,
    monsterScreenX,
    monsterScreenY,
    viewW,
    viewH,
    now,
    "rgba(255, 78, 78, 1)",
    "rgba(255, 215, 215, 0.12)"
  );
}
