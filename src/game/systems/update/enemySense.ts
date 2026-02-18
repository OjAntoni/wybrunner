import {
  ENEMY_SENSE_BUCKETS,
  ENEMY_SENSE_DETECT_RADIUS_TILES,
  ENEMY_SENSE_FADE_SPEED,
} from "../../config/constants";
import type { EnemySenseSegment, GameState, Vec } from "../../model/types";
import { isCellCoveredByExploreClouds } from "../../world/exploration";

const TWO_PI = Math.PI * 2;
const BUCKET_SIZE = TWO_PI / ENEMY_SENSE_BUCKETS;

// Pre-allocated collections reused every frame
const _buckets = new Map<number, BucketAccum>();
const _targets: { key: number; dir: Vec; angle: number }[] = [];
const _usedSegments = new Set<number>();
const _usedTargets = new Set<number>();
const _segmentAngles = new Map<EnemySenseSegment, number>();

type BucketAccum = {
  x: number;
  y: number;
  weight: number;
};

function normalize(vec: Vec) {
  const len = Math.hypot(vec.x, vec.y);
  if (len <= 0.000001) return;
  vec.x /= len;
  vec.y /= len;
}

function bucketIndex(angle: number) {
  const normalized = angle < 0 ? angle + TWO_PI : angle;
  return Math.max(0, Math.min(ENEMY_SENSE_BUCKETS - 1, Math.floor(normalized / BUCKET_SIZE)));
}

function addTargetBucket(buckets: Map<number, BucketAccum>, dir: Vec, weight: number) {
  const angle = Math.atan2(dir.y, dir.x);
  const bucket = bucketIndex(angle);
  const existing = buckets.get(bucket);
  if (!existing) {
    buckets.set(bucket, { x: dir.x * weight, y: dir.y * weight, weight });
    return;
  }
  existing.x += dir.x * weight;
  existing.y += dir.y * weight;
  existing.weight += weight;
}

function registerHiddenTarget(
  buckets: Map<number, BucketAccum>,
  player: Vec,
  target: Vec
) {
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= 0.0001 || dist > ENEMY_SENSE_DETECT_RADIUS_TILES) return;
  const dir = { x: dx / dist, y: dy / dist };
  const weight = 1 / (dist + 0.35);
  addTargetBucket(buckets, dir, weight);
}

function updateSegmentDir(segment: EnemySenseSegment, targetDir: Vec, lerp: number) {
  segment.dir.x += (targetDir.x - segment.dir.x) * lerp;
  segment.dir.y += (targetDir.y - segment.dir.y) * lerp;
  normalize(segment.dir);
}

export function updateEnemySenseIndicator(state: GameState, dt: number) {
  _buckets.clear();
  const buckets = _buckets;
  const player = state.player;

  for (const monster of state.monsters) {
    if (monster.kind !== "chaser") continue;
    const cellX = Math.floor(monster.pos.x);
    const cellY = Math.floor(monster.pos.y);
    if (!isCellCoveredByExploreClouds(state, cellX, cellY)) continue;
    registerHiddenTarget(buckets, player, monster.pos);
  }

  for (const hunter of state.hunters) {
    if (hunter.mode === "chase") continue;
    const cellX = Math.floor(hunter.pos.x);
    const cellY = Math.floor(hunter.pos.y);
    if (!isCellCoveredByExploreClouds(state, cellX, cellY)) continue;
    registerHiddenTarget(buckets, player, hunter.pos);
  }

  for (const turret of state.turrets) {
    const cellX = Math.floor(turret.pos.x);
    const cellY = Math.floor(turret.pos.y);
    if (!isCellCoveredByExploreClouds(state, cellX, cellY)) continue;
    registerHiddenTarget(buckets, player, turret.pos);
  }

  if (buckets.size === 0 && state.enemySenseSegments.length === 0) return;

  _targets.length = 0;
  const targets = _targets;
  buckets.forEach((entry, key) => {
    if (entry.weight <= 0.0001) return;
    const dir = { x: entry.x, y: entry.y };
    normalize(dir);
    const angle = Math.atan2(dir.y, dir.x);
    targets.push({ key, dir, angle });
  });

  const segments = state.enemySenseSegments;
  const lerp = 1 - Math.exp(-dt * ENEMY_SENSE_FADE_SPEED);
  _usedSegments.clear();
  _usedTargets.clear();
  const usedSegments = _usedSegments;
  const usedTargets = _usedTargets;
  const maxSnap = BUCKET_SIZE * 1.6;

  _segmentAngles.clear();
  const segmentAngles = _segmentAngles;
  for (const segment of segments) {
    segmentAngles.set(segment, Math.atan2(segment.dir.y, segment.dir.x));
  }

  function assignTarget(segment: EnemySenseSegment, segmentIndex: number, targetIndex: number) {
    const target = targets[targetIndex];
    segment.key = target.key;
    segment.alpha += (1 - segment.alpha) * lerp;
    updateSegmentDir(segment, target.dir, lerp);
    usedSegments.add(segmentIndex);
    usedTargets.add(targetIndex);
  }

  for (let t = 0; t < targets.length; t += 1) {
    const target = targets[t];
    let matched = false;
    for (let s = 0; s < segments.length; s += 1) {
      const segment = segments[s];
      if (usedSegments.has(s)) continue;
      if (segment.key !== target.key) continue;
      assignTarget(segment, s, t);
      matched = true;
      break;
    }
    if (matched) continue;
  }

  for (let t = 0; t < targets.length; t += 1) {
    if (usedTargets.has(t)) continue;
    const target = targets[t];
    let bestIndex = -1;
    let bestDiff = Infinity;
    for (let s = 0; s < segments.length; s += 1) {
      if (usedSegments.has(s)) continue;
      const segment = segments[s];
      const angle = segmentAngles.get(segment) ?? 0;
      const diff = Math.abs(Math.atan2(Math.sin(angle - target.angle), Math.cos(angle - target.angle)));
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIndex = s;
      }
    }
    if (bestIndex >= 0 && bestDiff <= maxSnap) {
      assignTarget(segments[bestIndex], bestIndex, t);
      continue;
    }
    const segment: EnemySenseSegment = { key: target.key, dir: { ...target.dir }, alpha: 0 };
    segments.push(segment);
    usedSegments.add(segments.length - 1);
    usedTargets.add(t);
    segment.alpha += (1 - segment.alpha) * lerp;
  }

  for (let i = segments.length - 1; i >= 0; i -= 1) {
    if (usedSegments.has(i)) continue;
    const segment = segments[i];
    segment.alpha += (0 - segment.alpha) * lerp;
    if (segment.alpha <= 0.02) {
      segments.splice(i, 1);
    }
  }
}
