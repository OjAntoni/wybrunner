import { generateMaze } from "../world/maze";
import { buildExploreCloudBuckets, buildExploreClouds } from "../world/exploreClouds";
import { cellCenter, cellKey } from "../utils/grid";
import type { GameState, Hunter } from "./types";
import { HUNTER_PATROL_MAX_STRAIGHT_STEPS, HUNTER_PATROL_MIN_STRAIGHT_STEPS } from "../config/constants";
import { buildInitialPlacements } from "./initGamePlacements";
import { CARDINAL_DIRS } from "../world/pathingDirections";
import { directionToAngle } from "../world/hunterFacing";

function createRngSeed() {
  return ((Date.now() & 0xffffffff) ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

function randomIntInRange(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

export function initGame(now: number = performance.now()): GameState {
  const grid = generateMaze();
  const {
    playerCell,
    hunterCells,
    items,
    coins,
    undergroundTrapsHidden,
    arrowThrowers,
  } = buildInitialPlacements(grid, now);
  const hunters: Hunter[] = hunterCells.map((cell, index) => {
    const dir = CARDINAL_DIRS[Math.floor(Math.random() * CARDINAL_DIRS.length)];
    const angle = directionToAngle(dir);
    return {
      id: index + 1,
      pos: cellCenter(cell),
      dir,
      target: null,
      mode: "patrol",
      lastSeenPlayer: null,
      nervousScanActive: false,
      nervousScanIndex: 0,
      nervousScanStep: 1,
      nervousScanNextStepMs: 0,
      backCheckState: "none",
      backCheckForwardDir: null,
      backCheckHoldUntilMs: 0,
      patrolStepsUntilTurn: randomIntInRange(
        HUNTER_PATROL_MIN_STRAIGHT_STEPS,
        HUNTER_PATROL_MAX_STRAIGHT_STEPS
      ),
      stunUntil: 0,
      turnFromAngle: angle,
      turnToAngle: angle,
      turnStartMs: now,
      turnEndMs: now,
      chaserPlaceStartMs: 0,
      chaserPlaceEndMs: 0,
      turretPlaceStartMs: 0,
      turretPlaceEndMs: 0,
      patrolRecentCells: [cellKey(cell.x, cell.y)],
      ghostCommandTarget: null,
      ghostCommandGhostId: null,
    };
  });

  const exploreClouds = buildExploreClouds(createRngSeed());
  const exploreCloudBuckets = buildExploreCloudBuckets(exploreClouds);

  return {
    grid,
    player: cellCenter(playerCell),
    playerFacing: { x: 1, y: 0 },
    playerFacingIndicator: { x: 1, y: 0 },
    monsters: [],
    hunters,
    turrets: [],
    items,
    coins,
    coinsCollected: 0,
    undergroundTrapsHidden,
    undergroundTrapsRevealed: new Set<string>(),
    undergroundTrapRevealMs: new Map<string, number>(),
    arrowThrowers,
    arrows: [],
    spikes: new Set<string>(),
    spikesLeft: 3,
    bombsLeft: 1,
    boosters: new Set<string>(),
    traps: new Set<string>(),
    helpers: [],
    helpersSpawned: false,
    discoveredArtifacts: new Set<string>(),
    exploreInitialized: false,
    exploreClouds,
    exploreCloudBuckets,
    exploreCloudQueryStamp: 0,
    fogAreas: [],
    fogAreaInside: new Map(),
    fogStart: 0,
    fogUntil: 0,
    explosions: [],
    playerPopup: null,
    dayNightCycleStartMs: now,
    status: "playing",
    loseReason: "caught",
    lastPlayerCell: { x: playerCell.x, y: playerCell.y },
  };
}
