import type { Vec } from "./basic";

export type ArrowThrower = {
  x: number; // wall tile
  y: number; // wall tile
  dir: Vec; // cardinal
  periodMs: number;
  nextFireMs: number;
};

export type Arrow = {
  pos: Vec; // tile coords (center-based)
  dir: Vec; // cardinal
  speed: number; // tiles per second
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

export type Monster = {
  pos: Vec;
  dir: Vec;
  target: Vec | null;
  boostUntil: number;
  stunUntil: number;
  lastPathTime: number;
  lastCell: Vec;
  bombKillable: boolean;
};

export type HunterMode = "patrol" | "chase";
export type HunterBackCheckState = "none" | "looking_back" | "returning";

export type Hunter = {
  pos: Vec;
  dir: Vec;
  target: Vec | null;
  mode: HunterMode;
  lastSeenPlayer: Vec | null;
  nervousScanActive: boolean;
  nervousScanIndex: number;
  nervousScanStep: 1 | -1;
  nervousScanNextStepMs: number;
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
};
