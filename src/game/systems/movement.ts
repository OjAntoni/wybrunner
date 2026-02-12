import {
  ENTITY_RADIUS,
  TOUCH_TURN_ASSIST_TILES,
  TURN_ASSIST_TILES,
} from "../config/constants";
import type { Cell, Vec } from "../model/types";
import { inBounds } from "../utils/grid";

export function isAtCellCenter(pos: Vec) {
  const fx = Math.abs(pos.x - Math.floor(pos.x) - 0.5);
  const fy = Math.abs(pos.y - Math.floor(pos.y) - 0.5);
  return fx < 0.08 && fy < 0.08;
}

export function isOpposite(a: Vec, b: Vec) {
  return a.x === -b.x && a.y === -b.y && (a.x !== 0 || a.y !== 0);
}

export function isBlocked(grid: Cell[][], pos: Vec) {
  const minX = Math.floor(pos.x - ENTITY_RADIUS);
  const maxX = Math.floor(pos.x + ENTITY_RADIUS);
  const minY = Math.floor(pos.y - ENTITY_RADIUS);
  const maxY = Math.floor(pos.y + ENTITY_RADIUS);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (!inBounds(x, y)) return true;
      if (grid[y][x] === 1) return true;
    }
  }
  return false;
}

export function tryMove(
  grid: Cell[][],
  pos: Vec,
  dir: Vec,
  speed: number,
  useTouchTurnAssist: boolean
): Vec {
  if (dir.x === 0 && dir.y === 0) return pos;
  const turnAssistTiles = useTouchTurnAssist ? TOUCH_TURN_ASSIST_TILES : TURN_ASSIST_TILES;
  const tileCenter = (v: number) => Math.floor(v) + 0.5;
  const nudgeToward = (v: number, target: number, maxDelta: number) => {
    const d = target - v;
    if (Math.abs(d) <= maxDelta) return target;
    return v + Math.sign(d) * maxDelta;
  };

  const next = { x: pos.x + dir.x * speed, y: pos.y + dir.y * speed };
  const movedX = { x: next.x, y: pos.y };
  if (!isBlocked(grid, movedX)) {
    pos = movedX;
  } else if (dir.x !== 0) {
    // Corner assist: if we're slightly misaligned in the corridor, nudge toward the
    // current tile's center on the perpendicular axis and retry.
    const maxNudge = Math.min(turnAssistTiles, Math.max(speed, 0.01));
    const nudgedY = nudgeToward(pos.y, tileCenter(pos.y), maxNudge);
    const movedXNudged = { x: next.x, y: nudgedY };
    if (!isBlocked(grid, movedXNudged)) pos = movedXNudged;
  }
  const movedY = { x: pos.x, y: next.y };
  if (!isBlocked(grid, movedY)) {
    pos = movedY;
  } else if (dir.y !== 0) {
    const maxNudge = Math.min(turnAssistTiles, Math.max(speed, 0.01));
    const nudgedX = nudgeToward(pos.x, tileCenter(pos.x), maxNudge);
    const movedYNudged = { x: nudgedX, y: next.y };
    if (!isBlocked(grid, movedYNudged)) pos = movedYNudged;
  }
  return pos;
}
