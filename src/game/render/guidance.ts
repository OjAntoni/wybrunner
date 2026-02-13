import { TILE_SIZE } from "../config/constants";
import type { GameState } from "../model/types";
import { isCellCoveredByExploreClouds } from "../world/exploration";
import { getGhostVisibilityAlpha } from "../world/ghostVisibility";
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

  let markerX = 0;
  let markerY = 0;
  let markerFound = false;
  let hasOnScreenMonster = false;
  let bestDistSq = Number.POSITIVE_INFINITY;

  for (const monster of state.monsters) {
    if (monster.kind === "ghost" && getGhostVisibilityAlpha(monster, now) <= 0.001) {
      continue;
    }
    const monsterCell = {
      x: Math.floor(monster.pos.x),
      y: Math.floor(monster.pos.y),
    };
    if (monster.kind !== "ghost" && isCellCoveredByExploreClouds(state, monsterCell.x, monsterCell.y)) {
      continue;
    }

    const monsterScreenX = monster.pos.x * TILE_SIZE - camX;
    const monsterScreenY = monster.pos.y * TILE_SIZE - camY;
    const monsterOnScreen =
      monsterScreenX >= 0 &&
      monsterScreenX <= viewW &&
      monsterScreenY >= 0 &&
      monsterScreenY <= viewH;
    if (monsterOnScreen) {
      hasOnScreenMonster = true;
      continue;
    }
    const dx = monsterScreenX - playerScreenX;
    const dy = monsterScreenY - playerScreenY;
    const distSq = dx * dx + dy * dy;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      markerX = monsterScreenX;
      markerY = monsterScreenY;
      markerFound = true;
    }
  }

  if (hasOnScreenMonster || !markerFound) return;
  drawArtifactIndicator(
    ctx,
    playerScreenX,
    playerScreenY,
    markerX,
    markerY,
    viewW,
    viewH,
    now,
    "rgba(255, 78, 78, 1)",
    "rgba(255, 215, 215, 0.12)"
  );
}
