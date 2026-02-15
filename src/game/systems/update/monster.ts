import {
  CHASER_BOOST_MS,
  CHASER_BOOST_MULT,
  CHASER_SPEED_MULT,
  GHOST_COUNT_MAX,
  GHOST_COUNT_MIN,
  GHOST_NIGHT_VISION_RADIUS_TILES,
  GHOST_PATH_MIN_LENGTH_TILES,
  GHOST_SPAWN_MIN_DIST,
  GHOST_SPEED_MULT,
  GRID_H,
  GRID_W,
  PLAYER_SPEED,
  TOUCH_CHASER_SPEED_MULT,
} from "../../config/constants";
import type { GameState, Hunter, LoseReason, Monster, Vec } from "../../model/types";
import { cellKey, countOpenNeighbors, inBounds } from "../../utils/grid";
import { distance } from "../../utils/math";
import { CHASER_HEALTH } from "../../config/constants";
import { isGhostDisappearAnimationFinished } from "../../world/ghostVisibility";
import { bfsNextStep, bestNeighborStep, bestNeighborStepAvoid } from "../../world/pathing";
import { getDayNightSnapshot } from "../dayNight";
import { isAtCellCenter, isOpposite } from "../movement";
import { applyPlayerEnemyHit, isPlayerInvisibleToEnemies } from "./playerDamage";

type ChaserMonster = Extract<Monster, { kind: "chaser" }>;
type GhostMonster = Extract<Monster, { kind: "ghost" }>;

const GHOST_PATH_SAMPLE_POINTS = 120;
const GHOST_PATH_CENTER_MARGIN_TILES = 8;
const GHOST_BUILD_ATTEMPTS = 220;
const GHOST_PATH_BUILD_ATTEMPTS = 40;
const GHOST_MIN_SEPARATION_TILES = 2;
const GHOST_SECTOR_CENTER_JITTER_RATIO = 0.62;
const GHOST_SECTOR_CENTER_ATTEMPTS = 48;
const GHOST_PLAYER_ANCHOR_SIGMA_RATIO = 0.12;
const GHOST_PLAYER_ANCHOR_SIGMA_MIN = 5;
const GHOST_PLAYER_ANCHOR_SMOOTH_PASSES = 2;
const GHOST_PLAYER_ANCHOR_SMOOTH_STRENGTH = 0.34;
const GHOST_TO_HUNTER_SPEED_MULT = 2;
const GHOST_MEET_HUNTER_DISTANCE = 0.42;

let nextGhostId = 1;

function randomRange(min: number, max: number) {
  if (max <= min) return min;
  return min + Math.random() * (max - min);
}

function randomIntInRange(min: number, max: number) {
  if (max <= min) return min;
  return min + Math.floor(Math.random() * (max - min + 1));
}

function distanceSq(a: Vec, b: Vec) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function wrappedIndexDistance(a: number, b: number, length: number) {
  const delta = Math.abs(a - b);
  return Math.min(delta, Math.max(0, length - delta));
}

type GhostCenterBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

type GhostSector = GhostCenterBounds & {
  center: Vec;
};

function getGhostCenterBounds(): GhostCenterBounds {
  const margin = GHOST_PATH_CENTER_MARGIN_TILES;
  return {
    minX: 0.5 + margin,
    maxX: GRID_W - 0.5 - margin,
    minY: 0.5 + margin,
    maxY: GRID_H - 0.5 - margin,
  };
}

function pickGhostSectorGrid(count: number, aspectRatio: number) {
  let bestCols = 1;
  let bestRows = Math.max(1, count);
  let bestScore = Number.POSITIVE_INFINITY;

  for (let cols = 1; cols <= Math.max(1, count); cols += 1) {
    const rows = Math.ceil(count / cols);
    const ratio = cols / Math.max(1, rows);
    const extraCells = cols * rows - count;
    const score = Math.abs(ratio - aspectRatio) + extraCells;
    if (score < bestScore) {
      bestScore = score;
      bestCols = cols;
      bestRows = rows;
    }
  }

  return {
    cols: bestCols,
    rows: bestRows,
  };
}

