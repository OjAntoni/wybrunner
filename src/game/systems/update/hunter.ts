import {
  HUNTER_BACK_CHECK_CHANCE,
  HUNTER_BACK_CHECK_LOOK_MS,
  HUNTER_BACK_CHECK_MIN_CLEAR_TILES,
  HUNTER_CHASER_PLACE_CHANCE_NO_CHASER,
  HUNTER_CHASER_PLACE_CHANCE_WITH_CHASER,
  HUNTER_CHASER_PLACE_DURATION_MS,
  HUNTER_CHASE_ROTATE_ANIM_MULT,
  HUNTER_CHASE_SPEED_MULT,
  HUNTER_NERVOUS_SCAN_HOLD_MS,
  HUNTER_NERVOUS_SCAN_TURN_MS,
  HUNTER_PATROL_MAX_STRAIGHT_STEPS,
  HUNTER_PATROL_MIN_STRAIGHT_STEPS,
  HUNTER_ROTATE_ANIM_MS,
  HUNTER_SHORT_CORRIDOR_TILES,
  HUNTER_TURRET_PLACE_CHANCE_PER_STEP,
  HUNTER_TURRET_PLACE_DURATION_MS,
  HUNTER_VISION_ANGLE_DEG,
  HUNTER_VISION_RADIUS_TILES,
  HUNTER_WALK_SPEED_MULT,
  PLAYER_SPEED,
  TURRET_MAX_COUNT,
} from "../../config/constants";
import type { GameState, Hunter, LoseReason, Vec } from "../../model/types";
import { cellKey, inBounds } from "../../utils/grid";
import { distance } from "../../utils/math";
import { directionFromAngle, getHunterFacingAngle, startHunterTurnAnimation } from "../../world/hunterFacing";
import { CARDINAL_DIRS } from "../../world/pathingDirections";
import { isTargetVisibleInVisionCone } from "../../world/hunterVision";
import { isAtCellCenter, isOpposite } from "../movement";
import { createMonsterAt } from "./monster";
import { createTurretAt } from "./turret";
import { loseGame } from "../outcome";

function randomInt(maxExclusive: number) {
  return Math.floor(Math.random() * maxExclusive);
}

