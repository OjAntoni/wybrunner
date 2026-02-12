import { generateMaze } from "../world/maze";
import { buildExploreCloudBuckets, buildExploreClouds } from "../world/exploreClouds";
import { cellCenter } from "../utils/grid";
import type { GameState } from "./types";
import { buildInitialPlacements } from "./initGamePlacements";

function createRngSeed() {
  return ((Date.now() & 0xffffffff) ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

export function initGame(): GameState {
  const grid = generateMaze();
  const {
    playerCell,
    monsterCell,
    items,
    coins,
    undergroundTrapsHidden,
    arrowThrowers,
  } = buildInitialPlacements(grid);

  const exploreClouds = buildExploreClouds(createRngSeed());
  const exploreCloudBuckets = buildExploreCloudBuckets(exploreClouds);

  return {
    grid,
    player: cellCenter(playerCell),
    monster: cellCenter(monsterCell),
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
    boostUntil: 0,
    explosions: [],
    playerPopup: null,
    status: "playing",
    loseReason: "caught",
    monsterDir: { x: 0, y: 0 },
    monsterTarget: null,
    lastPathTime: 0,
    stunUntil: 0,
    lastMonsterCell: { x: monsterCell.x, y: monsterCell.y },
    lastPlayerCell: { x: playerCell.x, y: playerCell.y },
  };
}