function buildGhostSectors(count: number) {
  const safeCount = Math.max(1, count);
  const bounds = getGhostCenterBounds();
  if (bounds.maxX <= bounds.minX || bounds.maxY <= bounds.minY) return [];

  const usableW = bounds.maxX - bounds.minX;
  const usableH = bounds.maxY - bounds.minY;
  const { cols, rows } = pickGhostSectorGrid(safeCount, usableW / Math.max(0.001, usableH));
  const sectorW = usableW / cols;
  const sectorH = usableH / rows;

  const allSectors: GhostSector[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const minX = bounds.minX + col * sectorW;
      const maxX = bounds.minX + (col + 1) * sectorW;
      const minY = bounds.minY + row * sectorH;
      const maxY = bounds.minY + (row + 1) * sectorH;
      allSectors.push({
        minX,
        maxX,
        minY,
        maxY,
        center: {
          x: (minX + maxX) * 0.5,
          y: (minY + maxY) * 0.5,
        },
      });
    }
  }

  if (allSectors.length <= safeCount) return allSectors;

  const selected: GhostSector[] = [];
  const used = new Set<number>();
  const step = allSectors.length / safeCount;
  for (let i = 0; i < safeCount; i += 1) {
    let index = Math.min(allSectors.length - 1, Math.floor((i + 0.5) * step));
    if (used.has(index)) {
      let right = index + 1;
      while (right < allSectors.length && used.has(right)) right += 1;
      if (right < allSectors.length) {
        index = right;
      } else {
        let left = index - 1;
        while (left >= 0 && used.has(left)) left -= 1;
        if (left >= 0) index = left;
      }
    }
    used.add(index);
    selected.push(allSectors[index]);
  }
  return selected;
}

function popNearestSectorToPlayer(sectors: GhostSector[], player: Vec) {
  if (sectors.length === 0) return null;
  let bestIndex = 0;
  let bestDistSq = Number.POSITIVE_INFINITY;
  for (let i = 0; i < sectors.length; i += 1) {
    const distSq = distanceSq(sectors[i].center, player);
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      bestIndex = i;
    }
  }
  const [picked] = sectors.splice(bestIndex, 1);
  return picked ?? null;
}

function computeClosedPathLength(path: Vec[]) {
  if (path.length < 2) return 0;
  let length = 0;
  for (let i = 0; i < path.length; i += 1) {
    const current = path[i];
    const next = path[(i + 1) % path.length];
    length += Math.hypot(next.x - current.x, next.y - current.y);
  }
  return length;
}

function isPathInsideWorld(path: Vec[]) {
  const minX = 0.5;
  const maxX = GRID_W - 0.5;
  const minY = 0.5;
  const maxY = GRID_H - 0.5;
  for (const point of path) {
    if (point.x < minX || point.x > maxX || point.y < minY || point.y > maxY) {
      return false;
    }
  }
  return true;
}

function isGhostCenterValid(state: GameState, center: Vec, existingGhosts: GhostMonster[]) {
  if (distance(center, state.player) < GHOST_SPAWN_MIN_DIST) return false;
  if (existingGhosts.some((ghost) => distance(center, ghost.pos) < GHOST_MIN_SEPARATION_TILES)) {
    return false;
  }
  return true;
}

function pickGhostPathCenterInSector(
  state: GameState,
  existingGhosts: GhostMonster[],
  sector: GhostSector
) {
  const halfW = (sector.maxX - sector.minX) * 0.5;
  const halfH = (sector.maxY - sector.minY) * 0.5;
  const jitterX = halfW * GHOST_SECTOR_CENTER_JITTER_RATIO;
  const jitterY = halfH * GHOST_SECTOR_CENTER_JITTER_RATIO;

  for (let i = 0; i < GHOST_SECTOR_CENTER_ATTEMPTS; i += 1) {
    const candidate = {
      x: randomRange(sector.center.x - jitterX, sector.center.x + jitterX),
      y: randomRange(sector.center.y - jitterY, sector.center.y + jitterY),
    };
    if (candidate.x < sector.minX || candidate.x > sector.maxX) continue;
    if (candidate.y < sector.minY || candidate.y > sector.maxY) continue;
    if (!isGhostCenterValid(state, candidate, existingGhosts)) continue;
    return candidate;
  }

  return null;
}

