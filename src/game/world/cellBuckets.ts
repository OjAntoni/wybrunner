import { GRID_H, GRID_W } from "../config/constants";

const DEFAULT_RENDER_BUCKET_SIZE_TILES = 8;

export type TileBoundsLike = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

type BucketCell = {
  key: string;
  x: number;
  y: number;
};

type BucketLocation = {
  bucketIndex: number;
  cellIndex: number;
};

export type BucketedCellSetChange =
  | {
      kind: "clear";
    }
  | {
      kind: "add" | "delete";
      key: string;
      x: number;
      y: number;
    };

type BucketedCellSetOptions = {
  bucketSize?: number;
  trackChanges?: boolean;
};

function parseCellKeyFast(key: string): [number, number] {
  const commaIndex = key.indexOf(",");
  if (commaIndex <= 0 || commaIndex >= key.length - 1) {
    return [Number.NaN, Number.NaN];
  }
  return [Number(key.slice(0, commaIndex)), Number(key.slice(commaIndex + 1))];
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function isWithinBounds(x: number, y: number, bounds: TileBoundsLike) {
  return x >= bounds.startX && x <= bounds.endX && y >= bounds.startY && y <= bounds.endY;
}

export class BucketedCellSet extends Set<string> {
  readonly bucketSize: number;
  readonly cols: number;
  readonly rows: number;

  private readonly buckets: BucketCell[][];
  private readonly locations = new Map<string, BucketLocation>();
  private readonly trackChanges: boolean;
  private revisionValue = 0;
  private pendingChanges: BucketedCellSetChange[] = [];

  constructor(
    values?: Iterable<string>,
    options: number | BucketedCellSetOptions = DEFAULT_RENDER_BUCKET_SIZE_TILES
  ) {
    super();
    const bucketSize =
      typeof options === "number" ? options : options.bucketSize ?? DEFAULT_RENDER_BUCKET_SIZE_TILES;
    this.trackChanges = typeof options === "number" ? false : !!options.trackChanges;
    this.bucketSize = Math.max(1, Math.floor(bucketSize));
    this.cols = Math.max(1, Math.ceil(GRID_W / this.bucketSize));
    this.rows = Math.max(1, Math.ceil(GRID_H / this.bucketSize));
    this.buckets = Array.from({ length: this.cols * this.rows }, () => []);

    if (!values) return;
    for (const value of values) {
      this.add(value);
    }
  }

  override add(value: string): this {
    if (super.has(value)) return this;

    const [x, y] = parseCellKeyFast(value);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      super.add(value);
      this.recordChange({
        kind: "add",
        key: value,
        x,
        y,
      });
      return this;
    }

    const bucketIndex = this.getBucketIndexForCell(x, y);
    const bucket = this.buckets[bucketIndex];
    const cellIndex = bucket.length;
    bucket.push({ key: value, x, y });
    this.locations.set(value, { bucketIndex, cellIndex });
    super.add(value);
    this.recordChange({
      kind: "add",
      key: value,
      x,
      y,
    });
    return this;
  }

  override delete(value: string): boolean {
    if (!super.delete(value)) return false;

    const location = this.locations.get(value);
    if (!location) {
      const [x, y] = parseCellKeyFast(value);
      this.recordChange({
        kind: "delete",
        key: value,
        x,
        y,
      });
      return true;
    }

    const bucket = this.buckets[location.bucketIndex];
    const lastIndex = bucket.length - 1;
    const removed = bucket[location.cellIndex];
    const lastCell = bucket[lastIndex];
    bucket.pop();

    if (location.cellIndex < lastIndex && lastCell) {
      bucket[location.cellIndex] = lastCell;
      const moved = this.locations.get(lastCell.key);
      if (moved) moved.cellIndex = location.cellIndex;
    }

    this.locations.delete(value);
    this.recordChange({
      kind: "delete",
      key: value,
      x: removed?.x ?? Number.NaN,
      y: removed?.y ?? Number.NaN,
    });
    return true;
  }

  override clear(): void {
    if (this.size === 0) return;
    super.clear();
    this.locations.clear();
    for (const bucket of this.buckets) {
      bucket.length = 0;
    }
    this.recordClear();
  }

  get revision() {
    return this.revisionValue;
  }

  forEachInBounds(
    bounds: TileBoundsLike,
    visit: (x: number, y: number, key: string) => void
  ) {
    const minBX = clamp(Math.floor(bounds.startX / this.bucketSize), 0, this.cols - 1);
    const maxBX = clamp(Math.floor(bounds.endX / this.bucketSize), 0, this.cols - 1);
    const minBY = clamp(Math.floor(bounds.startY / this.bucketSize), 0, this.rows - 1);
    const maxBY = clamp(Math.floor(bounds.endY / this.bucketSize), 0, this.rows - 1);

    for (let by = minBY; by <= maxBY; by += 1) {
      for (let bx = minBX; bx <= maxBX; bx += 1) {
        const bucket = this.buckets[by * this.cols + bx];
        for (let i = 0; i < bucket.length; i += 1) {
          const cell = bucket[i];
          if (!isWithinBounds(cell.x, cell.y, bounds)) continue;
          visit(cell.x, cell.y, cell.key);
        }
      }
    }
  }

  private getBucketIndexForCell(x: number, y: number) {
    const bx = clamp(Math.floor(x / this.bucketSize), 0, this.cols - 1);
    const by = clamp(Math.floor(y / this.bucketSize), 0, this.rows - 1);
    return by * this.cols + bx;
  }

  consumeChanges(): BucketedCellSetChange[] {
    if (!this.trackChanges || this.pendingChanges.length === 0) return [];
    const out = this.pendingChanges;
    this.pendingChanges = [];
    return out;
  }

  private bumpRevision() {
    this.revisionValue += 1;
  }

  private recordChange(change: BucketedCellSetChange) {
    this.bumpRevision();
    if (!this.trackChanges) return;
    this.pendingChanges.push(change);
  }

  private recordClear() {
    this.bumpRevision();
    if (!this.trackChanges) return;
    this.pendingChanges = [{ kind: "clear" }];
  }
}

export function createBucketedCellSet(
  values?: Iterable<string>,
  options?: number | BucketedCellSetOptions
) {
  return new BucketedCellSet(values, options);
}

export function forEachCellInBounds(
  cells: Set<string>,
  bounds: TileBoundsLike,
  visit: (x: number, y: number, key: string) => void
) {
  if (cells instanceof BucketedCellSet) {
    cells.forEachInBounds(bounds, visit);
    return;
  }

  for (const key of cells) {
    const [x, y] = parseCellKeyFast(key);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    if (!isWithinBounds(x, y, bounds)) continue;
    visit(x, y, key);
  }
}
