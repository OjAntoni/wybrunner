import type { Cell, GameStatus, LoseReason, Vec } from "./basic";
import type { ExploreCloud, ExploreCloudBuckets, FogArea } from "./clouds";
import type { Arrow, ArrowThrower, Helper, Hunter, Monster, Turret } from "./entities";

export type Explosion = {
  x: number;
  y: number;
  start: number;
};

export type PlayerPopup = {
  text: string;
  startMs: number;
  endMs: number;
};

export type GameState = {
  grid: Cell[][];
  player: Vec;
  playerFacing: Vec;
  playerFacingIndicator: Vec;
  monsters: Monster[];
  hunters: Hunter[];
  turrets: Turret[];
  items: Set<string>;
  coins: Set<string>;
  coinsCollected: number;
  undergroundTrapsHidden: Set<string>;
  undergroundTrapsRevealed: Set<string>;
  undergroundTrapRevealMs: Map<string, number>;
  arrowThrowers: ArrowThrower[];
  arrows: Arrow[];
  spikes: Set<string>;
  spikesLeft: number;
  bombsLeft: number;
  boosters: Set<string>;
  traps: Set<string>;
  helpers: Helper[];
  helpersSpawned: boolean;
  discoveredArtifacts: Set<string>;
  exploreInitialized: boolean;
  exploreClouds: ExploreCloud[];
  exploreCloudBuckets: ExploreCloudBuckets;
  exploreCloudQueryStamp: number;
  fogAreas: FogArea[];
  fogAreaInside: Map<number, number>;
  fogStart: number;
  fogUntil: number;
  explosions: Explosion[];
  playerPopup: PlayerPopup | null;
  swordSwingStartMs: number | null;
  swordCooldownUntilMs: number;
  dayNightCycleStartMs: number;
  status: GameStatus;
  loseReason: LoseReason;
  lastPlayerCell: Vec;
};