function pickGhostPathCenterGlobal(state: GameState, existingGhosts: GhostMonster[]) {
  const bounds = getGhostCenterBounds();
  if (bounds.minX >= bounds.maxX || bounds.minY >= bounds.maxY) return null;

  for (let i = 0; i < 120; i += 1) {
    const candidate = {
      x: randomRange(bounds.minX, bounds.maxX),
      y: randomRange(bounds.minY, bounds.maxY),
    };
    if (!isGhostCenterValid(state, candidate, existingGhosts)) continue;
    return candidate;
  }
  return null;
}

function buildGhostPath(center: Vec) {
  const minX = 0.5;
  const maxX = GRID_W - 0.5;
  const minY = 0.5;
  const maxY = GRID_H - 0.5;
  const availableX = Math.min(center.x - minX, maxX - center.x);
  const availableY = Math.min(center.y - minY, maxY - center.y);
  const minBaseAmplitude = 5.2;
  const maxBaseX = Math.min(11.5, availableX * 0.82);
  const maxBaseY = Math.min(11.5, availableY * 0.82);
  if (maxBaseX < minBaseAmplitude || maxBaseY < minBaseAmplitude) return null;

  for (let attempt = 0; attempt < GHOST_PATH_BUILD_ATTEMPTS; attempt += 1) {
    const baseX = randomRange(minBaseAmplitude, maxBaseX);
    const baseY = randomRange(minBaseAmplitude, maxBaseY);
    const waveX = baseX * randomRange(0.32, 0.58);
    const waveY = baseY * randomRange(0.32, 0.58);
    const phaseX = randomRange(0, Math.PI * 2);
    const phaseY = randomRange(0, Math.PI * 2);
    const phaseWaveX = randomRange(0, Math.PI * 2);
    const phaseWaveY = randomRange(0, Math.PI * 2);

    const path: Vec[] = [];
    let outOfBounds = false;

    for (let i = 0; i < GHOST_PATH_SAMPLE_POINTS; i += 1) {
      const t = (i / GHOST_PATH_SAMPLE_POINTS) * Math.PI * 2;
      const x = center.x + baseX * Math.cos(t + phaseX) + waveX * Math.cos(t * 2 + phaseWaveX);
      const y = center.y + baseY * Math.sin(t + phaseY) + waveY * Math.sin(t * 2 + phaseWaveY);
      if (x < minX || x > maxX || y < minY || y > maxY) {
        outOfBounds = true;
        break;
      }
      path.push({ x, y });
    }

    if (outOfBounds || path.length < 2) continue;
    if (computeClosedPathLength(path) < GHOST_PATH_MIN_LENGTH_TILES) continue;
    return path;
  }

  return null;
}

function anchorPathToPlayer(path: Vec[], player: Vec) {
  if (path.length === 0) return path;
  let nearestIndex = 0;
  let nearestDistSq = Number.POSITIVE_INFINITY;
  for (let i = 0; i < path.length; i += 1) {
    const dSq = distanceSq(path[i], player);
    if (dSq < nearestDistSq) {
      nearestDistSq = dSq;
      nearestIndex = i;
    }
  }
  const nearest = path[nearestIndex];
  const offsetX = player.x - nearest.x;
  const offsetY = player.y - nearest.y;
  const sigma = Math.max(GHOST_PLAYER_ANCHOR_SIGMA_MIN, path.length * GHOST_PLAYER_ANCHOR_SIGMA_RATIO);
  const sigmaSq = sigma * sigma;
  const weightAt = (index: number) => {
    const d = wrappedIndexDistance(index, nearestIndex, path.length);
    return Math.exp(-(d * d) / Math.max(0.0001, 2 * sigmaSq));
  };

  let anchored = path.map((point, index) => {
    const w = weightAt(index);
    return {
      x: point.x + offsetX * w,
      y: point.y + offsetY * w,
    };
  });
  anchored[nearestIndex] = { x: player.x, y: player.y };

  for (let pass = 0; pass < GHOST_PLAYER_ANCHOR_SMOOTH_PASSES; pass += 1) {
    const smoothed: Vec[] = [];
    for (let i = 0; i < anchored.length; i += 1) {
      if (i === nearestIndex) {
        smoothed.push({ x: player.x, y: player.y });
        continue;
      }
      const prev = anchored[(i - 1 + anchored.length) % anchored.length];
      const current = anchored[i];
      const next = anchored[(i + 1) % anchored.length];
      const localAvg = {
        x: (prev.x + next.x) * 0.5,
        y: (prev.y + next.y) * 0.5,
      };
      const factor = GHOST_PLAYER_ANCHOR_SMOOTH_STRENGTH * weightAt(i);
      smoothed.push({
        x: current.x + (localAvg.x - current.x) * factor,
        y: current.y + (localAvg.y - current.y) * factor,
      });
    }
    anchored = smoothed;
    anchored[nearestIndex] = { x: player.x, y: player.y };
  }

  if (!isPathInsideWorld(anchored)) return null;
  return anchored;
}

