import {
  EXPLORE_CLOUD_BODY_RADIUS,
  GRID_H,
  GRID_W,
  TILE_SIZE,
} from "../config/constants";
import type { ExploreCloud } from "../model/types";
import { packCell } from "../utils/grid";
import { mulberry32 } from "../utils/random";

function pickShade(rng: () => number): 0 | 1 | 2 {
  const shadePick = rng();
  return shadePick < 0.32 ? 0 : shadePick < 0.74 ? 1 : 2;
}

function markCovered(cloud: ExploreCloud, covered: Uint8Array) {
  const radius = cloud.radius;
  const rSq = radius * radius;
  const minTileX = Math.max(
    0,
    Math.min(GRID_W - 1, Math.floor((cloud.x - radius) / TILE_SIZE))
  );
  const maxTileX = Math.max(
    0,
    Math.min(GRID_W - 1, Math.floor((cloud.x + radius) / TILE_SIZE))
  );
  const minTileY = Math.max(
    0,
    Math.min(GRID_H - 1, Math.floor((cloud.y - radius) / TILE_SIZE))
  );
  const maxTileY = Math.max(
    0,
    Math.min(GRID_H - 1, Math.floor((cloud.y + radius) / TILE_SIZE))
  );

  for (let ty = minTileY; ty <= maxTileY; ty += 1) {
    const cy = ty * TILE_SIZE + TILE_SIZE * 0.5;
    for (let tx = minTileX; tx <= maxTileX; tx += 1) {
      const cx = tx * TILE_SIZE + TILE_SIZE * 0.5;
      const dx = cx - cloud.x;
      const dy = cy - cloud.y;
      if (dx * dx + dy * dy <= rSq) covered[packCell(tx, ty)] = 1;
    }
  }
}

export function buildExploreClouds(seed: number): ExploreCloud[] {
  const rng = mulberry32(seed >>> 0);
  const worldW = GRID_W * TILE_SIZE;
  const worldH = GRID_H * TILE_SIZE;
  const spacingX = TILE_SIZE * 2.35;
  const spacingY = TILE_SIZE * 2.05;
  const margin = TILE_SIZE * 3;
  const clouds: ExploreCloud[] = [];
  const covered = new Uint8Array(GRID_W * GRID_H);

  const addCloud = (
    x: number,
    y: number,
    size: number,
    alpha: number,
    shade: 0 | 1 | 2
  ) => {
    const half = size * 0.5;
    const radius = size * EXPLORE_CLOUD_BODY_RADIUS;
    const cloud: ExploreCloud = {
      x,
      y,
      size,
      half,
      radius,
      alpha,
      shade,
      fadeStart: null,
      queryStamp: 0,
    };
    clouds.push(cloud);
    markCovered(cloud, covered);
  };

  let row = 0;
  for (let y = -margin; y <= worldH + margin; y += spacingY) {
    const rowOffset = row % 2 === 0 ? 0 : spacingX * 0.5;
    row += 1;
    for (let x = -margin; x <= worldW + margin; x += spacingX) {
      // Keep layout fairly dense but still porous.
      if (rng() < 0.01) continue;
      const size = TILE_SIZE * (2.8 + rng() * 4.2);
      const jitterX = (rng() * 2 - 1) * spacingX * 0.35;
      const jitterY = (rng() * 2 - 1) * spacingY * 0.35;
      addCloud(x + rowOffset + jitterX, y + jitterY, size, 0.74 + rng() * 0.22, pickShade(rng));
    }
  }

  // Guarantee full initial coverage: back-fill any uncovered tile centers.
  for (let ty = 0; ty < GRID_H; ty += 1) {
    for (let tx = 0; tx < GRID_W; tx += 1) {
      if (covered[packCell(tx, ty)] === 1) continue;
      const cx = tx * TILE_SIZE + TILE_SIZE * 0.5 + (rng() * 2 - 1) * TILE_SIZE * 0.28;
      const cy = ty * TILE_SIZE + TILE_SIZE * 0.5 + (rng() * 2 - 1) * TILE_SIZE * 0.28;
      const size = TILE_SIZE * (2.9 + rng() * 2.3);
      addCloud(cx, cy, size, 0.78 + rng() * 0.18, pickShade(rng));
    }
  }

  return clouds;
}
