import {
  HUNTER_VISION_ANGLE_DEG,
  HUNTER_VISION_RADIUS_TILES,
  HUNTER_VISION_RAY_COUNT,
  TILE_SIZE,
  TURRET_LOCK_IN_TRANSITION_MS,
  TURRET_UNLOCK_TRANSITION_MS,
  TURRET_VISION_ANGLE_DEG,
  TURRET_VISION_RADIUS_TILES,
} from "../config/constants";
import type { GameState } from "../model/types";
import { getHunterFacingAngle } from "../world/hunterFacing";
import { castVisionRayDistance, sampleVisionConeBoundary } from "../world/hunterVision";
import { isCellCoveredByExploreClouds } from "../world/exploration";

type VisionCacheEntry = {
  key: string;
  points: { x: number; y: number }[];
};

const turretVisionCache = new Map<number, VisionCacheEntry>();

function quantize(value: number, step: number) {
  return Math.round(value / step);
}

function terrainRevision(state: GameState) {
  const count = state.explosions.length;
  if (count === 0) return 0;
  return state.explosions[count - 1].start;
}

function getCachedVisionBoundary(
  cache: Map<number, VisionCacheEntry>,
  id: number,
  key: string,
  build: () => { x: number; y: number }[]
) {
  const existing = cache.get(id);
  if (existing && existing.key === key) {
    return existing.points;
  }
  const points = build();
  cache.set(id, { key, points });
  return points;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function getTurretLineFactor(state: GameState["turrets"][number], now: number) {
  if (state.mode === "track" || state.mode === "cooldown") {
    if (state.lockTransitionDir !== 1) return 1;
    const t = clamp01((now - state.lockTransitionStartMs) / TURRET_LOCK_IN_TRANSITION_MS);
    return t;
  }

  if (state.lockTransitionDir !== -1) return 0;
  const t = clamp01((now - state.lockTransitionStartMs) / TURRET_UNLOCK_TRANSITION_MS);
  return 1 - t;
}

export function drawHunterVisions(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number
) {
  const revision = terrainRevision(state);
  const activeTurretIds = new Set<number>();
  
  // Calculate viewport bounds with padding for vision radius
  const visionPadding = HUNTER_VISION_RADIUS_TILES * TILE_SIZE;
  const minX = camX - visionPadding;
  const minY = camY - visionPadding;
  const maxX = camX + viewW + visionPadding;
  const maxY = camY + viewH + visionPadding;

  for (const hunter of state.hunters) {
    const hunterCell = {
      x: Math.floor(hunter.pos.x),
      y: Math.floor(hunter.pos.y),
    };
    if (hunter.mode !== "chase" && isCellCoveredByExploreClouds(state, hunterCell.x, hunterCell.y)) {
      continue;
    }
    
    // Skip hunters outside viewport (with padding for vision radius)
    const hunterX = hunter.pos.x * TILE_SIZE - camX;
    const hunterY = hunter.pos.y * TILE_SIZE - camY;
    const hunterPixelX = hunter.pos.x * TILE_SIZE;
    const hunterPixelY = hunter.pos.y * TILE_SIZE;
    if (hunterPixelX < minX || hunterPixelX > maxX || hunterPixelY < minY || hunterPixelY > maxY) {
      continue;
    }

    const facingAngle = getHunterFacingAngle(hunter, now);
    const isChasing = hunter.mode === "chase";
    const visionAngle = hunter.visionAngleDeg || HUNTER_VISION_ANGLE_DEG;
    const points = sampleVisionConeBoundary(
      state.grid,
      hunter.pos,
      { x: Math.cos(facingAngle), y: Math.sin(facingAngle) },
      HUNTER_VISION_RADIUS_TILES,
      visionAngle,
      HUNTER_VISION_RAY_COUNT
    );
    if (points.length === 0) continue;
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
  
  // Calculate turret viewport bounds with padding
  const turretPadding = TURRET_VISION_RADIUS_TILES * TILE_SIZE;
  const turretMinX = camX - turretPadding;
  const turretMinY = camY - turretPadding;
  const turretMaxX = camX + viewW + turretPadding;
  const turretMaxY = camY + viewH + turretPadding;

  for (const turret of state.turrets) {
    activeTurretIds.add(turret.id);
    
    // Skip turrets outside viewport
    const turretPixelX = turret.pos.x * TILE_SIZE;
    const turretPixelY = turret.pos.y * TILE_SIZE;
    if (turretPixelX < turretMinX || turretPixelX > turretMaxX || turretPixelY < turretMinY || turretPixelY > turretMaxY) {
      continue;
    }
    
    const turretCell = {
      x: Math.floor(turret.pos.x),
      y: Math.floor(turret.pos.y),
    };
    if (isCellCoveredByExploreClouds(state, turretCell.x, turretCell.y)) continue;

    const lineFactor = getTurretLineFactor(turret, now);
    const effectiveAngleDeg = Math.max(1, TURRET_VISION_ANGLE_DEG * (1 - lineFactor));
    const turretX = turret.pos.x * TILE_SIZE - camX;
    const turretY = turret.pos.y * TILE_SIZE - camY;

    if (effectiveAngleDeg <= 2) {
      const rayDistance = castVisionRayDistance(
        state.grid,
        turret.pos,
        turret.facingAngle,
        TURRET_VISION_RADIUS_TILES
      );
      ctx.save();
      ctx.strokeStyle = "rgba(255, 88, 88, 0.85)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(turretX, turretY);
      ctx.lineTo(
        (turret.pos.x + Math.cos(turret.facingAngle) * rayDistance) * TILE_SIZE - camX,
        (turret.pos.y + Math.sin(turret.facingAngle) * rayDistance) * TILE_SIZE - camY
      );
      ctx.stroke();
      ctx.restore();
      continue;
    }

    const key = [
      quantize(turret.pos.x, 0.25),
      quantize(turret.pos.y, 0.25),
      quantize(turret.facingAngle, Math.PI / 180),
      quantize(effectiveAngleDeg, 0.5),
      revision,
    ].join(":");
    const points = getCachedVisionBoundary(
      turretVisionCache,
      turret.id,
      key,
      () =>
        sampleVisionConeBoundary(
          state.grid,
          turret.pos,
          { x: Math.cos(turret.facingAngle), y: Math.sin(turret.facingAngle) },
          TURRET_VISION_RADIUS_TILES,
          effectiveAngleDeg,
          HUNTER_VISION_RAY_COUNT
        )
    );
    if (points.length === 0) continue;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(turretX, turretY);
    for (const point of points) {
      ctx.lineTo(point.x * TILE_SIZE - camX, point.y * TILE_SIZE - camY);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(255, 92, 92, 0.22)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 122, 122, 0.46)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  turretVisionCache.forEach((_, id) => {
    if (!activeTurretIds.has(id)) turretVisionCache.delete(id);
  });
}