function pickEligibleGhostSpawnIndices(path: Vec[], state: GameState, existingGhosts: GhostMonster[]) {
  const eligible: number[] = [];
  for (let i = 0; i < path.length; i += 1) {
    const candidate = path[i];
    if (distance(candidate, state.player) < GHOST_SPAWN_MIN_DIST) continue;
    if (existingGhosts.some((ghost) => distance(candidate, ghost.pos) < GHOST_MIN_SEPARATION_TILES)) {
      continue;
    }
    eligible.push(i);
  }
  return eligible;
}

function allocateGhostId() {
  const id = nextGhostId;
  nextGhostId += 1;
  return id;
}

function findNearestPathIndex(path: Vec[], position: Vec) {
  if (path.length === 0) return 0;
  let bestIndex = 0;
  let bestDistSq = Number.POSITIVE_INFINITY;
  for (let i = 0; i < path.length; i += 1) {
    const distSq = distanceSq(path[i], position);
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      bestIndex = i;
    }
  }
  return bestIndex;
}

export function returnGhostToPath(ghost: GhostMonster) {
  ghost.behavior = "return_to_path";
  ghost.assignedHunterId = null;
  ghost.rememberedPlayerPos = null;
  ghost.returnPathIndex = null;
  if (ghost.path.length === 0) return;
  const nearestIndex = findNearestPathIndex(ghost.path, ghost.pos);
  ghost.returnPathIndex = nearestIndex;
  ghost.pathIndex = nearestIndex;
  ghost.pathProgress = 0;
  const targetPoint = ghost.path[nearestIndex];
  setDirectionFromDelta(ghost, targetPoint.x - ghost.pos.x, targetPoint.y - ghost.pos.y);
}

function findHunterById(state: GameState, hunterId: number | null) {
  if (hunterId === null) return null;
  for (const hunter of state.hunters) {
    if (hunter.id === hunterId) return hunter;
  }
  return null;
}

function isHunterDefaultStateForGhostRecruit(hunter: Hunter, now: number) {
  if (hunter.mode !== "patrol") return false;
  if (now < hunter.stunUntil) return false;
  if (hunter.chaserPlaceEndMs > now || hunter.turretPlaceEndMs > now) return false;
  if (hunter.ghostCommandGhostId !== null || hunter.ghostCommandTarget !== null) return false;
  return true;
}

function isHunterReservedByGhost(state: GameState, hunterId: number, exceptGhostId: number) {
  for (const monster of state.monsters) {
    if (monster.kind !== "ghost") continue;
    if (monster.id === exceptGhostId) continue;
    if (monster.behavior === "path") continue;
    if (monster.assignedHunterId === hunterId) return true;
  }
  return false;
}

function findClosestDefaultHunterForGhost(state: GameState, ghost: GhostMonster, now: number) {
  let bestHunter: Hunter | null = null;
  let bestDist = Number.POSITIVE_INFINITY;

  for (const hunter of state.hunters) {
    if (!isHunterDefaultStateForGhostRecruit(hunter, now)) continue;
    if (isHunterReservedByGhost(state, hunter.id, ghost.id)) continue;
    const dist = distance(hunter.pos, ghost.pos);
    if (dist < bestDist) {
      bestDist = dist;
      bestHunter = hunter;
    }
  }

  return bestHunter;
}

function clearHunterTransientStatesForGhostCommand(hunter: Hunter) {
  hunter.nervousScanActive = false;
  hunter.nervousScanIndex = 0;
  hunter.nervousScanStep = 1;
  hunter.nervousScanNextStepMs = 0;
  hunter.backCheckState = "none";
  hunter.backCheckForwardDir = null;
  hunter.backCheckHoldUntilMs = 0;
  hunter.chaserPlaceStartMs = 0;
  hunter.chaserPlaceEndMs = 0;
  hunter.turretPlaceStartMs = 0;
  hunter.turretPlaceEndMs = 0;
}

