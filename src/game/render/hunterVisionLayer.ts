import {
  HUNTER_VISION_ANGLE_DEG,
  HUNTER_VISION_RADIUS_TILES,
  HUNTER_VISION_RAY_COUNT,
  TILE_SIZE,
} from "../config/constants";
import type { GameState } from "../model/types";
import { directionFromAngle, getHunterFacingAngle } from "../world/hunterFacing";
import { sampleVisionConeBoundary } from "../world/hunterVision";
import { isCellCoveredByExploreClouds } from "../world/exploration";

export function drawHunterVisions(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number
) {
  for (const hunter of state.hunters) {
    const hunterCell = {
      x: Math.floor(hunter.pos.x),
      y: Math.floor(hunter.pos.y),
    };
    if (hunter.mode !== "chase" && isCellCoveredByExploreClouds(state, hunterCell.x, hunterCell.y)) {
      continue;
    }

    const facingDirection = directionFromAngle(getHunterFacingAngle(hunter, now));
    const points = sampleVisionConeBoundary(
      state.grid,
      hunter.pos,
      facingDirection,
      HUNTER_VISION_RADIUS_TILES,
      HUNTER_VISION_ANGLE_DEG,
      HUNTER_VISION_RAY_COUNT
    );
    if (points.length === 0) continue;

    const hunterX = hunter.pos.x * TILE_SIZE - camX;
    const hunterY = hunter.pos.y * TILE_SIZE - camY;
    const isChasing = hunter.mode === "chase";

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(hunterX, hunterY);
    for (const point of points) {
      ctx.lineTo(point.x * TILE_SIZE - camX, point.y * TILE_SIZE - camY);
    }
    ctx.closePath();
    ctx.fillStyle = isChasing ? "rgba(255, 98, 98, 0.26)" : "rgba(255, 255, 255, 0.18)";
    ctx.fill();
    ctx.strokeStyle = isChasing ? "rgba(255, 122, 122, 0.38)" : "rgba(255, 255, 255, 0.32)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
}
