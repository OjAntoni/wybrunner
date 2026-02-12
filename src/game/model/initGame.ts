import { generateMaze } from "../world/maze";
import { buildExploreCloudBuckets, buildExploreClouds } from "../world/exploreClouds";
import { cellCenter } from "../utils/grid";
import type { GameState, Hunter } from "./types";
import { buildInitialPlacements } from "./initGamePlacements";
import { CARDINAL_DIRS } from "../world/pathingDirections";
import { directionToAngle } from "../world/hunterFacing";

function createRngSeed() {
  return ((Date.now() & 0xffffffff) ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
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
  const hunters: Hunter[] = hunterCells.map((cell) => {
    const dir = CARDINAL_DIRS[Math.floor(Math.random() * CARDINAL_DIRS.length)];
    const angle = directionToAngle(dir);
    return {
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
      stunUntil: 0,
      turnFromAngle: angle,
      turnToAngle: angle,
      turnStartMs: now,
      turnEndMs: now,
      chaserPlaceStartMs: 0,
      chaserPlaceEndMs: 0,
    };
  });

  const exploreClouds = buildExploreClouds(createRngSeed());
  const exploreCloudBuckets = buildExploreCloudBuckets(exploreClouds);

  return {
    grid,
    player: cellCenter(playerCell),
    monsters: [],
    hunters,
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
    status: "playing",
    loseReason: "caught",
    lastPlayerCell: { x: playerCell.x, y: playerCell.y },
  };
}