function activateGhostHunterCommand(ghost: GhostMonster, hunter: Hunter, rememberedPos: Vec) {
  hunter.mode = "chase";
  hunter.lastSeenPlayer = { ...rememberedPos };
  hunter.ghostCommandTarget = { ...rememberedPos };
  hunter.ghostCommandGhostId = ghost.id;
  clearHunterTransientStatesForGhostCommand(hunter);
  if (!isAtCellCenter(hunter.pos) && !hunter.target) {
    hunter.target = {
      x: Math.floor(hunter.pos.x) + 0.5,
      y: Math.floor(hunter.pos.y) + 0.5,
    };
  }

  ghost.behavior = "with_hunter";
  ghost.assignedHunterId = hunter.id;
  ghost.rememberedPlayerPos = { ...rememberedPos };
  ghost.pos = { ...hunter.pos };
  ghost.dir = { ...hunter.dir };
  ghost.target = null;
}

function isGhostSeeingPlayer(ghost: GhostMonster, state: GameState, now: number) {
  if (isPlayerInvisibleToEnemies(state, now)) return false;
  return distance(ghost.pos, state.player) <= GHOST_NIGHT_VISION_RADIUS_TILES;
}

function updateGhostMemoryIfSeeing(ghost: GhostMonster, state: GameState, now: number) {
  if (!isGhostSeeingPlayer(ghost, state, now)) return false;
  ghost.rememberedPlayerPos = { ...state.player };
  return true;
}

function moveGhostTowardsTarget(ghost: GhostMonster, target: Vec, moveDistance: number) {
  if (moveDistance <= 0) return false;
  const dx = target.x - ghost.pos.x;
  const dy = target.y - ghost.pos.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= 0.000001) return true;

  setDirectionFromDelta(ghost, dx, dy);
  if (dist <= moveDistance) {
    ghost.pos = { ...target };
    return true;
  }

  ghost.pos = {
    x: ghost.pos.x + (dx / dist) * moveDistance,
    y: ghost.pos.y + (dy / dist) * moveDistance,
  };
  return false;
}

function createNightGhost(
  state: GameState,
  existingGhosts: GhostMonster[],
  now: number,
  sector: GhostSector | null,
  mustPassThroughPlayer: boolean
) {
  for (let attempt = 0; attempt < GHOST_BUILD_ATTEMPTS; attempt += 1) {
    const center = sector
      ? pickGhostPathCenterInSector(state, existingGhosts, sector)
      : pickGhostPathCenterGlobal(state, existingGhosts);
    if (!center) return null;

    const basePath = buildGhostPath(center);
    if (!basePath || basePath.length === 0) continue;

    const path = mustPassThroughPlayer ? anchorPathToPlayer(basePath, state.player) : basePath;
    if (!path || path.length === 0) continue;
    if (computeClosedPathLength(path) < GHOST_PATH_MIN_LENGTH_TILES) continue;

    const eligibleSpawnIndices = pickEligibleGhostSpawnIndices(path, state, existingGhosts);
    if (eligibleSpawnIndices.length === 0) continue;
    const spawnIndex = eligibleSpawnIndices[Math.floor(Math.random() * eligibleSpawnIndices.length)];
    const rotatedPath = [...path.slice(spawnIndex), ...path.slice(0, spawnIndex)];
    return createGhostAt(rotatedPath, now);
  }

  return null;
}

