import {
  EXPLORE_CLEAR_RADIUS_TILES,
  EXPLORE_CLOUD_FADE_MS,
  TILE_SIZE,
} from "../config/constants";
import type { ExploreCloud, GameState, Vec } from "../model/types";
import { clamp } from "../utils/math";

export function visitExploreCloudCandidates(
  state: GameState,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
  visit: (cloud: ExploreCloud) => boolean | void
) {
  const index = state.exploreCloudBuckets;
  if (index.cols <= 0 || index.rows <= 0) return false;

  let nextStamp = state.exploreCloudQueryStamp + 1;
  if (nextStamp >= 0x7fffffff) {
    nextStamp = 1;
    for (const cloud of state.exploreClouds) cloud.queryStamp = 0;
  }
  state.exploreCloudQueryStamp = nextStamp;

  const minBX = Math.max(0, Math.min(index.cols - 1, Math.floor(minX / index.bucketSize)));
  const maxBX = Math.max(0, Math.min(index.cols - 1, Math.floor(maxX / index.bucketSize)));
  const minBY = Math.max(0, Math.min(index.rows - 1, Math.floor(minY / index.bucketSize)));
  const maxBY = Math.max(0, Math.min(index.rows - 1, Math.floor(maxY / index.bucketSize)));

  for (let by = minBY; by <= maxBY; by += 1) {
    for (let bx = minBX; bx <= maxBX; bx += 1) {
      const bucket = index.buckets[by * index.cols + bx];
      for (let i = 0; i < bucket.length; i += 1) {
        const cloud = state.exploreClouds[bucket[i]];
        if (cloud.queryStamp === nextStamp) continue;
        cloud.queryStamp = nextStamp;
        if (visit(cloud)) return true;
      }
    }
  }
  return false;
}

export function isCellCoveredByExploreClouds(state: GameState, x: number, y: number) {
  const cx = x * TILE_SIZE + TILE_SIZE * 0.5;
  const cy = y * TILE_SIZE + TILE_SIZE * 0.5;
  return visitExploreCloudCandidates(state, cx, cy, cx, cy, (cloud) => {
    // Discovery should start as soon as clouds begin clearing.
    if (cloud.fadeStart !== null) return false;
    const dx = cx - cloud.x;
    const dy = cy - cloud.y;
    return dx * dx + dy * dy <= cloud.radius * cloud.radius;
  });
}

export function updateDiscoveredArtifacts(state: GameState) {
  if (state.items.size === 0) return;
  state.items.forEach((key) => {
    if (state.discoveredArtifacts.has(key)) return;
    const [x, y] = key.split(",").map(Number);
    if (!isCellCoveredByExploreClouds(state, x, y)) {
      state.discoveredArtifacts.add(key);
    }
  });
}

export function clearExploreClouds(
  state: GameState,
  playerCell: Vec,
  now: number,
  instant: boolean = false
) {
  if (state.exploreClouds.length === 0) return;
  const minX = (playerCell.x - EXPLORE_CLEAR_RADIUS_TILES) * TILE_SIZE;
  const minY = (playerCell.y - EXPLORE_CLEAR_RADIUS_TILES) * TILE_SIZE;
  const maxX = (playerCell.x + EXPLORE_CLEAR_RADIUS_TILES + 1) * TILE_SIZE;
  const maxY = (playerCell.y + EXPLORE_CLEAR_RADIUS_TILES + 1) * TILE_SIZE;

  visitExploreCloudCandidates(state, minX, minY, maxX, maxY, (cloud) => {
    if (cloud.fadeStart !== null) return;
    const closestX = clamp(cloud.x, minX, maxX);
    const closestY = clamp(cloud.y, minY, maxY);
    const dx = cloud.x - closestX;
    const dy = cloud.y - closestY;
    // "Any overlap clears": if the clear rect touches any part of this cloud body, fade it out.
    if (dx * dx + dy * dy > cloud.radius * cloud.radius) return;
    cloud.fadeStart = instant ? now - EXPLORE_CLOUD_FADE_MS : now;
  });
}
