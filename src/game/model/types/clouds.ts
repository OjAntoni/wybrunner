export type ExploreCloud = {
  x: number; // world px center
  y: number; // world px center
  size: number; // px
  half: number; // px
  radius: number; // px (body radius for overlap checks)
  alpha: number;
  shade: 0 | 1 | 2;
  fadeStart: number | null;
  queryStamp: number;
};

export type ExploreCloudBuckets = {
  bucketSize: number;
  cols: number;
  rows: number;
  buckets: number[][];
};

export type FogCloud = {
  x: number; // world px
  y: number; // world px
  size: number; // px
  alpha: number;
  shade: 0 | 1 | 2;
  amp: number; // px
  fx: number; // Hz-like (used as rad/sec multiplier)
  fy: number;
  phaseX: number;
  phaseY: number;
};

export type FogBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export type FogAnchor = { x: number; y: number; r: number };

export type FogArea = {
  id: number;
  cells: number[]; // packed (y * GRID_W + x)
  cellSet: Set<number>;
  // Render anchors in world tile coords (x/y are centers, r in tiles) to make the
  // fog read as a continuous area rather than a tile grid.
  anchors: FogAnchor[];
  clipPath: Path2D;
  bounds: FogBounds; // world px bounds for fast culling
  clouds: FogCloud[];
  start: number;
  end: number;
};