function spawnNightGhostPack(state: GameState, now: number) {
  const count = randomIntInRange(GHOST_COUNT_MIN, GHOST_COUNT_MAX);
  const ghosts: GhostMonster[] = [];
  const sectors = buildGhostSectors(count);

  // Guarantee at least one path goes through current player position.
  let anchoredGhost = createNightGhost(
    state,
    ghosts,
    now,
    popNearestSectorToPlayer(sectors, state.player),
    true
  );
  if (!anchoredGhost) {
    for (let i = 0; i < GHOST_BUILD_ATTEMPTS && !anchoredGhost; i += 1) {
      anchoredGhost = createNightGhost(state, ghosts, now, null, true);
    }
  }
  if (anchoredGhost) ghosts.push(anchoredGhost);

  for (const sector of sectors) {
    if (ghosts.length >= count) break;
    const ghost = createNightGhost(state, ghosts, now, sector, false);
    if (ghost) ghosts.push(ghost);
  }

  // Fill remaining slots with global fallback if any sector was invalid.
  for (let attempts = 0; ghosts.length < count && attempts < count * 12; attempts += 1) {
    const ghost = createNightGhost(state, ghosts, now, null, false);
    if (!ghost) continue;
    ghosts.push(ghost);
  }

  // Final fallback for anchored-path guarantee.
  if (ghosts.length > 0 && !anchoredGhost) {
    const replacement = createNightGhost(state, ghosts.slice(1), now, null, true);
    if (replacement) ghosts[0] = replacement;
  }

  return ghosts;
}

function syncNightGhost(state: GameState, now: number) {
  const snapshot = getDayNightSnapshot(state, now);
  const isNight = snapshot.phase === "night";

  if (!isNight) {
    const nextMonsters: Monster[] = [];
    for (const monster of state.monsters) {
      if (monster.kind !== "ghost") {
        nextMonsters.push(monster);
        continue;
      }
      if (monster.despawnStartMs === null) {
        monster.despawnStartMs = now;
      }
      if (!isGhostDisappearAnimationFinished(monster, now)) {
        nextMonsters.push(monster);
      }
    }
    state.monsters = nextMonsters;
    return;
  }

  for (const monster of state.monsters) {
    if (monster.kind !== "ghost") continue;
    monster.despawnStartMs = null;
  }

  const hasGhost = state.monsters.some((monster) => monster.kind === "ghost");
  if (hasGhost) return;
  state.monsters.push(...spawnNightGhostPack(state, now));
}

function updateChaserMonster(
  state: GameState,
  monster: ChaserMonster,
  playerCell: Vec,
  dt: number,
  now: number,
  touchEnabled: boolean
) {
  const monsterCell = {
    x: Math.floor(monster.pos.x),
    y: Math.floor(monster.pos.y),
  };
  const monsterKey = cellKey(monsterCell.x, monsterCell.y);

  if (state.spikes.has(monsterKey)) {
    state.spikes.delete(monsterKey);
    monster.stunUntil = now + 5000;
  }
  if (state.boosters.has(monsterKey)) {
    state.boosters.delete(monsterKey);
    monster.boostUntil = Math.max(monster.boostUntil, now + CHASER_BOOST_MS);
  }

  const playerInvisible = isPlayerInvisibleToEnemies(state, now);

  if (now >= monster.stunUntil) {
    const chaserSpeed =
      PLAYER_SPEED *
      dt *
      CHASER_SPEED_MULT *
      (touchEnabled ? TOUCH_CHASER_SPEED_MULT : 1) *
      (now < monster.boostUntil ? CHASER_BOOST_MULT : 1);

    const atCenter = isAtCellCenter(monster.pos);
    if (!atCenter && !monster.target) {
      monster.target = {
        x: monsterCell.x + 0.5,
        y: monsterCell.y + 0.5,
      };
    }

    if (atCenter && !monster.target && !playerInvisible) {
      let desired = bfsNextStep(state.grid, monsterCell, playerCell);
      if (desired.x === 0 && desired.y === 0) {
        desired = bestNeighborStep(state.grid, monsterCell, playerCell);
      }

      const neighborCount = countOpenNeighbors(state.grid, monsterCell);
      const canReverse = neighborCount <= 1;
      let nextDir = desired;
      if (isOpposite(desired, monster.dir) && !canReverse) {
        nextDir = bestNeighborStepAvoid(state.grid, monsterCell, playerCell, desired);
      }

      monster.dir = nextDir;
      const targetCell = {
        x: monsterCell.x + nextDir.x,
        y: monsterCell.y + nextDir.y,
      };
      if (inBounds(targetCell.x, targetCell.y) && state.grid[targetCell.y][targetCell.x] === 0) {
        monster.target = {
          x: targetCell.x + 0.5,
          y: targetCell.y + 0.5,
        };
      }
      monster.lastPathTime = now;
      monster.lastCell = { x: monsterCell.x, y: monsterCell.y };
    }

    if (monster.target) {
      const toTarget = {
        x: monster.target.x - monster.pos.x,
        y: monster.target.y - monster.pos.y,
      };
      const dist = Math.hypot(toTarget.x, toTarget.y);
      if (dist <= chaserSpeed) {
        monster.pos = { ...monster.target };
        monster.target = null;
      } else {
        monster.pos = {
          x: monster.pos.x + (toTarget.x / dist) * chaserSpeed,
          y: monster.pos.y + (toTarget.y / dist) * chaserSpeed,
        };
      }
    }
  }
}