function randomIntInRange(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function isSameDirection(a: Vec, b: Vec) {
  return a.x === b.x && a.y === b.y;
}

const DIAGONAL_DIRS: Vec[] = [
  { x: 1, y: 1 },
  { x: 1, y: -1 },
  { x: -1, y: 1 },
  { x: -1, y: -1 },
];

const HUNTER_MOVE_DIRS: Vec[] = [...CARDINAL_DIRS, ...DIAGONAL_DIRS];
const NERVOUS_SCAN_DIRS: Vec[] = [
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
  { x: -1, y: 1 },
  { x: -1, y: 0 },
  { x: -1, y: -1 },
  { x: 0, y: -1 },
  { x: 1, y: -1 },
];
const HUNTER_PATROL_RECENT_MEMORY = 8;
const HUNTER_TIGHT_LOOP_MIN_SAMPLES = 6;

function isDiagonalMove(direction: Vec) {
  return direction.x !== 0 && direction.y !== 0;
}

function canMoveHunterDirection(grid: GameState["grid"], fromCell: Vec, direction: Vec) {
  if (direction.x === 0 && direction.y === 0) return false;
  const targetX = fromCell.x + direction.x;
  const targetY = fromCell.y + direction.y;
  if (!inBounds(targetX, targetY)) return false;
  if (grid[targetY][targetX] === 1) return false;
  if (!isDiagonalMove(direction)) return true;

  const sideAX = fromCell.x + direction.x;
  const sideAY = fromCell.y;
  const sideBX = fromCell.x;
  const sideBY = fromCell.y + direction.y;
  if (!inBounds(sideAX, sideAY) || !inBounds(sideBX, sideBY)) return false;
  if (grid[sideAY][sideAX] === 1) return false;
  if (grid[sideBY][sideBX] === 1) return false;
  return true;
}

function gatherOpenNeighborDirs(grid: GameState["grid"], hunterCell: Vec) {
  const neighbors: Vec[] = [];
  for (const direction of HUNTER_MOVE_DIRS) {
    if (!canMoveHunterDirection(grid, hunterCell, direction)) continue;
    neighbors.push(direction);
  }
  return neighbors;
}

function gatherOpenCardinalNeighborDirs(grid: GameState["grid"], hunterCell: Vec) {
  const neighbors: Vec[] = [];
  for (const direction of CARDINAL_DIRS) {
    const nx = hunterCell.x + direction.x;
    const ny = hunterCell.y + direction.y;
    if (!inBounds(nx, ny)) continue;
    if (grid[ny][nx] === 1) continue;
    neighbors.push(direction);
  }
  return neighbors;
}

function countOpenTilesInDirection(grid: GameState["grid"], fromCell: Vec, direction: Vec) {
  let x = fromCell.x + direction.x;
  let y = fromCell.y + direction.y;
  let count = 0;
  while (inBounds(x, y) && grid[y][x] === 0) {
    count += 1;
    x += direction.x;
    y += direction.y;
  }
  return count;
}

function countOpenMovesInDirection(
  grid: GameState["grid"],
  fromCell: Vec,
  direction: Vec,
  maxSteps: number = 16
) {
  let count = 0;
  let current = fromCell;
  while (count < maxSteps && canMoveHunterDirection(grid, current, direction)) {
    current = {
      x: current.x + direction.x,
      y: current.y + direction.y,
    };
    count += 1;
  }
  return count;
}

function resetPatrolStepsUntilTurn(hunter: Hunter) {
  hunter.patrolStepsUntilTurn = randomIntInRange(
    HUNTER_PATROL_MIN_STRAIGHT_STEPS,
    HUNTER_PATROL_MAX_STRAIGHT_STEPS
  );
}

function clearBackCheckState(hunter: Hunter) {
  hunter.backCheckState = "none";
  hunter.backCheckForwardDir = null;
  hunter.backCheckHoldUntilMs = 0;
}

function clearNervousScanState(hunter: Hunter) {
  hunter.nervousScanActive = false;
  hunter.nervousScanIndex = 0;
  hunter.nervousScanStep = 1;
  hunter.nervousScanNextStepMs = 0;
}

function clearChaserPlacementState(hunter: Hunter) {
  hunter.chaserPlaceStartMs = 0;
  hunter.chaserPlaceEndMs = 0;
}

function rememberPatrolCell(hunter: Hunter, cell: Vec) {
  const key = cellKey(cell.x, cell.y);
  const prev = hunter.patrolRecentCells;
  if (prev.length > 0 && prev[prev.length - 1] === key) return;
  prev.push(key);
  if (prev.length > HUNTER_PATROL_RECENT_MEMORY) {
    prev.splice(0, prev.length - HUNTER_PATROL_RECENT_MEMORY);
  }
}

function patrolRevisitPenalty(hunter: Hunter, nextCell: Vec) {
  const key = cellKey(nextCell.x, nextCell.y);
  const recent = hunter.patrolRecentCells;
  for (let i = recent.length - 1; i >= 0; i -= 1) {
    if (recent[i] !== key) continue;
    const recency = recent.length - i;
    return (HUNTER_PATROL_RECENT_MEMORY - recency + 1) * 0.8;
  }
  return 0;
}

function parseCellKey(key: string): Vec {
  const [x, y] = key.split(",").map(Number);
  return { x, y };
}

function tryChooseTightLoopEscape(
  hunter: Hunter,
  grid: GameState["grid"],
  hunterCell: Vec,
  openNeighbors: Vec[]
) {
  if (hunter.patrolRecentCells.length < HUNTER_TIGHT_LOOP_MIN_SAMPLES) return null;

  const recent = hunter.patrolRecentCells.map(parseCellKey);
  recent.push(hunterCell);

  let minX = recent[0].x;
  let maxX = recent[0].x;
  let minY = recent[0].y;
  let maxY = recent[0].y;
  for (const cell of recent) {
    if (cell.x < minX) minX = cell.x;
    if (cell.x > maxX) maxX = cell.x;
    if (cell.y < minY) minY = cell.y;
    if (cell.y > maxY) maxY = cell.y;
  }

  // Recent path confined to a 3x3 neighborhood: likely orbiting a tiny obstacle.
  if (maxX - minX > 2 || maxY - minY > 2) return null;

  const escapeDirs: Vec[] = [];
  for (const direction of openNeighbors) {
    const nx = hunterCell.x + direction.x;
    const ny = hunterCell.y + direction.y;
    if (nx < minX || nx > maxX || ny < minY || ny > maxY) {
      escapeDirs.push(direction);
    }
  }
  if (escapeDirs.length === 0) return null;

  let bestScore = Number.NEGATIVE_INFINITY;
  const bestDirs: Vec[] = [];
  for (const direction of escapeDirs) {
    const straightOpen = countOpenMovesInDirection(grid, hunterCell, direction);
    const score = straightOpen - patrolRevisitPenalty(hunter, {
      x: hunterCell.x + direction.x,
      y: hunterCell.y + direction.y,
    });
    if (score > bestScore) {
      bestScore = score;
      bestDirs.length = 0;
      bestDirs.push(direction);
      continue;
    }
    if (score === bestScore) {
      bestDirs.push(direction);
    }
  }

  return bestDirs[randomInt(bestDirs.length)] ?? null;
}

function clearTurretPlacementState(hunter: Hunter) {
  hunter.turretPlaceStartMs = 0;
  hunter.turretPlaceEndMs = 0;
}

function startNervousScan(hunter: Hunter, now: number) {
  if (hunter.nervousScanActive) return;
  hunter.nervousScanActive = true;
  hunter.nervousScanStep = Math.random() < 0.5 ? 1 : -1;
  hunter.nervousScanIndex = hunter.nervousScanStep === 1 ? 0 : NERVOUS_SCAN_DIRS.length - 1;
  hunter.nervousScanNextStepMs = now;
  hunter.target = null;
  hunter.patrolStepsUntilTurn = 0;
}

function maybeStartChaserPlacement(state: GameState, hunter: Hunter, now: number) {
  if (hunter.chaserPlaceEndMs > now) return;
  if (hunter.turretPlaceEndMs > now) return;
  const chance =
    state.monsters.length === 0
      ? HUNTER_CHASER_PLACE_CHANCE_NO_CHASER
      : HUNTER_CHASER_PLACE_CHANCE_WITH_CHASER;
  if (Math.random() >= chance) return;

  clearBackCheckState(hunter);
  clearNervousScanState(hunter);
  hunter.mode = "patrol";
  hunter.lastSeenPlayer = null;
  hunter.target = null;
  hunter.patrolStepsUntilTurn = 0;
  hunter.chaserPlaceStartMs = now;
  hunter.chaserPlaceEndMs = now + HUNTER_CHASER_PLACE_DURATION_MS;
}

function maybeStartTurretPlacement(state: GameState, hunter: Hunter, now: number) {
  if (hunter.chaserPlaceEndMs > now || hunter.turretPlaceEndMs > now) return;
  if (state.turrets.length >= TURRET_MAX_COUNT) return;
  if (Math.random() >= HUNTER_TURRET_PLACE_CHANCE_PER_STEP) return;

  clearBackCheckState(hunter);
  clearNervousScanState(hunter);
  hunter.target = null;
  hunter.patrolStepsUntilTurn = 0;
  hunter.turretPlaceStartMs = now;
  hunter.turretPlaceEndMs = now + HUNTER_TURRET_PLACE_DURATION_MS;
}

function completeChaserPlacement(state: GameState, hunter: Hunter, now: number) {
  if (hunter.chaserPlaceEndMs <= 0 || now < hunter.chaserPlaceEndMs) return;
  state.monsters.push(createMonsterAt(hunter.pos, now, true));
  clearChaserPlacementState(hunter);
}

function completeTurretPlacement(state: GameState, hunter: Hunter, now: number) {
  if (hunter.turretPlaceEndMs <= 0 || now < hunter.turretPlaceEndMs) return;
  if (state.turrets.length < TURRET_MAX_COUNT) {
    state.turrets.push(createTurretAt(hunter.pos, now));
  }
  clearTurretPlacementState(hunter);
}

function updateNervousScan(hunter: Hunter, now: number) {
  if (!hunter.nervousScanActive) return false;
  if (now < hunter.nervousScanNextStepMs) return true;

  if (hunter.nervousScanIndex >= NERVOUS_SCAN_DIRS.length) {
    clearNervousScanState(hunter);
    hunter.mode = "patrol";
    hunter.lastSeenPlayer = null;
    resetPatrolStepsUntilTurn(hunter);
    return false;
  }
  if (hunter.nervousScanIndex < 0) {
    clearNervousScanState(hunter);
    hunter.mode = "patrol";
    hunter.lastSeenPlayer = null;
    resetPatrolStepsUntilTurn(hunter);
    return false;
  }

  const nextDir = NERVOUS_SCAN_DIRS[hunter.nervousScanIndex];
  hunter.nervousScanIndex += hunter.nervousScanStep;
  startHunterTurnAnimation(hunter, nextDir, now, HUNTER_NERVOUS_SCAN_TURN_MS);
  hunter.dir = nextDir;
  hunter.nervousScanNextStepMs = now + HUNTER_NERVOUS_SCAN_TURN_MS + HUNTER_NERVOUS_SCAN_HOLD_MS;
  return true;
}

function maybeStartBackCheck(hunter: Hunter, grid: GameState["grid"], hunterCell: Vec, now: number) {
  if (hunter.mode !== "patrol") return;
  if (hunter.target) return;
  if (hunter.backCheckState !== "none") return;
  if (hunter.dir.x === 0 && hunter.dir.y === 0) return;
  if (Math.random() >= HUNTER_BACK_CHECK_CHANCE) return;

  const backwardDir = { x: -hunter.dir.x, y: -hunter.dir.y };
  const openNeighbors = gatherOpenCardinalNeighborDirs(grid, hunterCell);
  if (openNeighbors.length !== 2) return;
  const hasForward = openNeighbors.some((direction) => isSameDirection(direction, hunter.dir));
  const hasBackward = openNeighbors.some((direction) => isSameDirection(direction, backwardDir));
  if (!hasForward || !hasBackward) return;

  const backClearTiles = countOpenTilesInDirection(grid, hunterCell, backwardDir);
  if (backClearTiles < HUNTER_BACK_CHECK_MIN_CLEAR_TILES) return;

  hunter.backCheckState = "looking_back";
  hunter.backCheckForwardDir = { ...hunter.dir };
  hunter.backCheckHoldUntilMs = now + HUNTER_ROTATE_ANIM_MS + HUNTER_BACK_CHECK_LOOK_MS;
  startHunterTurnAnimation(hunter, backwardDir, now);
  hunter.dir = backwardDir;
}

function updateBackCheckState(hunter: Hunter, now: number) {
  if (hunter.backCheckState === "none") return;

  if (hunter.backCheckState === "looking_back" && now >= hunter.backCheckHoldUntilMs) {
    if (!hunter.backCheckForwardDir) {
      clearBackCheckState(hunter);
      return;
    }
    startHunterTurnAnimation(hunter, hunter.backCheckForwardDir, now);
    hunter.dir = { ...hunter.backCheckForwardDir };
    hunter.backCheckState = "returning";
    return;
  }

  if (hunter.backCheckState === "returning" && now >= hunter.turnEndMs) {
    clearBackCheckState(hunter);
  }
}

function choosePatrolDirection(hunter: Hunter, grid: GameState["grid"], hunterCell: Vec) {
  const openNeighbors = gatherOpenNeighborDirs(grid, hunterCell);
  if (openNeighbors.length === 0) return { x: 0, y: 0 };
  if (openNeighbors.length === 1) {
    hunter.patrolStepsUntilTurn = 0;
    return openNeighbors[0];
  }

  const nonReverse = openNeighbors.filter((direction) => !isOpposite(direction, hunter.dir));
  const candidatePool = nonReverse.length > 0 ? nonReverse : openNeighbors;

  const tightLoopEscape = tryChooseTightLoopEscape(hunter, grid, hunterCell, openNeighbors);
  if (tightLoopEscape) {
    resetPatrolStepsUntilTurn(hunter);
    return tightLoopEscape;
  }

  const hasHeading = hunter.dir.x !== 0 || hunter.dir.y !== 0;
  if (hasHeading) {
    const backwardDir = { x: -hunter.dir.x, y: -hunter.dir.y };
    const hasForward = openNeighbors.some((direction) => isSameDirection(direction, hunter.dir));
    const hasBackward = openNeighbors.some((direction) => isSameDirection(direction, backwardDir));
    const sideDirs = candidatePool.filter(
      (direction) => !isSameDirection(direction, hunter.dir) && !isSameDirection(direction, backwardDir)
    );

    if (hasForward && hasBackward && sideDirs.length > 0) {
      const forwardOpen = countOpenMovesInDirection(grid, hunterCell, hunter.dir, 10);
      const backwardOpen = countOpenMovesInDirection(grid, hunterCell, backwardDir, 10);
      const shortestAxisRun = Math.min(forwardOpen, backwardOpen);

      if (shortestAxisRun <= HUNTER_SHORT_CORRIDOR_TILES) {
        let bestSideScore = Number.NEGATIVE_INFINITY;
        const bestSideDirs: Vec[] = [];
        for (const direction of sideDirs) {
          const sideOpen = countOpenMovesInDirection(grid, hunterCell, direction, 10);
          if (sideOpen > bestSideScore) {
            bestSideScore = sideOpen;
            bestSideDirs.length = 0;
            bestSideDirs.push(direction);
            continue;
          }
          if (sideOpen === bestSideScore) {
            bestSideDirs.push(direction);
          }
        }

        const sideDir = bestSideDirs[randomInt(bestSideDirs.length)];
        resetPatrolStepsUntilTurn(hunter);
        return sideDir;
      }
    }
  }

  const canContinue =
    hasHeading &&
    candidatePool.some((direction) => isSameDirection(direction, hunter.dir));
  if (canContinue && hunter.patrolStepsUntilTurn > 0) {
    hunter.patrolStepsUntilTurn -= 1;
    return hunter.dir;
  }

  let bestScore = Number.NEGATIVE_INFINITY;
  const bestDirs: Vec[] = [];
  for (const direction of candidatePool) {
    const straightOpen = countOpenMovesInDirection(grid, hunterCell, direction);
    const sameDirBonus = isSameDirection(direction, hunter.dir) ? 0.5 : 0;
    const nextCell = {
      x: hunterCell.x + direction.x,
      y: hunterCell.y + direction.y,
    };
    const revisitPenalty = patrolRevisitPenalty(hunter, nextCell);
    const score = straightOpen + sameDirBonus - revisitPenalty;
    if (score > bestScore) {
      bestScore = score;
      bestDirs.length = 0;
      bestDirs.push(direction);
      continue;
    }
    if (score === bestScore) {
      bestDirs.push(direction);
    }
  }

  const nextDir = bestDirs[randomInt(bestDirs.length)];
  resetPatrolStepsUntilTurn(hunter);
  if (isSameDirection(nextDir, hunter.dir) && hunter.patrolStepsUntilTurn > 0) {
    hunter.patrolStepsUntilTurn -= 1;
  }
  return nextDir;
}

function chooseChaseDirection(
  grid: GameState["grid"],
  hunterCell: Vec,
  chaseTarget: Vec,
  _currentDir: Vec
) {
  let desired = bfsNextStepHunter(grid, hunterCell, chaseTarget);
  if (desired.x === 0 && desired.y === 0) {
    desired = bestHunterNeighborStep(grid, hunterCell, chaseTarget);
  }

  const desiredCell = {
    x: hunterCell.x + desired.x,
    y: hunterCell.y + desired.y,
  };
  const reachesTargetInOneStep =
    desiredCell.x === chaseTarget.x && desiredCell.y === chaseTarget.y;
  if (reachesTargetInOneStep) return desired;
  return desired;
}

function bestHunterNeighborStep(grid: GameState["grid"], start: Vec, target: Vec): Vec {
  let best: Vec = { x: 0, y: 0 };
  let bestDist = Number.POSITIVE_INFINITY;
  for (const direction of HUNTER_MOVE_DIRS) {
    if (!canMoveHunterDirection(grid, start, direction)) continue;
    const nx = start.x + direction.x;
    const ny = start.y + direction.y;
    const dist = distance({ x: nx, y: ny }, target);
    if (dist < bestDist) {
      bestDist = dist;
      best = direction;
    }
  }
  return best;
}

function bfsNextStepHunter(grid: GameState["grid"], start: Vec, target: Vec): Vec {
  const queue: Vec[] = [start];
  const prev = new Map<string, string>();
  prev.set(cellKey(start.x, start.y), "");

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.x === target.x && current.y === target.y) break;

    for (const direction of HUNTER_MOVE_DIRS) {
      if (!canMoveHunterDirection(grid, current, direction)) continue;
      const nx = current.x + direction.x;
      const ny = current.y + direction.y;
      const key = cellKey(nx, ny);
      if (prev.has(key)) continue;
      prev.set(key, cellKey(current.x, current.y));
      queue.push({ x: nx, y: ny });
    }
  }

  const targetKey = cellKey(target.x, target.y);
  if (!prev.has(targetKey)) return { x: 0, y: 0 };

  let stepKey = targetKey;
  let parentKey = prev.get(stepKey)!;
  while (parentKey && parentKey !== cellKey(start.x, start.y)) {
    stepKey = parentKey;
    parentKey = prev.get(stepKey)!;
  }

  const [sx, sy] = stepKey.split(",").map(Number);
  return { x: sx - start.x, y: sy - start.y };
}

