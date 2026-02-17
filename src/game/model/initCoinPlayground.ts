import { GRID_H, GRID_W } from "../config/constants";
import { cellCenter, cellKey } from "../utils/grid";
import { initGame } from "./initGame";
import type { Cell, GameState } from "./types";
import { createBucketedCellSet } from "../world/cellBuckets";

export function initCoinPlayground(now: number = performance.now()): GameState {
  const state = initGame(now);

  const playerCell = {
    x: Math.floor(GRID_W * 0.5),
    y: Math.floor(GRID_H * 0.5),
  };

  // Replace generated maze with a fully open grid and coin on every tile.
  state.grid = Array.from({ length: GRID_H }, () => Array<Cell>(GRID_W).fill(0));
  state.player = cellCenter(playerCell);
  state.lastPlayerCell = playerCell;
  state.coins = createBucketedCellSet(undefined, { trackChanges: true });
  for (let y = 0; y < GRID_H; y += 1) {
    for (let x = 0; x < GRID_W; x += 1) {
      state.coins.add(cellKey(x, y));
    }
  }
  state.coinsCollected = 0;

  // Keep only the player and coin systems for isolated pickup/perf testing.
  state.monsters = [];
  state.hunters = [];
  state.turrets = [];
  state.items.clear();
  state.lifeHearts.clear();
  state.undergroundTrapsHidden.clear();
  state.undergroundTrapsRevealed.clear();
  state.undergroundTrapRevealMs.clear();
  state.arrowThrowers = [];
  state.arrows = [];
  state.spikes.clear();
  state.spikesLeft = 0;
  state.bombsLeft = 0;
  state.boosters.clear();
  state.traps.clear();
  state.helpers = [];
  state.helpersSpawned = true;
  state.discoveredArtifacts.clear();
  state.exploreInitialized = true;
  state.exploreClouds = [];
  state.exploreCloudBuckets = {
    bucketSize: 1,
    cols: 0,
    rows: 0,
    buckets: [],
  };
  state.exploreCloudQueryStamp = 0;
  state.fogAreas = [];
  state.fogAreaInside.clear();
  state.fogStart = 0;
  state.fogUntil = 0;
  state.explosions = [];
  state.playerPopup = null;
  state.enemySenseSegments = [];
  state.swordSwingStartMs = null;
  state.swordCooldownUntilMs = 0;
  state.swordSwingHitMs = null;

  return state;
}