function setDirectionFromDelta(monster: GhostMonster, deltaX: number, deltaY: number) {
  const length = Math.hypot(deltaX, deltaY);
  if (length <= 0.000001) return;
  monster.dir = {
    x: deltaX / length,
    y: deltaY / length,
  };
}

function advanceGhostAlongPath(monster: GhostMonster, moveDistance: number) {
  if (moveDistance <= 0 || monster.path.length < 2) return;

  const pathLength = monster.path.length;
  let segmentIndex = monster.pathIndex % pathLength;
  if (segmentIndex < 0) segmentIndex += pathLength;
  let progress = Math.max(0, Math.min(1, monster.pathProgress));
  let remaining = moveDistance;
  let currentPoint = monster.path[segmentIndex];
  let guard = pathLength * 4;

  while (remaining > 0.000001 && guard > 0) {
    guard -= 1;
    const nextIndex = (segmentIndex + 1) % pathLength;
    const nextPoint = monster.path[nextIndex];
    const deltaX = nextPoint.x - currentPoint.x;
    const deltaY = nextPoint.y - currentPoint.y;
    const segmentLength = Math.hypot(deltaX, deltaY);

    if (segmentLength <= 0.000001) {
      segmentIndex = nextIndex;
      currentPoint = monster.path[segmentIndex];
      progress = 0;
      continue;
    }

    const remainingOnSegment = (1 - progress) * segmentLength;
    if (remaining >= remainingOnSegment - 0.000001) {
      remaining -= remainingOnSegment;
      segmentIndex = nextIndex;
      currentPoint = monster.path[segmentIndex];
      progress = 0;
      monster.pos = { ...currentPoint };
      setDirectionFromDelta(monster, deltaX, deltaY);
      continue;
    }

    progress += remaining / segmentLength;
    monster.pos = {
      x: currentPoint.x + deltaX * progress,
      y: currentPoint.y + deltaY * progress,
    };
    setDirectionFromDelta(monster, deltaX, deltaY);
    remaining = 0;
  }

  monster.pathIndex = segmentIndex;
  monster.pathProgress = progress >= 1 ? 0 : progress;
}

