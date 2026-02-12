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
