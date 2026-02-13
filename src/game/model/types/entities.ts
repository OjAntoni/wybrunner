import type { Vec } from "./basic";

export type ArrowThrower = {
  x: number; // wall tile
  y: number; // wall tile
  dir: Vec; // cardinal
  periodMs: number;
  nextFireMs: number;
  lastFireMs: number;
};

export type Arrow = {
  pos: Vec; // tile coords (center-based)
  dir: Vec;
  speed: number; // tiles per second
  source: "thrower" | "turret";
};

export type Helper = {
  id: number;
  pos: Vec;
  path: Vec[]; // integer tile coords
  index: number;
  dir: 1 | -1;
  target: Vec | null; // next tile center
  targetIndex: number | null;
  boostUntil: number;
};

type MonsterBase = {
  pos: Vec;
  dir: Vec;
  target: Vec | null;
  boostUntil: number;
  stunUntil: number;
  lastPathTime: number;
  lastCell: Vec;
  bombKillable: boolean;
};

export type ChaserMonster = MonsterBase & {
  kind: "chaser";
  health: number;
  hurtUntilMs: number;
};

export type GhostMonster = MonsterBase & {
  kind: "ghost";
  id: number;
  path: Vec[];
  pathIndex: number;
  pathProgress: number;
  spawnMs: number;
  despawnStartMs: number | null;
  behavior: "path" | "to_hunter" | "with_hunter" | "return_to_path";
  rememberedPlayerPos: Vec | null;
  assignedHunterId: number | null;
  returnPathIndex: number | null;
};

export type Monster = ChaserMonster | GhostMonster;

export type HunterMode = "patrol" | "chase";
export type HunterBackCheckState = "none" | "looking_back" | "returning";

export type Hunter = {
  id: number;
  pos: Vec;
  dir: Vec;
  target: Vec | null;
  mode: HunterMode;
  health: number;
  hurtUntilMs: number;
  visionAngleDeg: number;
  lastSeenPlayer: Vec | null;
  nervousScanActive: boolean;
  nervousScanIndex: number;
  nervousScanStep: 1 | -1;
  nervousScanNextStepMs: number;
  nervousScanUntilMs: number;
  chaseOnHit: boolean;
  nervousSearchTargetKey: string | null;
  nervousSearchTargetCell: Vec | null;
  nervousSearchRecentKeys: string[];
  backCheckState: HunterBackCheckState;
  backCheckForwardDir: Vec | null;
  backCheckHoldUntilMs: number;
  patrolStepsUntilTurn: number;
  stunUntil: number;
  turnFromAngle: number;
  turnToAngle: number;
  turnStartMs: number;
  turnEndMs: number;
  chaserPlaceStartMs: number;
  chaserPlaceEndMs: number;
  turretPlaceStartMs: number;
  turretPlaceEndMs: number;
  patrolRecentCells: string[];
  ghostCommandTarget: Vec | null;
  ghostCommandGhostId: number | null;
};

export type TurretMode = "sweep" | "track" | "cooldown";

export type Turret = {
  id: number;
  pos: Vec;
  facingAngle: number;
  mode: TurretMode;
  trackingAngle: number;
  seenTargetAtMs: number;
  nextShotMs: number;
  lockTransitionStartMs: number;
  lockTransitionDir: 1 | -1;
};