function updateGhostMonster(state: GameState, monster: GhostMonster, dt: number, now: number) {
  if (now < monster.stunUntil) return;

  const baseGhostSpeed = PLAYER_SPEED * dt * GHOST_SPEED_MULT;
  if (baseGhostSpeed <= 0) return;

  if (monster.behavior === "path") {
    if (updateGhostMemoryIfSeeing(monster, state, now)) {
      const closestHunter = findClosestDefaultHunterForGhost(state, monster, now);
      if (closestHunter) {
        monster.assignedHunterId = closestHunter.id;
        monster.behavior = "to_hunter";
      }
    }
    if (monster.behavior === "path") {
      advanceGhostAlongPath(monster, baseGhostSpeed);
    }
  }

  if (monster.behavior === "to_hunter") {
    updateGhostMemoryIfSeeing(monster, state, now);

    const assignedHunter = findHunterById(state, monster.assignedHunterId);
    if (!assignedHunter || !isHunterDefaultStateForGhostRecruit(assignedHunter, now)) {
      returnGhostToPath(monster);
    } else {
      const reachedHunter = moveGhostTowardsTarget(
        monster,
        assignedHunter.pos,
        baseGhostSpeed * GHOST_TO_HUNTER_SPEED_MULT
      );
      if (reachedHunter || distance(monster.pos, assignedHunter.pos) <= GHOST_MEET_HUNTER_DISTANCE) {
        const rememberedPos = monster.rememberedPlayerPos ?? state.player;
        activateGhostHunterCommand(monster, assignedHunter, rememberedPos);
      }
    }
  }

  if (monster.behavior === "with_hunter") {
    const assignedHunter = findHunterById(state, monster.assignedHunterId);
    if (
      !assignedHunter ||
      assignedHunter.ghostCommandGhostId !== monster.id ||
      assignedHunter.ghostCommandTarget === null
    ) {
      returnGhostToPath(monster);
    } else {
      monster.pos = { ...assignedHunter.pos };
      monster.dir = { ...assignedHunter.dir };
      monster.target = null;
      if (updateGhostMemoryIfSeeing(monster, state, now)) {
        const rememberedPos = monster.rememberedPlayerPos ?? state.player;
        assignedHunter.lastSeenPlayer = { ...rememberedPos };
        assignedHunter.ghostCommandTarget = { ...rememberedPos };
      }
    }
  }

  if (monster.behavior === "return_to_path") {
    if (updateGhostMemoryIfSeeing(monster, state, now)) {
      const closestHunter = findClosestDefaultHunterForGhost(state, monster, now);
      if (closestHunter) {
        monster.assignedHunterId = closestHunter.id;
        monster.behavior = "to_hunter";
      }
    }
    if (monster.behavior !== "return_to_path") {
      monster.lastPathTime = now;
      monster.lastCell = {
        x: Math.floor(monster.pos.x),
        y: Math.floor(monster.pos.y),
      };
      return;
    }
    const pathIndex = monster.returnPathIndex;
    if (pathIndex === null || pathIndex < 0 || pathIndex >= monster.path.length) {
      monster.behavior = "path";
      monster.returnPathIndex = null;
    } else {
      const reached = moveGhostTowardsTarget(monster, monster.path[pathIndex], baseGhostSpeed);
      if (reached) {
        monster.pos = { ...monster.path[pathIndex] };
        monster.pathIndex = pathIndex;
        monster.pathProgress = 0;
        monster.returnPathIndex = null;
        monster.behavior = "path";
      }
    }
  }

  monster.lastPathTime = now;
  monster.lastCell = {
    x: Math.floor(monster.pos.x),
    y: Math.floor(monster.pos.y),
  };
}

export function createMonsterAt(position: Vec, now: number, bombKillable: boolean): Monster {
  return {
    kind: "chaser",
    pos: { ...position },
    dir: { x: 0, y: 0 },
    target: null,
    boostUntil: 0,
    stunUntil: 0,
    lastPathTime: now,
    lastCell: {
      x: Math.floor(position.x),
      y: Math.floor(position.y),
    },
    bombKillable,
    health: CHASER_HEALTH,
    hurtUntilMs: 0,
  };
}

export function createGhostAt(path: Vec[], now: number): GhostMonster {
  const start = path[0] ?? { x: 0.5, y: 0.5 };
  return {
    kind: "ghost",
    id: allocateGhostId(),
    pos: { ...start },
    dir: { x: 1, y: 0 },
    target: null,
    boostUntil: 0,
    stunUntil: 0,
    lastPathTime: now,
    lastCell: {
      x: Math.floor(start.x),
      y: Math.floor(start.y),
    },
    bombKillable: false,
    path: path.map((point) => ({ ...point })),
    pathIndex: 0,
    pathProgress: 0,
    spawnMs: now,
    despawnStartMs: null,
    behavior: "path",
    rememberedPlayerPos: null,
    assignedHunterId: null,
    returnPathIndex: null,
  };
}

export function updateMonster(
  state: GameState,
  dt: number,
  now: number,
  touchEnabled: boolean,
  onLoseReason: (value: LoseReason) => void
) {
  syncNightGhost(state, now);
  if (state.monsters.length === 0) return true;

  const playerCell = {
    x: Math.floor(state.player.x),
    y: Math.floor(state.player.y),
  };

  for (const monster of state.monsters) {
    if (monster.kind === "ghost") {
      updateGhostMonster(state, monster, dt, now);
    } else {
      updateChaserMonster(state, monster, playerCell, dt, now, touchEnabled);
    }

    if (monster.kind !== "ghost" && distance(state.player, monster.pos) < 0.45) {
      if (applyPlayerEnemyHit(state, now, "caught", onLoseReason)) return false;
    }
  }

  return true;
}
