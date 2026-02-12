import type { VisibleTileBounds } from "./sceneTypes";

export function parseCellKey(key: string): [number, number] {
  const [x, y] = key.split(",").map(Number);
  return [x, y];
}

export function isWithinBounds(x: number, y: number, bounds: VisibleTileBounds) {
  return x >= bounds.startX && x <= bounds.endX && y >= bounds.startY && y <= bounds.endY;
}
