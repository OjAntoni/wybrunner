import { TILE_SIZE } from "../config/constants";
import type { FogArea, FogBounds, FogCloud, Vec } from "../model/types";
import { inBounds, packCell } from "../utils/grid";
import { clampInt } from "../utils/math";
import { mulberry32 } from "../utils/random";

type FogAnchor = { x: number; y: number; r: number };

export function buildFogAreaClip(anchors: FogAnchor[], areaId: number) {
  const path = new Path2D();
  const bounds: FogBounds = {
    minX: Number.POSITIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  };

  const bumpBounds = (cx: number, cy: number, rad: number) => {
    bounds.minX = Math.min(bounds.minX, cx - rad);
    bounds.minY = Math.min(bounds.minY, cy - rad);
    bounds.maxX = Math.max(bounds.maxX, cx + rad);
    bounds.maxY = Math.max(bounds.maxY, cy + rad);
  };

  for (let i = 0; i < anchors.length; i += 1) {
    const a = anchors[i];
    const seed = ((areaId * 1009) ^ i) >>> 0;
    const rng = mulberry32(seed);
    const x = a.x * TILE_SIZE;
    const y = a.y * TILE_SIZE;
    const r = a.r * TILE_SIZE;

    const cx = x + (rng() * 2 - 1) * r * 0.1;
    const cy = y + (rng() * 2 - 1) * r * 0.1;
    const rx0 = r * (0.72 + rng() * 0.32);
    const ry0 = r * (0.42 + rng() * 0.46);
    const rot0 = (rng() * 2 - 1) * 0.75;
    path.moveTo(cx + rx0, cy);
    path.ellipse(cx, cy, rx0, ry0, rot0, 0, Math.PI * 2);
    bumpBounds(cx, cy, Math.max(rx0, ry0));

    const lobes = 2 + Math.floor(rng() * 2);
    for (let j = 0; j < lobes; j += 1) {
      const ang = rng() * Math.PI * 2;
      const off = (0.18 + 0.6 * rng()) * r;
      const lx = x + Math.cos(ang) * off + (rng() * 2 - 1) * r * 0.08;
      const ly = y + Math.sin(ang) * off + (rng() * 2 - 1) * r * 0.08;
      const rx = r * (0.24 + 0.44 * rng());
      const ry = rx * (0.55 + 0.7 * rng());
      const rot = (rng() * 2 - 1) * 0.9;
      path.moveTo(lx + rx, ly);
      path.ellipse(lx, ly, rx, ry, rot, 0, Math.PI * 2);
      bumpBounds(lx, ly, Math.max(rx, ry));
    }
  }

  const pad = TILE_SIZE * 8;
  bounds.minX -= pad;
  bounds.minY -= pad;
  bounds.maxX += pad;
  bounds.maxY += pad;
  return { path, bounds };
}

export function buildFogAreaClouds(areaId: number, anchors: FogAnchor[], cellCount: number) {
  const rng = mulberry32(((areaId * 2654435761) ^ 0x3c6ef372) >>> 0);
  const count = clampInt(Math.floor(16 + cellCount / 40 + anchors.length * 0.55), 18, 34);
  const clouds: FogCloud[] = [];
  for (let i = 0; i < count; i += 1) {
    const anchor = anchors[Math.floor(rng() * anchors.length)];
    const ang = rng() * Math.PI * 2;
    const rad = (0.12 + rng() * 0.88) * anchor.r * TILE_SIZE;
    const x = anchor.x * TILE_SIZE + Math.cos(ang) * rad;
    const y = anchor.y * TILE_SIZE + Math.sin(ang) * rad;
    const size = 58 + rng() * 92;
    const alpha = 0.55 + rng() * 0.35;
    const shadePick = rng();
    const shade: 0 | 1 | 2 = shadePick < 0.65 ? 0 : shadePick < 0.9 ? 1 : 2;
    clouds.push({
      x,
      y,
      size,
      alpha,
      shade,
      amp: (0.1 + rng() * 0.4) * TILE_SIZE,
      fx: 0.22 + rng() * 0.25,
      fy: 0.18 + rng() * 0.25,
      phaseX: rng() * Math.PI * 2,
      phaseY: rng() * Math.PI * 2,
    });
  }
  return clouds;
}

export function isPlayerInsideFogArea(area: FogArea, playerCell: Vec) {
  // Treat "inside" as any of the 3x3 neighborhood to reduce boundary flicker.
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      const x = playerCell.x + dx;
      const y = playerCell.y + dy;
      if (!inBounds(x, y)) continue;
      if (area.cellSet.has(packCell(x, y))) return true;
    }
  }
  return false;
}