function setNextHunterTarget(
  hunter: Hunter,
  grid: GameState["grid"],
  hunterCell: Vec,
  nextDir: Vec,
  now: number
) {
  if (nextDir.x === 0 && nextDir.y === 0) return;
  if (!canMoveHunterDirection(grid, hunterCell, nextDir)) return;
  if (nextDir.x !== hunter.dir.x || nextDir.y !== hunter.dir.y) {
    const rotateDurationMs =
      hunter.mode === "chase"
        ? HUNTER_ROTATE_ANIM_MS * HUNTER_CHASE_ROTATE_ANIM_MULT
        : HUNTER_ROTATE_ANIM_MS;
    startHunterTurnAnimation(hunter, nextDir, now, rotateDurationMs);
  }
  hunter.dir = nextDir;
  hunter.target = {
    x: hunterCell.x + nextDir.x + 0.5,
    y: hunterCell.y + nextDir.y + 0.5,
  };
}

function updateHunterPursuitState(hunter: Hunter, player: Vec, seesPlayer: boolean) {
  if (seesPlayer) {
    hunter.mode = "chase";
    hunter.lastSeenPlayer = { ...player };
    clearNervousScanState(hunter);
    hunter.patrolStepsUntilTurn = 0;
    return;
  }

  if (hunter.mode !== "chase") return;
  if (!hunter.lastSeenPlayer) {
    hunter.mode = "patrol";
    clearNervousScanState(hunter);
    resetPatrolStepsUntilTurn(hunter);
  }
}

