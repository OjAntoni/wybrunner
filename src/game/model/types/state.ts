import type { Cell, GameStatus, LoseReason, Vec } from "./basic";
import type { ExploreCloud, ExploreCloudBuckets, FogArea } from "./clouds";
import type { Arrow, ArrowThrower, Helper } from "./entities";

export type Explosion = {
  x: number;
  y: number;
  start: number;
};

export type GameState = {
  grid: Cell[][];
  player: Vec;
  monster: Vec;
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
  boostUntil: number;
  explosions: Explosion[];
  status: GameStatus;
  loseReason: LoseReason;
  monsterDir: Vec;
  monsterTarget: Vec | null;
  lastPathTime: number;
  stunUntil: number;
  lastMonsterCell: Vec;
  lastPlayerCell: Vec;
};