function updateSingleHunter(
  state: GameState,
  hunter: Hunter,
  dt: number,
  now: number,
  onLoseReason: (value: LoseReason) => void
) {
  const hunterCellNow = {
    x: Math.floor(hunter.pos.x),
    y: Math.floor(hunter.pos.y),
  };
  const hunterKey = cellKey(hunterCellNow.x, hunterCellNow.y);
  if (state.spikes.has(hunterKey)) {
    state.spikes.delete(hunterKey);
    hunter.stunUntil = Math.max(hunter.stunUntil, now + 5000);
  }
  completeChaserPlacement(state, hunter, now);
  completeTurretPlacement(state, hunter, now);
  if (hunter.chaserPlaceEndMs > now || hunter.turretPlaceEndMs > now) {
    if (distance(state.player, hunter.pos) < 0.45) {
      loseGame(state, "caught", onLoseReason);
      return false;
    }
    return true;
  }
  if (now < hunter.stunUntil) {
    if (distance(state.player, hunter.pos) < 0.45) {
      loseGame(state, "caught", onLoseReason);
      return false;
    }
    return true;
  }

  const facingDirection = directionFromAngle(getHunterFacingAngle(hunter, now));
  const seesPlayer = isTargetVisibleInVisionCone(
    state.grid,
    hunter.pos,
    facingDirection,
    state.player,
    HUNTER_VISION_RADIUS_TILES,
    HUNTER_VISION_ANGLE_DEG
  );
  updateHunterPursuitState(hunter, state.player, seesPlayer);
  if (hunter.mode === "chase") {
    clearBackCheckState(hunter);
  } else {
    updateBackCheckState(hunter, now);
  }
  if (hunter.nervousScanActive) {
    updateNervousScan(hunter, now);
    if (hunter.nervousScanActive) {
      if (distance(state.player, hunter.pos) < 0.45) {
        loseGame(state, "caught", onLoseReason);
        return false;
      }
      return true;
    }
    maybeStartChaserPlacement(state, hunter, now);
    if (hunter.chaserPlaceEndMs > now) {
      if (distance(state.player, hunter.pos) < 0.45) {
        loseGame(state, "caught", onLoseReason);
        return false;
      }
      return true;
    }
  }

  const speedMult = hunter.mode === "chase" ? HUNTER_CHASE_SPEED_MULT : HUNTER_WALK_SPEED_MULT;
  const hunterSpeed = PLAYER_SPEED * dt * speedMult;
  if (hunter.backCheckState !== "none") {
    if (distance(state.player, hunter.pos) < 0.45) {
      loseGame(state, "caught", onLoseReason);
      return false;
    }
    return true;
  }

  const atCenter = isAtCellCenter(hunter.pos);
  if (atCenter && !hunter.target) {
    const hunterCell = {
      x: Math.floor(hunter.pos.x),
      y: Math.floor(hunter.pos.y),
    };

    maybeStartTurretPlacement(state, hunter, now);
    if (hunter.turretPlaceEndMs > now) {
      if (distance(state.player, hunter.pos) < 0.45) {
        loseGame(state, "caught", onLoseReason);
        return false;
      }
      return true;
    }

    if (hunter.mode === "chase" && hunter.lastSeenPlayer) {
      const chaseCell = {
        x: Math.floor(hunter.lastSeenPlayer.x),
        y: Math.floor(hunter.lastSeenPlayer.y),
      };
      if (chaseCell.x === hunterCell.x && chaseCell.y === hunterCell.y) {
        startNervousScan(hunter, now);
      } else {
        const chaseDir = chooseChaseDirection(state.grid, hunterCell, chaseCell, hunter.dir);
        setNextHunterTarget(hunter, state.grid, hunterCell, chaseDir, now);
      }
    }

    if (hunter.mode === "patrol" && !hunter.target) {
      maybeStartBackCheck(hunter, state.grid, hunterCell, now);
    }

    if (hunter.mode === "patrol" && hunter.backCheckState === "none" && !hunter.target) {
      const patrolDir = choosePatrolDirection(hunter, state.grid, hunterCell);
      setNextHunterTarget(hunter, state.grid, hunterCell, patrolDir, now);
    }
  }
  if (hunter.backCheckState !== "none") {
    if (distance(state.player, hunter.pos) < 0.45) {
      loseGame(state, "caught", onLoseReason);
      return false;
    }
    return true;
  }

  if (hunter.target) {
    const toTarget = {
      x: hunter.target.x - hunter.pos.x,
      y: hunter.target.y - hunter.pos.y,
    };
    const dist = Math.hypot(toTarget.x, toTarget.y);
    if (dist <= hunterSpeed) {
      hunter.pos = { ...hunter.target };
      hunter.target = null;
      rememberPatrolCell(hunter, {
        x: Math.floor(hunter.pos.x),
        y: Math.floor(hunter.pos.y),
      });
    } else {
      hunter.pos = {
        x: hunter.pos.x + (toTarget.x / dist) * hunterSpeed,
        y: hunter.pos.y + (toTarget.y / dist) * hunterSpeed,
      };
    }
  }

  if (distance(state.player, hunter.pos) < 0.45) {
    loseGame(state, "caught", onLoseReason);
    return false;
  }

  return true;
}

export function updateHunters(
  state: GameState,
  dt: number,
  now: number,
  onLoseReason: (value: LoseReason) => void
) {
  for (const hunter of state.hunters) {
    if (!updateSingleHunter(state, hunter, dt, now, onLoseReason)) return false;
  }
  return true;
}
