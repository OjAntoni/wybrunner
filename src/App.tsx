import { useEffect, useMemo, useRef, useState } from "react";

const GRID_W = 96;
const GRID_H = 64;
const TILE_SIZE = 12;
const ITEMS_TARGET = 10;
const COINS_TARGET = 100;
const UNDERGROUND_TRAPS_TARGET = 30;
const PLAYER_SPEED = 4; // tiles per second
const EXTRA_CONNECTION_RATIO = 0.2;
const ENTITY_RADIUS = 0.3; // tiles
const CAMERA_ZOOM = 2.2;
const TURN_ASSIST_TILES = 0.22; // how far we can "snap" into a corridor while turning
const BOMB_RADIUS_TILES = 8;
const FOG_RADIUS_TILES = 4;
const FOG_DURATION_MS = 8000;
const FOG_AREA_MIN_DIST = 10; // tiles away from player
const FOG_AREA_COUNT_MAX = 3;
const FOG_AREA_DURATION_MIN_MS = 30000;
const FOG_AREA_DURATION_MAX_MS = 60000;
const FOG_AREA_FADE_MS = 900;
const CHASER_BOOST_MULT = 1.5;
const CHASER_BOOST_MS = 3000;
const HELPER_COUNT = 3;
const HELPER_MIN_DIST = 10; // tiles from player at spawn
const HELPER_MIN_PATH_LEN = 16; // tiles
const HELPER_SPEED_MULT = 0.6;

let helperIdCounter = 1;
let fogAreaIdCounter = 1;

type Vec = { x: number; y: number };
type Cell = 0 | 1;
type GameStatus = "playing" | "win" | "lose";
type LoseReason = "caught" | "trap" | "helper" | "arrow";
type RGB = { r: number; g: number; b: number };
type UIScreen = "menu" | "controls" | "game";

type ArrowThrower = {
  x: number; // wall tile
  y: number; // wall tile
  dir: Vec; // cardinal
  periodMs: number;
  nextFireMs: number;
};

type Arrow = {
  pos: Vec; // tile coords (center-based)
  dir: Vec; // cardinal
  speed: number; // tiles per second
};

type Helper = {
  id: number;
  pos: Vec;
  path: Vec[]; // integer tile coords
  index: number;
  dir: 1 | -1;
  target: Vec | null; // next tile center
  targetIndex: number | null;
  boostUntil: number;
};

type FogCloud = {
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

type FogBounds = { minX: number; minY: number; maxX: number; maxY: number };

type FogArea = {
  id: number;
  cells: number[]; // packed (y * GRID_W + x)
  cellSet: Set<number>;
  // Render anchors in world tile coords (x/y are centers, r in tiles) to make the
  // fog read as a continuous area rather than a tile grid.
  anchors: { x: number; y: number; r: number }[];
  clipPath: Path2D;
  bounds: FogBounds; // world px bounds for fast culling
  clouds: FogCloud[];
  start: number;
  end: number;
};

type GameState = {
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
  fogAreas: FogArea[];
  fogAreaInside: Map<number, number>;
  fogStart: number;
  fogUntil: number;
  boostUntil: number;
  explosions: { x: number; y: number; start: number }[];
  status: GameStatus;
  loseReason: LoseReason;
  monsterDir: Vec;
  monsterTarget: Vec | null;
  lastPathTime: number;
  stunUntil: number;
  lastMonsterCell: Vec;
  lastPlayerCell: Vec;
};

const keyToDir: Record<string, Vec> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  w: { x: 0, y: -1 },
  s: { x: 0, y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1, y: 0 },
};

function inBounds(x: number, y: number) {
  return x >= 0 && y >= 0 && x < GRID_W && y < GRID_H;
}

function cellKey(x: number, y: number) {
  return `${x},${y}`;
}

function packCell(x: number, y: number) {
  return y * GRID_W + x;
}

function unpackCell(packed: number): Vec {
  const y = Math.floor(packed / GRID_W);
  const x = packed - y * GRID_W;
  return { x, y };
}

const CARDINAL_DIRS: Vec[] = [
  { x: 1, y: 0 },
  { x: -1, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: -1 },
];

function openRunLength(grid: Cell[][], start: Vec, dir: Vec) {
  let len = 0;
  let x = start.x;
  let y = start.y;
  while (inBounds(x, y) && grid[y][x] === 0) {
    len += 1;
    x += dir.x;
    y += dir.y;
  }
  return len;
}

function shuffle<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function randomOpenCellIndexFar(
  grid: Cell[][],
  exclude: Set<string>,
  from: Vec,
  minDistTiles: number
) {
  const minDistSq = minDistTiles * minDistTiles;
  let tries = 0;
  while (tries < 20000) {
    tries += 1;
    const cell = randomOpenCellIndex(grid, exclude);
    const dx = cell.x - from.x;
    const dy = cell.y - from.y;
    if (dx * dx + dy * dy >= minDistSq) return cell;
  }
  // Fallback: accept any open cell if the map is too cramped.
  return randomOpenCellIndex(grid, exclude);
}

function openNeighbors(grid: Cell[][], cell: Vec) {
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  const out: Vec[] = [];
  for (const d of dirs) {
    const nx = cell.x + d.x;
    const ny = cell.y + d.y;
    if (!inBounds(nx, ny)) continue;
    if (grid[ny][nx] === 0) out.push({ x: nx, y: ny });
  }
  return out;
}

function generateHelperPath(
  grid: Cell[][],
  start: Vec,
  minLen: number,
  rng: () => number
): Vec[] | null {
  const path: Vec[] = [start];
  const visited = new Set<string>([cellKey(start.x, start.y)]);
  while (path.length < minLen) {
    const current = path[path.length - 1];
    const candidates = openNeighbors(grid, current).filter(
      (c) => !visited.has(cellKey(c.x, c.y))
    );
    if (candidates.length === 0) return null;
    const next = candidates[Math.floor(rng() * candidates.length)];
    path.push(next);
    visited.add(cellKey(next.x, next.y));
  }
  return path;
}

function generateMaze(): Cell[][] {
  const grid: Cell[][] = Array.from({ length: GRID_H }, () =>
    Array.from({ length: GRID_W }, () => 1)
  );

  const stack: Vec[] = [];
  const start: Vec = { x: 1, y: 1 };
  grid[start.y][start.x] = 0;
  stack.push(start);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const dirs = shuffle([
      { x: 2, y: 0 },
      { x: -2, y: 0 },
      { x: 0, y: 2 },
      { x: 0, y: -2 },
    ]);

    let carved = false;
    for (const d of dirs) {
      const nx = current.x + d.x;
      const ny = current.y + d.y;
      if (!inBounds(nx, ny)) continue;
      if (nx <= 0 || ny <= 0 || nx >= GRID_W - 1 || ny >= GRID_H - 1)
        continue;
      if (grid[ny][nx] === 1) {
        grid[ny][nx] = 0;
        grid[current.y + d.y / 2][current.x + d.x / 2] = 0;
        stack.push({ x: nx, y: ny });
        carved = true;
        break;
      }
    }
    if (!carved) stack.pop();
  }

  for (let x = 0; x < GRID_W; x += 1) {
    grid[0][x] = 1;
    grid[GRID_H - 1][x] = 1;
  }
  for (let y = 0; y < GRID_H; y += 1) {
    grid[y][0] = 1;
    grid[y][GRID_W - 1] = 1;
  }

  addExtraConnections(grid, EXTRA_CONNECTION_RATIO);

  return grid;
}

function blowUp(grid: Cell[][], cx: number, cy: number) {
  for (let dy = -BOMB_RADIUS_TILES; dy <= BOMB_RADIUS_TILES; dy += 1) {
    for (let dx = -BOMB_RADIUS_TILES; dx <= BOMB_RADIUS_TILES; dx += 1) {
      if (dx * dx + dy * dy > BOMB_RADIUS_TILES * BOMB_RADIUS_TILES) continue;
      const x = cx + dx;
      const y = cy + dy;
      if (!inBounds(x, y)) continue;
      if (x === 0 || y === 0 || x === GRID_W - 1 || y === GRID_H - 1)
        continue;
      grid[y][x] = 0;
    }
  }
}

function keysInBlast(cx: number, cy: number) {
  const keys: string[] = [];
  for (let dy = -BOMB_RADIUS_TILES; dy <= BOMB_RADIUS_TILES; dy += 1) {
    for (let dx = -BOMB_RADIUS_TILES; dx <= BOMB_RADIUS_TILES; dx += 1) {
      if (dx * dx + dy * dy > BOMB_RADIUS_TILES * BOMB_RADIUS_TILES) continue;
      const x = cx + dx;
      const y = cy + dy;
      if (!inBounds(x, y)) continue;
      if (x === 0 || y === 0 || x === GRID_W - 1 || y === GRID_H - 1)
        continue;
      keys.push(cellKey(x, y));
    }
  }
  return keys;
}

function addExtraConnections(grid: Cell[][], ratio: number) {
  const candidates: Vec[] = [];
  for (let y = 1; y < GRID_H - 1; y += 1) {
    for (let x = 1; x < GRID_W - 1; x += 1) {
      if (grid[y][x] !== 1) continue;
      const openLeft = grid[y][x - 1] === 0;
      const openRight = grid[y][x + 1] === 0;
      const openUp = grid[y - 1][x] === 0;
      const openDown = grid[y + 1][x] === 0;
      if (openLeft && openRight) {
        candidates.push({ x, y });
      } else if (openUp && openDown) {
        candidates.push({ x, y });
      }
    }
  }
  shuffle(candidates);
  const removeCount = Math.floor(candidates.length * ratio);
  for (let i = 0; i < removeCount; i += 1) {
    const cell = candidates[i];
    grid[cell.y][cell.x] = 0;
  }
}

function randomOpenCellIndex(grid: Cell[][], exclude: Set<string>) {
  while (true) {
    const x = 1 + Math.floor(Math.random() * (GRID_W - 2));
    const y = 1 + Math.floor(Math.random() * (GRID_H - 2));
    if (grid[y][x] === 0 && !exclude.has(cellKey(x, y))) {
      return { x, y };
    }
  }
}

function cellCenter(cell: Vec): Vec {
  return { x: cell.x + 0.5, y: cell.y + 0.5 };
}

function distance(a: Vec, b: Vec) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function bfsNextStep(grid: Cell[][], start: Vec, target: Vec): Vec {
  const queue: Vec[] = [start];
  const prev = new Map<string, string>();
  prev.set(cellKey(start.x, start.y), "");

  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.x === target.x && current.y === target.y) break;

    for (const d of dirs) {
      const nx = current.x + d.x;
      const ny = current.y + d.y;
      const key = cellKey(nx, ny);
      if (!inBounds(nx, ny)) continue;
      if (grid[ny][nx] === 1) continue;
      if (prev.has(key)) continue;
      prev.set(key, cellKey(current.x, current.y));
      queue.push({ x: nx, y: ny });
    }
  }

  const targetKey = cellKey(target.x, target.y);
  if (!prev.has(targetKey)) {
    return bestNeighborStep(grid, start, target);
  }

  let stepKey = targetKey;
  let parentKey = prev.get(stepKey)!;
  while (parentKey && parentKey !== cellKey(start.x, start.y)) {
    stepKey = parentKey;
    parentKey = prev.get(stepKey)!;
  }

  const [sx, sy] = stepKey.split(",").map(Number);
  return { x: sx - start.x, y: sy - start.y };
}

function bestNeighborStep(grid: Cell[][], start: Vec, target: Vec): Vec {
  const candidates = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  let best: Vec = { x: 0, y: 0 };
  let bestDist = Number.POSITIVE_INFINITY;
  for (const d of candidates) {
    const nx = start.x + d.x;
    const ny = start.y + d.y;
    if (!inBounds(nx, ny)) continue;
    if (grid[ny][nx] === 1) continue;
    const dist = distance({ x: nx, y: ny }, target);
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  return best;
}

function bestNeighborStepAvoid(
  grid: Cell[][],
  start: Vec,
  target: Vec,
  avoid: Vec
): Vec {
  const candidates = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  let best: Vec = avoid;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const d of candidates) {
    if (d.x === avoid.x && d.y === avoid.y) continue;
    const nx = start.x + d.x;
    const ny = start.y + d.y;
    if (!inBounds(nx, ny)) continue;
    if (grid[ny][nx] === 1) continue;
    const dist = distance({ x: nx, y: ny }, target);
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  return best;
}

function countOpenNeighbors(grid: Cell[][], cell: Vec) {
  const dirs = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 },
  ];
  let count = 0;
  for (const d of dirs) {
    const nx = cell.x + d.x;
    const ny = cell.y + d.y;
    if (!inBounds(nx, ny)) continue;
    if (grid[ny][nx] === 0) count += 1;
  }
  return count;
}

function initGame(): GameState {
  const grid = generateMaze();
  const taken = new Set<string>();
  const playerCell = randomOpenCellIndex(grid, taken);
  taken.add(cellKey(playerCell.x, playerCell.y));

  let monsterCell = randomOpenCellIndex(grid, taken);
  while (distance(playerCell, monsterCell) < 18) {
    monsterCell = randomOpenCellIndex(grid, taken);
  }
  taken.add(cellKey(monsterCell.x, monsterCell.y));

  const items = new Set<string>();
  while (items.size < ITEMS_TARGET) {
    const item = randomOpenCellIndex(grid, taken);
    items.add(cellKey(item.x, item.y));
  }

  const coins = new Set<string>();
  // Stratified coin placement: roughly even spread across the map.
  const cols = 10;
  const rows = 10;
  const rng = mulberry32(((Date.now() & 0xffffffff) ^ Math.floor(Math.random() * 0xffffffff)) >>> 0);
  const baseNow = performance.now();
  const regionW = GRID_W / cols;
  const regionH = GRID_H / rows;
  for (let i = 0; i < COINS_TARGET; i += 1) {
    const rx = i % cols;
    const ry = Math.floor(i / cols) % rows;
    const x0 = Math.max(1, Math.floor(rx * regionW));
    const x1 = Math.min(GRID_W - 2, Math.floor((rx + 1) * regionW) - 1);
    const y0 = Math.max(1, Math.floor(ry * regionH));
    const y1 = Math.min(GRID_H - 2, Math.floor((ry + 1) * regionH) - 1);

    let placed = false;
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const x = Math.max(
        1,
        Math.min(GRID_W - 2, x0 + Math.floor(rng() * (x1 - x0 + 1)))
      );
      const y = Math.max(
        1,
        Math.min(GRID_H - 2, y0 + Math.floor(rng() * (y1 - y0 + 1)))
      );
      if (grid[y][x] !== 0) continue;
      const k = cellKey(x, y);
      if (taken.has(k)) continue;
      // Keep coins separate from artifacts.
      if (items.has(k)) continue;
      coins.add(k);
      taken.add(k);
      placed = true;
      break;
    }
    if (placed) continue;

    // Fallback: anywhere open.
    for (let attempt = 0; attempt < 600; attempt += 1) {
      const x = 1 + Math.floor(rng() * (GRID_W - 2));
      const y = 1 + Math.floor(rng() * (GRID_H - 2));
      if (grid[y][x] !== 0) continue;
      const k = cellKey(x, y);
      if (taken.has(k)) continue;
      if (items.has(k)) continue;
      coins.add(k);
      taken.add(k);
      break;
    }
  }

  const undergroundTrapsHidden = new Set<string>();
  while (undergroundTrapsHidden.size < UNDERGROUND_TRAPS_TARGET) {
    const cell = randomOpenCellIndex(grid, taken);
    const k = cellKey(cell.x, cell.y);
    if (items.has(k) || coins.has(k)) continue;
    undergroundTrapsHidden.add(k);
    taken.add(k);
  }

  // Arrow throwers: embedded in walls, firing down a clear corridor.
  const arrowThrowers: ArrowThrower[] = [];
  const throwerTarget = 10 + Math.floor(rng() * 6); // 10-15 inclusive
  const candidates: { x: number; y: number; dir: Vec }[] = [];
  for (let y = 1; y < GRID_H - 1; y += 1) {
    for (let x = 1; x < GRID_W - 1; x += 1) {
      if (grid[y][x] !== 1) continue;
      for (const dir of CARDINAL_DIRS) {
        const sx = x + dir.x;
        const sy = y + dir.y;
        if (!inBounds(sx, sy)) continue;
        if (grid[sy][sx] !== 0) continue;
        const len = openRunLength(grid, { x: sx, y: sy }, dir);
        if (len < 4) continue;
        candidates.push({ x, y, dir });
      }
    }
  }
  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const usedThrowerCells = new Set<string>();
  for (const c of candidates) {
    const k = cellKey(c.x, c.y);
    if (usedThrowerCells.has(k)) continue;
    usedThrowerCells.add(k);
    arrowThrowers.push({
      x: c.x,
      y: c.y,
      dir: c.dir,
      periodMs: 3000,
      // Randomize phase so they don't all fire on the same beat.
      nextFireMs: baseNow + (0.25 + rng() * 0.75) * 3000,
    });
    if (arrowThrowers.length >= throwerTarget) break;
  }

  return {
    grid,
    player: cellCenter(playerCell),
    monster: cellCenter(monsterCell),
    items,
    coins,
    coinsCollected: 0,
    undergroundTrapsHidden,
    undergroundTrapsRevealed: new Set<string>(),
    undergroundTrapRevealMs: new Map<string, number>(),
    arrowThrowers,
    arrows: [],
    spikes: new Set<string>(),
    spikesLeft: 3,
    bombsLeft: 1,
    boosters: new Set<string>(),
    traps: new Set<string>(),
    helpers: [],
    helpersSpawned: false,
    fogAreas: [],
    fogAreaInside: new Map(),
    fogStart: 0,
    fogUntil: 0,
    boostUntil: 0,
    explosions: [],
    status: "playing",
    loseReason: "caught",
    monsterDir: { x: 0, y: 0 },
    monsterTarget: null,
    lastPathTime: 0,
    stunUntil: 0,
    lastMonsterCell: { x: monsterCell.x, y: monsterCell.y },
    lastPlayerCell: { x: playerCell.x, y: playerCell.y },
  };
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GameState>(initGame());
  const keysRef = useRef<Set<string>>(new Set());
  const dprRef = useRef(1);
  const canvasCssSizeRef = useRef({ w: 0, h: 0 });
  const hudTopRef = useRef<HTMLDivElement | null>(null);
  const inventoryRef = useRef<HTMLElement | null>(null);
  const fogSpritesRef = useRef<HTMLCanvasElement[] | null>(null);
  const screenRef = useRef<UIScreen>("menu");
  const confirmRestartRef = useRef(false);
  const pausedRef = useRef(false);
  const hudRectsRef = useRef<{
    hudTop: DOMRect | null;
    inventory: DOMRect | null;
    lastUpdate: number;
  }>({ hudTop: null, inventory: null, lastUpdate: 0 });
  const [screen, setScreen] = useState<UIScreen>("menu");
  const [status, setStatus] = useState<GameStatus>("playing");
  const [itemsLeft, setItemsLeft] = useState(ITEMS_TARGET);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [spikesLeft, setSpikesLeft] = useState(3);
  const [bombsLeft, setBombsLeft] = useState(1);
  const [loseReason, setLoseReason] = useState<LoseReason>("caught");
  const [confirmRestartOpen, setConfirmRestartOpen] = useState(false);
  const [paused, setPaused] = useState(false);

  const helpText = useMemo(
    () => "Move with WASD or arrow keys. Collect 10 artifacts. Avoid the chaser.",
    []
  );

  const goToScreen = (next: UIScreen) => {
    screenRef.current = next;
    setScreen(next);
  };

  const goToMainMenu = () => {
    keysRef.current.clear();
    confirmRestartRef.current = false;
    setConfirmRestartOpen(false);
    pausedRef.current = false;
    setPaused(false);
    goToScreen("menu");
  };

  const openRestartConfirm = () => {
    keysRef.current.clear();
    confirmRestartRef.current = true;
    setConfirmRestartOpen(true);
  };

  const closeRestartConfirm = () => {
    keysRef.current.clear();
    confirmRestartRef.current = false;
    setConfirmRestartOpen(false);
  };

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    confirmRestartRef.current = confirmRestartOpen;
  }, [confirmRestartOpen]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      const ui = screenRef.current;
      if (ui !== "game") {
        if (e.key === "Enter" || e.key === " ") {
          startNewGame();
          e.preventDefault();
        } else if (e.key.toLowerCase() === "c") {
          goToScreen("controls");
          e.preventDefault();
        } else if (e.key === "Escape") {
          goToScreen("menu");
          e.preventDefault();
        } else if (keyToDir[e.key]) {
          e.preventDefault();
        }
        return;
      }

      // End screen: lead back to main menu (no restart suggestion here).
      if (!confirmRestartRef.current && stateRef.current.status !== "playing") {
        if (e.key === "Enter" || e.key === " " || e.key === "Escape") {
          goToMainMenu();
          e.preventDefault();
          return;
        }
        if (keyToDir[e.key] || e.key.toLowerCase() === "r") {
          e.preventDefault();
          return;
        }
      }

      if (confirmRestartRef.current) {
        if (e.key === "Enter" || e.key === " ") {
          restart();
          closeRestartConfirm();
          e.preventDefault();
        } else if (e.key === "Escape") {
          closeRestartConfirm();
          e.preventDefault();
        } else if (keyToDir[e.key]) {
          e.preventDefault();
        }
        return;
      }

      if (e.key === "Escape") {
        // Pause/unpause only while actively playing.
        if (stateRef.current.status === "playing") {
          keysRef.current.clear();
          setPaused((p) => !p);
        }
        e.preventDefault();
        return;
      }

      if (pausedRef.current) {
        if (e.key === "r") {
          openRestartConfirm();
          e.preventDefault();
        } else if (keyToDir[e.key]) {
          e.preventDefault();
        }
        return;
      }

      if (keyToDir[e.key]) {
        keysRef.current.add(e.key);
        e.preventDefault();
      }
      if (e.key === " " || e.key === "e") {
        placeSpike();
        e.preventDefault();
      }
      if (e.key === "b") {
        placeBomb();
        e.preventDefault();
      }
      if (e.key === "r") {
        openRestartConfirm();
        e.preventDefault();
      }
    };
    const handleUp = (e: KeyboardEvent) => {
      if (screenRef.current === "game" && keyToDir[e.key]) {
        keysRef.current.delete(e.key);
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleDown);
    window.addEventListener("keyup", handleUp);
    return () => {
      window.removeEventListener("keydown", handleDown);
      window.removeEventListener("keyup", handleUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    const resizeCanvas = () => {
      const el = canvasRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cssW = Math.max(1, Math.floor(rect.width));
      const cssH = Math.max(1, Math.floor(rect.height));
      const dpr = window.devicePixelRatio || 1;
      dprRef.current = dpr;
      canvasCssSizeRef.current = { w: cssW, h: cssH };
      const nextW = Math.floor(cssW * dpr);
      const nextH = Math.floor(cssH * dpr);
      if (el.width !== nextW) el.width = nextW;
      if (el.height !== nextH) el.height = nextH;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let lastTime = performance.now();
    let rafId = 0;

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;
      const state = stateRef.current;
      if (
        screenRef.current === "game" &&
        !confirmRestartRef.current &&
        !pausedRef.current &&
        state.status === "playing"
      ) {
        updateState(state, dt, time);
        if (state.status !== status) {
          setStatus(state.status);
        }
        setItemsLeft(state.items.size);
        setCoinsCollected(state.coinsCollected);
      }
      resizeCanvas();
      draw(ctx, state);
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(rafId);
    };
  }, [status, confirmRestartOpen]);

  const restart = () => {
    const next = initGame();
    stateRef.current = next;
    setStatus("playing");
    setItemsLeft(ITEMS_TARGET);
    setCoinsCollected(0);
    setSpikesLeft(3);
    setBombsLeft(1);
    setLoseReason("caught");
    keysRef.current.clear();
    setPaused(false);
  };

  const startNewGame = () => {
    restart();
    closeRestartConfirm();
    goToScreen("game");
  };

  return (
    <div className="app">
      <canvas ref={canvasRef} className="game-canvas" />
      {screen === "game" && (
        <div className="hud">
        <div className="hud-top" ref={hudTopRef}>
          <header className="title">
            <div>Labyrinth Runner</div>
            <div className="sub">96x64 Retro Maze</div>
          </header>
          <div className="stats">
            <div>
              Artifacts: {ITEMS_TARGET - itemsLeft} / {ITEMS_TARGET}
            </div>
            <div className="coins-stat">
              Coins: <span className="coins-count">{coinsCollected}</span>
            </div>
            <div>
              Status:{" "}
              {status === "playing" ? "Running" : status.toUpperCase()}
            </div>
            <div>R: restart</div>
          </div>
          <div className="help">{helpText}</div>
        </div>

        <aside className="inventory" ref={inventoryRef}>
          <div className="inventory-title">Inventory</div>
          <div className="inventory-group">
            <div className="inventory-label">Spikes</div>
            <div className="inventory-slots">
              {[0, 1, 2].map((i) => (
                <div
                  key={`spike-${i}`}
                  className={`inventory-slot ${
                    i < spikesLeft ? "filled" : ""
                  }`}
                >
                  <svg
                    className="inventory-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 2 L18 10 L12 8 L6 10 Z"
                      fill="currentColor"
                    />
                    <rect x="10.5" y="10" width="3" height="10" />
                    <rect x="7" y="20" width="10" height="2" />
                  </svg>
                </div>
              ))}
            </div>
            <div className="inventory-hint">Place with Space or E</div>
          </div>

          <div className="inventory-group">
            <div className="inventory-label">Bombs</div>
            <div className="inventory-slots">
              {[0, 1, 2].map((i) => (
                <div
                  key={`bomb-${i}`}
                  className={`inventory-slot ${
                    i < bombsLeft ? "filled" : ""
                  }`}
                >
                  <svg
                    className="inventory-icon"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle cx="10" cy="14" r="6" />
                    <rect x="14" y="6" width="6" height="2" />
                    <circle cx="20" cy="6" r="2" />
                  </svg>
                </div>
              ))}
            </div>
            <div className="inventory-hint">Place with B</div>
          </div>

          <div className="inventory-group">
            <div className="inventory-label">Artifacts</div>
            <div className="inventory-counter">
              <svg
                className="inventory-icon small"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <rect x="6" y="6" width="12" height="12" rx="2" />
                <path d="M12 3 L14 6 L10 6 Z" />
                <path d="M12 21 L14 18 L10 18 Z" />
              </svg>
              <span>
                {ITEMS_TARGET - itemsLeft} / {ITEMS_TARGET}
              </span>
            </div>
          </div>

          <div className="inventory-group">
            <div className="inventory-label">Coins</div>
            <div className="inventory-counter coin-counter">
              <svg className="inventory-icon small" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="8" />
                <rect x="11" y="7" width="2" height="10" fill="#05070c" opacity="0.35" />
              </svg>
              <span className="coins-count">{coinsCollected}</span>
            </div>
          </div>
        </aside>
      </div>
      )}

      {screen === "game" && status !== "playing" && (
        <div className="overlay">
          <div className="overlay-box">
            <div className="overlay-title">
              {status === "win"
                ? "You Escaped!"
                : loseReason === "trap"
                  ? "Trapped!"
                  : loseReason === "arrow"
                    ? "Skewered!"
                  : loseReason === "helper"
                    ? "Intercepted!"
                  : "Caught!"}
            </div>
            <div className="overlay-text">
              {status === "win"
                ? "All artifacts collected."
                : loseReason === "trap"
                  ? "You stepped on a trap."
                  : loseReason === "arrow"
                    ? "A wall thrower landed a hit."
                  : loseReason === "helper"
                    ? "A hunter found you."
                  : "The monster matched your pace."}
            </div>
            <button className="overlay-button" onClick={goToMainMenu}>
              Main Menu
            </button>
            <div className="menu-hint">
              Press <span className="keycap">Enter</span> or{" "}
              <span className="keycap">Esc</span>
            </div>
          </div>
        </div>
      )}

      {screen === "game" && paused && status === "playing" && !confirmRestartOpen && (
        <div className="overlay overlay-pause">
          <div className="overlay-box pause-box">
            <div className="overlay-title">Paused</div>
            <div className="overlay-text">
              Press <span className="keycap">Esc</span> to resume.
            </div>
            <div className="confirm-actions">
              <button className="overlay-button" onClick={() => goToScreen("controls")}>
                Controls
              </button>
              <button
                className="overlay-button"
                onClick={() => {
                  keysRef.current.clear();
                  setPaused(false);
                }}
              >
                Resume
              </button>
            </div>
            <div className="menu-hint">
              <span className="keycap">R</span> restart
            </div>
          </div>
        </div>
      )}

      {screen === "game" && confirmRestartOpen && (
        <div className="overlay overlay-confirm">
          <div className="overlay-box confirm-box">
            <div className="overlay-title">Restart?</div>
            <div className="overlay-text">
              This will generate a new maze and reset your inventory.
            </div>
            <div className="confirm-actions">
              <button className="overlay-button" onClick={closeRestartConfirm}>
                Cancel
              </button>
              <button
                className="overlay-button confirm-danger"
                onClick={() => {
                  restart();
                  closeRestartConfirm();
                }}
              >
                Restart
              </button>
            </div>
            <div className="menu-hint">
              <span className="keycap">Enter</span> confirm{" "}
              <span className="keycap">Esc</span> cancel
            </div>
          </div>
        </div>
      )}

      {screen !== "game" && (
        <div className="overlay overlay-menu">
          <div className="overlay-box menu-box">
            {screen === "menu" ? (
              <>
                <div className="menu-title">Labyrinth Runner</div>
                <div className="menu-sub">Retro chase in a shifting maze</div>
                <div className="menu-options">
                  <button className="menu-button" onClick={startNewGame}>
                    Start New Game
                  </button>
                  <button className="menu-button" onClick={() => goToScreen("controls")}>
                    Controls
                  </button>
                </div>
                <div className="menu-hint">
                  Press <span className="keycap">Enter</span> to start,{" "}
                  <span className="keycap">C</span> for controls
                </div>
              </>
            ) : (
              <>
                <div className="menu-title">Controls</div>
                <div className="controls-panel">
                  <div className="controls-row">
                    <div className="controls-label">Move</div>
                    <div className="controls-value">
                      <span className="keycap">W</span>
                      <span className="keycap">A</span>
                      <span className="keycap">S</span>
                      <span className="keycap">D</span>
                      <span className="controls-or">or</span>
                      <span className="keycap">↑</span>
                      <span className="keycap">←</span>
                      <span className="keycap">↓</span>
                      <span className="keycap">→</span>
                    </div>
                  </div>
                  <div className="controls-row">
                    <div className="controls-label">Spike</div>
                    <div className="controls-value">
                      <span className="keycap">Space</span>
                      <span className="controls-or">or</span>
                      <span className="keycap">E</span>
                      <span className="controls-note">stuns chaser for 5s</span>
                    </div>
                  </div>
                  <div className="controls-row">
                    <div className="controls-label">Bomb</div>
                    <div className="controls-value">
                      <span className="keycap">B</span>
                      <span className="controls-note">blasts walls (radius 8)</span>
                    </div>
                  </div>
                  <div className="controls-row">
                    <div className="controls-label">Restart</div>
                    <div className="controls-value">
                      <span className="keycap">R</span>
                    </div>
                  </div>
                  <div className="controls-row">
                    <div className="controls-label">Pause</div>
                    <div className="controls-value">
                      <span className="keycap">Esc</span>
                    </div>
                  </div>
                  <div className="controls-row">
                    <div className="controls-label">Arrows</div>
                    <div className="controls-value">
                      Wall throwers fire every <span className="keycap">3s</span> down straight corridors.
                    </div>
                  </div>
                  <div className="controls-divider" />
                  <div className="controls-blurb">
                    Collect all <span className="keycap">10</span> artifacts to win. Avoid traps and
                    hunters. Artifacts may trigger boosters, traps, or temporary fog.
                  </div>
                </div>
                <div className="menu-options">
                  <button className="menu-button" onClick={() => goToScreen("menu")}>
                    Back
                  </button>
                  <button className="menu-button primary" onClick={startNewGame}>
                    Start
                  </button>
                </div>
                <div className="menu-hint">
                  Press <span className="keycap">Esc</span> to go back
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  function updateState(state: GameState, dt: number, now: number) {
    const prevPlayerCell = { x: state.lastPlayerCell.x, y: state.lastPlayerCell.y };
    const move = getInputDir();
    const playerSpeed = PLAYER_SPEED * dt;
    const nextPlayer = tryMove(state.grid, state.player, move, playerSpeed);
    state.player = nextPlayer;

    const playerCell = {
      x: Math.floor(state.player.x),
      y: Math.floor(state.player.y),
    };
    const pKey = cellKey(playerCell.x, playerCell.y);
    const prevKey = cellKey(prevPlayerCell.x, prevPlayerCell.y);
    const enteredNewCell = pKey !== prevKey;
    state.lastPlayerCell = { x: playerCell.x, y: playerCell.y };
    if (state.coins.has(pKey)) {
      state.coins.delete(pKey);
      state.coinsCollected += 1;
      setCoinsCollected(state.coinsCollected);
    }
    if (enteredNewCell) {
      // Underground traps are invisible until first stepped on; second entry kills.
      if (state.undergroundTrapsHidden.has(pKey)) {
        state.undergroundTrapsHidden.delete(pKey);
        state.undergroundTrapsRevealed.add(pKey);
        state.undergroundTrapRevealMs.set(pKey, now);
      } else if (state.undergroundTrapsRevealed.has(pKey)) {
        state.status = "lose";
        state.loseReason = "trap";
        setLoseReason("trap");
        return;
      }
    }
    if (state.traps.has(pKey)) {
      state.status = "lose";
      state.loseReason = "trap";
      setLoseReason("trap");
      return;
    }

    // Arrow throwers + arrows
    const arrowSpeed = PLAYER_SPEED * 1.5;
    if (state.arrowThrowers.length > 0) {
      for (const t of state.arrowThrowers) {
        if (state.grid[t.y][t.x] !== 1) continue;
        if (now < t.nextFireMs) continue;
        t.nextFireMs = now + t.periodMs;
        const sx = t.x + t.dir.x;
        const sy = t.y + t.dir.y;
        if (!inBounds(sx, sy)) continue;
        if (state.grid[sy][sx] !== 0) continue;
        state.arrows.push({
          pos: { x: sx + 0.5, y: sy + 0.5 },
          dir: t.dir,
          speed: arrowSpeed,
        });
      }
      state.arrowThrowers = state.arrowThrowers.filter((t) => state.grid[t.y][t.x] === 1);
    }
    if (state.arrows.length > 0) {
      const nextArrows: Arrow[] = [];
      for (const a of state.arrows) {
        const nextPos = {
          x: a.pos.x + a.dir.x * a.speed * dt,
          y: a.pos.y + a.dir.y * a.speed * dt,
        };
        const ax = Math.floor(nextPos.x);
        const ay = Math.floor(nextPos.y);
        if (!inBounds(ax, ay)) continue;
        if (state.grid[ay][ax] === 1) continue; // hit first wall
        if (distance(nextPos, state.player) < 0.42) {
          state.status = "lose";
          state.loseReason = "arrow";
          setLoseReason("arrow");
          return;
        }
        nextArrows.push({ ...a, pos: nextPos });
      }
      state.arrows = nextArrows;
    }

    if (state.items.has(pKey)) {
      const collectedAfter = ITEMS_TARGET - (state.items.size - 1);
      state.items.delete(pKey);
      if (Math.random() < 0.5) {
        state.bombsLeft = Math.min(3, state.bombsLeft + 1);
        setBombsLeft(state.bombsLeft);
      }
      if (state.items.size === 0) {
        state.status = "win";
      } else {
        triggerArtifactEffect(state, now, playerCell);
      }

      if (!state.helpersSpawned && collectedAfter >= 5 && state.status === "playing") {
        spawnHelpers(state, playerCell);
        state.helpersSpawned = true;
      }
    }

    state.explosions = state.explosions.filter((e) => now - e.start < 600);
    state.fogAreas = state.fogAreas.filter((a) => now < a.end);
    // Smooth "inside fog area" factor to avoid flicker at boundaries / while walking.
    if (state.fogAreas.length === 0) {
      state.fogAreaInside.clear();
    } else {
      const alive = new Set<number>();
      for (const area of state.fogAreas) alive.add(area.id);
      for (const id of Array.from(state.fogAreaInside.keys())) {
        if (!alive.has(id)) state.fogAreaInside.delete(id);
      }
      const k = 1 - Math.exp(-dt / 0.45);
      for (const area of state.fogAreas) {
        const target = isPlayerInsideFogArea(area, playerCell) ? 1 : 0;
        const current = state.fogAreaInside.get(area.id) ?? 0;
        state.fogAreaInside.set(area.id, current + (target - current) * k);
      }
    }

    let monsterCell = {
      x: Math.floor(state.monster.x),
      y: Math.floor(state.monster.y),
    };
    const monsterKey = cellKey(monsterCell.x, monsterCell.y);
    if (state.spikes.has(monsterKey)) {
      state.spikes.delete(monsterKey);
      state.stunUntil = now + 5000;
    }
    if (state.boosters.has(monsterKey)) {
      state.boosters.delete(monsterKey);
      state.boostUntil = Math.max(state.boostUntil, now + CHASER_BOOST_MS);
    }

    if (now >= state.stunUntil) {
      const chaserSpeed =
        PLAYER_SPEED *
        dt *
        (now < state.boostUntil ? CHASER_BOOST_MULT : 1);
      const atCenter = isAtCellCenter(state.monster);

      // Pick a new direction only at tile centers, and then commit to moving to the
      // next tile center. This avoids jitter/oscillation from mid-tile retargeting.
      if (atCenter && !state.monsterTarget) {
        let desired = bfsNextStep(state.grid, monsterCell, playerCell);
        if (desired.x === 0 && desired.y === 0) {
          desired = bestNeighborStep(state.grid, monsterCell, playerCell);
        }

        const neighborCount = countOpenNeighbors(state.grid, monsterCell);
        const canReverse = neighborCount <= 1;
        let nextDir = desired;
        if (isOpposite(desired, state.monsterDir) && !canReverse) {
          nextDir = bestNeighborStepAvoid(
            state.grid,
            monsterCell,
            playerCell,
            desired
          );
        }

        state.monsterDir = nextDir;
        const targetCell = {
          x: monsterCell.x + nextDir.x,
          y: monsterCell.y + nextDir.y,
        };
        if (
          inBounds(targetCell.x, targetCell.y) &&
          state.grid[targetCell.y][targetCell.x] === 0
        ) {
          state.monsterTarget = {
            x: targetCell.x + 0.5,
            y: targetCell.y + 0.5,
          };
        }

        state.lastPathTime = now;
        state.lastMonsterCell = { x: monsterCell.x, y: monsterCell.y };
      }

      if (state.monsterTarget) {
        const toTarget = {
          x: state.monsterTarget.x - state.monster.x,
          y: state.monsterTarget.y - state.monster.y,
        };
        const dist = Math.hypot(toTarget.x, toTarget.y);
        if (dist <= chaserSpeed) {
          state.monster = { ...state.monsterTarget };
          state.monsterTarget = null;
        } else {
          state.monster = {
            x: state.monster.x + (toTarget.x / dist) * chaserSpeed,
            y: state.monster.y + (toTarget.y / dist) * chaserSpeed,
          };
        }
      }
    }

    if (distance(state.player, state.monster) < 0.45) {
      state.status = "lose";
      state.loseReason = "caught";
      setLoseReason("caught");
    }

    // Update helper chasers
    if (state.status === "playing" && state.helpers.length > 0) {
      updateHelpers(state, dt, now);
    }
  }

  function getInputDir(): Vec {
    let dx = 0;
    let dy = 0;
    keysRef.current.forEach((key) => {
      const dir = keyToDir[key];
      if (dir) {
        dx += dir.x;
        dy += dir.y;
      }
    });
    if (dx !== 0 && dy !== 0) {
      const inv = 1 / Math.sqrt(2);
      return { x: dx * inv, y: dy * inv };
    }
    return { x: dx, y: dy };
  }

  function isAtCellCenter(pos: Vec) {
    const fx = Math.abs(pos.x - Math.floor(pos.x) - 0.5);
    const fy = Math.abs(pos.y - Math.floor(pos.y) - 0.5);
    return fx < 0.08 && fy < 0.08;
  }

  function isOpposite(a: Vec, b: Vec) {
    return a.x === -b.x && a.y === -b.y && (a.x !== 0 || a.y !== 0);
  }

  function tryMove(grid: Cell[][], pos: Vec, dir: Vec, speed: number): Vec {
    if (dir.x === 0 && dir.y === 0) return pos;
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
      const maxNudge = Math.min(TURN_ASSIST_TILES, Math.max(speed, 0.01));
      const nudgedY = nudgeToward(pos.y, tileCenter(pos.y), maxNudge);
      const movedXNudged = { x: next.x, y: nudgedY };
      if (!isBlocked(grid, movedXNudged)) pos = movedXNudged;
    }
    const movedY = { x: pos.x, y: next.y };
    if (!isBlocked(grid, movedY)) {
      pos = movedY;
    } else if (dir.y !== 0) {
      const maxNudge = Math.min(TURN_ASSIST_TILES, Math.max(speed, 0.01));
      const nudgedX = nudgeToward(pos.x, tileCenter(pos.x), maxNudge);
      const movedYNudged = { x: nudgedX, y: next.y };
      if (!isBlocked(grid, movedYNudged)) pos = movedYNudged;
    }
    return pos;
  }

  function isBlocked(grid: Cell[][], pos: Vec) {
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

  function draw(ctx: CanvasRenderingContext2D, state: GameState) {
    const now = performance.now();
    maybeUpdateHudOpacity(now, state);
    const dpr = dprRef.current;
    const cssW = ctx.canvas.width / dpr;
    const cssH = ctx.canvas.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.setTransform(dpr * CAMERA_ZOOM, 0, 0, dpr * CAMERA_ZOOM, 0, 0);
    const viewW = cssW / CAMERA_ZOOM;
    const viewH = cssH / CAMERA_ZOOM;
    ctx.fillStyle = "#0a0c12";
    ctx.fillRect(0, 0, viewW, viewH);

    const worldW = GRID_W * TILE_SIZE;
    const worldH = GRID_H * TILE_SIZE;
    const cam = getCamera(state.player, viewW, viewH, worldW, worldH);
    const camX = cam.x;
    const camY = cam.y;

    const startX = Math.max(0, Math.floor(camX / TILE_SIZE) - 2);
    const startY = Math.max(0, Math.floor(camY / TILE_SIZE) - 2);
    const endX = Math.min(
      GRID_W - 1,
      Math.floor((camX + viewW) / TILE_SIZE) + 2
    );
    const endY = Math.min(
      GRID_H - 1,
      Math.floor((camY + viewH) / TILE_SIZE) + 2
    );

    for (let y = startY; y <= endY; y += 1) {
      for (let x = startX; x <= endX; x += 1) {
        ctx.fillStyle = state.grid[y][x] === 1 ? "#1f1f2b" : "#0f3b2e";
        ctx.fillRect(
          x * TILE_SIZE - camX,
          y * TILE_SIZE - camY,
          TILE_SIZE,
          TILE_SIZE
        );
      }
    }

    // Arrow throwers (embedded in walls).
    state.arrowThrowers.forEach((t) => {
      if (t.x < startX || t.x > endX || t.y < startY || t.y > endY) return;
      if (state.grid[t.y][t.x] !== 1) return;
      const px = t.x * TILE_SIZE - camX;
      const py = t.y * TILE_SIZE - camY;
      const cx = px + TILE_SIZE / 2;
      const cy = py + TILE_SIZE / 2;
      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      ctx.fillStyle = "#7a8396";
      if (t.dir.x === 1) {
        ctx.fillRect(px + 4, cy - 1, TILE_SIZE - 9, 2);
        ctx.beginPath();
        ctx.moveTo(px + TILE_SIZE - 2, cy);
        ctx.lineTo(px + TILE_SIZE - 7, cy - 3);
        ctx.lineTo(px + TILE_SIZE - 7, cy + 3);
        ctx.closePath();
        ctx.fill();
      } else if (t.dir.x === -1) {
        ctx.fillRect(px + 5, cy - 1, TILE_SIZE - 9, 2);
        ctx.beginPath();
        ctx.moveTo(px + 2, cy);
        ctx.lineTo(px + 7, cy - 3);
        ctx.lineTo(px + 7, cy + 3);
        ctx.closePath();
        ctx.fill();
      } else if (t.dir.y === 1) {
        ctx.fillRect(cx - 1, py + 4, 2, TILE_SIZE - 9);
        ctx.beginPath();
        ctx.moveTo(cx, py + TILE_SIZE - 2);
        ctx.lineTo(cx - 3, py + TILE_SIZE - 7);
        ctx.lineTo(cx + 3, py + TILE_SIZE - 7);
        ctx.closePath();
        ctx.fill();
      } else {
        ctx.fillRect(cx - 1, py + 5, 2, TILE_SIZE - 9);
        ctx.beginPath();
        ctx.moveTo(cx, py + 2);
        ctx.lineTo(cx - 3, py + 7);
        ctx.lineTo(cx + 3, py + 7);
        ctx.closePath();
        ctx.fill();
      }
    });

    const playerScreenX = state.player.x * TILE_SIZE - camX;
    const playerScreenY = state.player.y * TILE_SIZE - camY;
    const playerCell = { x: Math.floor(state.player.x), y: Math.floor(state.player.y) };

    // Coins
    state.coins.forEach((key) => {
      const [x, y] = key.split(",").map(Number);
      if (x < startX || x > endX || y < startY || y > endY) return;
      const cx = x * TILE_SIZE + TILE_SIZE / 2 - camX;
      const cy = y * TILE_SIZE + TILE_SIZE / 2 - camY;
      ctx.fillStyle = "#ffd65c";
      ctx.beginPath();
      ctx.ellipse(cx, cy, 3.2, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.beginPath();
      ctx.ellipse(cx + 0.6, cy + 0.4, 1.6, 1.9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.22)";
      ctx.fillRect(cx - 1, cy - 2, 1, 1);
    });

    // Artifacts with glow
    state.items.forEach((key) => {
      const [x, y] = key.split(",").map(Number);
      const itemCenterX = x * TILE_SIZE + TILE_SIZE / 2;
      const itemCenterY = y * TILE_SIZE + TILE_SIZE / 2;
      const sx = itemCenterX - camX;
      const sy = itemCenterY - camY;
      const onScreen =
        sx >= 0 && sx <= viewW && sy >= 0 && sy <= viewH;
      if (onScreen) {
        const pulse = 0.5 + 0.5 * Math.sin(now / 180 + (x * 0.7 + y * 0.4));
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(255, 220, 120, ${0.10 + pulse * 0.18})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 12 + pulse * 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + pulse * 0.08})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 7 + pulse * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = "#f6c945";
        ctx.fillRect(
          x * TILE_SIZE - camX + 2,
          y * TILE_SIZE - camY + 2,
          TILE_SIZE - 4,
          TILE_SIZE - 4
        );
        ctx.fillStyle = `rgba(255,255,255,${0.08 + pulse * 0.14})`;
        ctx.fillRect(x * TILE_SIZE - camX + 4, y * TILE_SIZE - camY + 4, 2, 1);
      } else {
        drawArtifactIndicator(
          ctx,
          playerScreenX,
          playerScreenY,
          sx,
          sy,
          viewW,
          viewH,
          now
        );
      }
    });

    state.boosters.forEach((key) => {
      const [x, y] = key.split(",").map(Number);
      if (x < startX || x > endX || y < startY || y > endY) return;
      const bob = Math.sin(now / 220 + (x + y) * 0.3) * 1.2;
      const px = x * TILE_SIZE - camX;
      const py = y * TILE_SIZE - camY + bob;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = "rgba(80, 255, 140, 0.35)";
      ctx.beginPath();
      ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = "#22d36a";
      ctx.fillRect(px + 3, py + 4, 4, 5);
      ctx.fillRect(px + 2, py + 7, 6, 2);
      ctx.fillStyle = "#b7ffd4";
      ctx.fillRect(px + 4, py + 5, 1, 2);

      const bubble = 0.5 + 0.5 * Math.sin(now / 140 + x * 0.7);
      ctx.fillStyle = `rgba(200,255,230,${0.15 + bubble * 0.25})`;
      ctx.fillRect(px + 7, py + 4, 1, 1);
      ctx.fillRect(px + 6, py + 6, 1, 1);
    });

    state.traps.forEach((key) => {
      const [x, y] = key.split(",").map(Number);
      if (x < startX || x > endX || y < startY || y > endY) return;
      const px = x * TILE_SIZE - camX;
      const py = y * TILE_SIZE - camY;
      const blink = Math.sin(now / 90 + (x - y) * 0.4) > 0;
      ctx.fillStyle = blink ? "#ff3b3b" : "#a01616";
      ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);
      ctx.fillStyle = blink ? "#ffd1d1" : "#ff7a7a";
      ctx.fillRect(px + 4, py + 4, 1, 1);
      ctx.fillRect(px + 6, py + 6, 1, 1);
      ctx.fillRect(px + 5, py + 7, 2, 1);
    });

    // Revealed underground spike traps (kill on second entry).
    state.undergroundTrapsRevealed.forEach((key) => {
      const [x, y] = key.split(",").map(Number);
      if (x < startX || x > endX || y < startY || y > endY) return;
      const px = x * TILE_SIZE - camX;
      const py = y * TILE_SIZE - camY;
      const openedAt = state.undergroundTrapRevealMs.get(key) ?? 0;
      const age = Math.max(0, now - openedAt);
      const pop = 1 - Math.exp(-age / 180);
      const bob = (1 - pop) * 6;

      ctx.fillStyle = "#c9d2ff";
      ctx.beginPath();
      ctx.moveTo(px + TILE_SIZE / 2, py + 3 + bob);
      ctx.lineTo(px + 9, py + TILE_SIZE - 3);
      ctx.lineTo(px + 3, py + TILE_SIZE - 3);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#5c6a8a";
      ctx.fillRect(px + 3, py + TILE_SIZE - 4, TILE_SIZE - 6, 2);
    });

    state.explosions.forEach((explosion) => {
      const age = now - explosion.start;
      const t = Math.min(age / 600, 1);
      const radius = (t * (BOMB_RADIUS_TILES + 1) + 0.4) * TILE_SIZE;
      const cx = explosion.x * TILE_SIZE - camX;
      const cy = explosion.y * TILE_SIZE - camY;
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(255, ${140 + t * 80}, 70, ${0.5 - t * 0.5})`;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    const pulse = 0.5 + 0.5 * Math.sin(now / 160);
    state.spikes.forEach((key) => {
      const [x, y] = key.split(",").map(Number);
      if (x < startX || x > endX || y < startY || y > endY) return;
      const inset = 2 + pulse * 2;
      ctx.fillStyle = `rgb(180, ${80 + pulse * 80}, 255)`;
      ctx.fillRect(
        x * TILE_SIZE - camX + inset,
        y * TILE_SIZE - camY + inset,
        TILE_SIZE - inset * 2,
        TILE_SIZE - inset * 2
      );
    });

    // Fog areas: world-anchored clouds that occlude maze/items but keep actors visible.
    drawFogAreas(ctx, now, state, camX, camY, viewW, viewH, playerCell);

    // Flying arrows (draw after fog so they're readable).
    if (state.arrows.length > 0) {
      ctx.save();
      ctx.fillStyle = "#a7adb8";
      for (const a of state.arrows) {
        const ax = a.pos.x * TILE_SIZE - camX;
        const ay = a.pos.y * TILE_SIZE - camY;
        if (ax < -20 || ay < -20 || ax > viewW + 20 || ay > viewH + 20) continue;
        let rot = 0;
        if (a.dir.x === 1) rot = 0;
        else if (a.dir.x === -1) rot = Math.PI;
        else if (a.dir.y === 1) rot = Math.PI / 2;
        else rot = -Math.PI / 2;
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(rot);
        ctx.fillRect(-6, -1, 9, 2);
        ctx.beginPath();
        ctx.moveTo(5, 0);
        ctx.lineTo(0, -3);
        ctx.lineTo(0, 3);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    state.helpers.forEach((helper) => {
      const px = helper.pos.x * TILE_SIZE - camX - TILE_SIZE / 2;
      const py = helper.pos.y * TILE_SIZE - camY - TILE_SIZE / 2;
      const bob = Math.sin(now / 180 + helper.id * 0.01) * 1.2;
      const blink = Math.sin(now / 90 + helper.id) > 0;

      if (now < helper.boostUntil) {
        const glow = 0.25 + 0.2 * Math.sin(now / 70);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(80,255,140,${glow})`;
        ctx.beginPath();
        ctx.arc(helper.pos.x * TILE_SIZE - camX, helper.pos.y * TILE_SIZE - camY, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      ctx.fillStyle = blink ? "#d56bff" : "#8f2ad9";
      ctx.fillRect(px + 2, py + 2 + bob, TILE_SIZE - 4, TILE_SIZE - 4);
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fillRect(px + 3, py + 3 + bob, TILE_SIZE - 6, TILE_SIZE - 6);
      ctx.fillStyle = "#e9d6ff";
      ctx.fillRect(px + 4, py + 4 + bob, 2, 1);
      ctx.fillRect(px + 6, py + 4 + bob, 2, 1);
    });

    ctx.fillStyle = "#59d9ff";
    ctx.fillRect(
      state.player.x * TILE_SIZE - camX - TILE_SIZE / 2 + 1,
      state.player.y * TILE_SIZE - camY - TILE_SIZE / 2 + 1,
      TILE_SIZE - 2,
      TILE_SIZE - 2
    );

    const stunned = now < state.stunUntil;
    if (stunned) {
      const flicker = Math.sin(now / 60) > 0;
      ctx.fillStyle = flicker ? "#ff4e4e" : "#ffd166";
    } else {
      ctx.fillStyle = "#ff4e4e";
    }
    if (now < state.boostUntil) {
      const glow = 0.35 + 0.25 * Math.sin(now / 80);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(80,255,140,${glow})`;
      ctx.beginPath();
      ctx.arc(
        state.monster.x * TILE_SIZE - camX,
        state.monster.y * TILE_SIZE - camY,
        9,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.restore();
    }
    ctx.fillRect(
      state.monster.x * TILE_SIZE - camX - TILE_SIZE / 2 + 1,
      state.monster.y * TILE_SIZE - camY - TILE_SIZE / 2 + 1,
      TILE_SIZE - 2,
      TILE_SIZE - 2
    );

    if (now < state.fogUntil) {
      drawFog(
        ctx,
        now,
        state.player.x * TILE_SIZE - camX,
        state.player.y * TILE_SIZE - camY,
        state.fogStart,
        state.fogUntil,
        viewW,
        viewH
      );
    }
  }

  function maybeUpdateHudOpacity(now: number, state: GameState) {
    const hudTopEl = hudTopRef.current;
    const invEl = inventoryRef.current;
    if (!hudTopEl || !invEl) return;

    const cache = hudRectsRef.current;
    if (now - cache.lastUpdate > 250) {
      cache.hudTop = hudTopEl.getBoundingClientRect();
      cache.inventory = invEl.getBoundingClientRect();
      cache.lastUpdate = now;
    }
    if (!cache.hudTop || !cache.inventory) return;

    const dpr = dprRef.current;
    const cssW = (canvasRef.current?.width ?? 0) / dpr;
    const cssH = (canvasRef.current?.height ?? 0) / dpr;
    const viewW = cssW / CAMERA_ZOOM;
    const viewH = cssH / CAMERA_ZOOM;
    const worldW = GRID_W * TILE_SIZE;
    const worldH = GRID_H * TILE_SIZE;
    const cam = getCamera(state.player, viewW, viewH, worldW, worldH);

    const playerViewX = state.player.x * TILE_SIZE - cam.x;
    const playerViewY = state.player.y * TILE_SIZE - cam.y;
    const playerCssX = playerViewX * CAMERA_ZOOM;
    const playerCssY = playerViewY * CAMERA_ZOOM;

    const pad = 10;
    const underHud =
      playerCssX >= cache.hudTop.left - pad &&
      playerCssX <= cache.hudTop.right + pad &&
      playerCssY >= cache.hudTop.top - pad &&
      playerCssY <= cache.hudTop.bottom + pad;
    const underInv =
      playerCssX >= cache.inventory.left - pad &&
      playerCssX <= cache.inventory.right + pad &&
      playerCssY >= cache.inventory.top - pad &&
      playerCssY <= cache.inventory.bottom + pad;

    hudTopEl.classList.toggle("occluded", underHud);
    invEl.classList.toggle("occluded", underInv);
  }

  function drawArtifactIndicator(
    ctx: CanvasRenderingContext2D,
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    viewW: number,
    viewH: number,
    now: number
  ) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const len = Math.hypot(dx, dy);
    if (len < 0.001) return;
    const ux = dx / len;
    const uy = dy / len;

    const margin = 18;
    const left = margin;
    const right = viewW - margin;
    const top = margin;
    const bottom = viewH - margin;

    // Ray from player to direction; find intersection with the inner viewport rectangle.
    let t = Number.POSITIVE_INFINITY;
    if (ux > 0) t = Math.min(t, (right - fromX) / ux);
    if (ux < 0) t = Math.min(t, (left - fromX) / ux);
    if (uy > 0) t = Math.min(t, (bottom - fromY) / uy);
    if (uy < 0) t = Math.min(t, (top - fromY) / uy);
    if (!Number.isFinite(t)) return;

    const px = fromX + ux * t;
    const py = fromY + uy * t;

    const pulse = 0.75 + 0.25 * Math.sin(now / 150 + (ux + uy) * 2);
    const size = 7.5 + pulse * 3.5;
    const angle = Math.atan2(uy, ux);

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle);
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(246, 201, 69, ${0.55 + pulse * 0.25})`;
    ctx.beginPath();
    ctx.moveTo(size, 0);
    ctx.lineTo(-size * 0.7, size * 0.55);
    ctx.lineTo(-size * 0.7, -size * 0.55);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.10)";
    ctx.beginPath();
    ctx.moveTo(size * 0.55, 0);
    ctx.lineTo(-size * 0.35, size * 0.35);
    ctx.lineTo(-size * 0.35, -size * 0.35);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawFogAreas(
    ctx: CanvasRenderingContext2D,
    nowMs: number,
    state: GameState,
    camX: number,
    camY: number,
    viewW: number,
    viewH: number,
    playerCell: Vec
  ) {
    if (state.fogAreas.length === 0) return;

    ensureFogSprites();
    const sprites = fogSpritesRef.current;
    if (!sprites || sprites.length === 0) return;

    const viewLeft = camX;
    const viewTop = camY;
    const viewRight = camX + viewW;
    const viewBottom = camY + viewH;
    const t = nowMs / 1000;
    const playerPacked = packCell(playerCell.x, playerCell.y);
    for (const area of state.fogAreas) {
      const fadeIn = clamp01((nowMs - area.start) / FOG_AREA_FADE_MS);
      const fadeOut = clamp01((area.end - nowMs) / FOG_AREA_FADE_MS);
      const fade = Math.min(fadeIn, fadeOut);
      if (fade <= 0) continue;
      const eased = fade * fade * (3 - 2 * fade);

      if (
        area.bounds.maxX < viewLeft ||
        area.bounds.maxY < viewTop ||
        area.bounds.minX > viewRight ||
        area.bounds.minY > viewBottom
      ) {
        continue;
      }

      const insideLerp = state.fogAreaInside.get(area.id) ?? (area.cellSet.has(playerPacked) ? 1 : 0);
      const insideBoost = 1 + 0.1 * insideLerp;
      const intensity = eased * insideBoost;

      ctx.save();
      // Clip path is stored in world px coords; translate to view for clipping.
      ctx.translate(-camX, -camY);
      ctx.clip(area.clipPath);
      ctx.translate(camX, camY);

      for (const cloud of area.clouds) {
        const ox = Math.sin(t * cloud.fx + cloud.phaseX) * cloud.amp;
        const oy = Math.cos(t * cloud.fy + cloud.phaseY) * cloud.amp;
        const x = cloud.x - camX + ox;
        const y = cloud.y - camY + oy;
        const half = cloud.size * 0.5;

        if (x + half < 0 || y + half < 0 || x - half > viewW || y - half > viewH) continue;

        ctx.globalAlpha = clamp01(cloud.alpha * intensity);
        const sprite = sprites[cloud.shade] ?? sprites[0];
        ctx.drawImage(sprite, x - half, y - half, cloud.size, cloud.size);
      }

      ctx.restore();
    }
  }

  function ensureFogSprites() {
    if (fogSpritesRef.current) return;
    const makeSprite = (seed: number, base: RGB, hi: RGB, lo: RGB) => {
      const c = document.createElement("canvas");
      const size = 96;
      c.width = size;
      c.height = size;
      const g = c.getContext("2d");
      if (!g) return c;
      g.imageSmoothingEnabled = false;
      const cx = size / 2;
      const cy = size / 2;
      const rng = mulberry32(seed);
      const s = 62 + rng() * 8;

      drawCloudBlob(g, cx, cy, s, 1, base);
      drawCloudBlob(g, cx + 6, cy - 2, s * 0.82, 0.85, hi);
      drawCloudBlob(g, cx - 6, cy + 4, s * 0.9, 0.75, lo);
      return c;
    };

    const sprites = [
      makeSprite(911, { r: 96, g: 102, b: 112 }, { r: 132, g: 138, b: 152 }, { r: 72, g: 76, b: 84 }),
      makeSprite(1337, { r: 114, g: 120, b: 132 }, { r: 150, g: 156, b: 170 }, { r: 86, g: 90, b: 100 }),
      makeSprite(2027, { r: 132, g: 138, b: 152 }, { r: 170, g: 176, b: 192 }, { r: 96, g: 102, b: 112 }),
    ];

    fogSpritesRef.current = sprites;
  }

  function buildFogAreaClip(anchors: { x: number; y: number; r: number }[], areaId: number) {
    const path = new Path2D();
    const bounds: FogBounds = {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    };

    const bumpBounds = (cx: number, cy: number, rad: number) => {
      bounds.minX = Math.min(bounds.minX, cx - rad);
      bounds.minY = Math.min(bounds.minY, cy - rad);
      bounds.maxX = Math.max(bounds.maxX, cx + rad);
      bounds.maxY = Math.max(bounds.maxY, cy + rad);
    };

    for (let i = 0; i < anchors.length; i += 1) {
      const a = anchors[i];
      const seed = ((areaId * 1009) ^ i) >>> 0;
      const rng = mulberry32(seed);
      const x = a.x * TILE_SIZE;
      const y = a.y * TILE_SIZE;
      const r = a.r * TILE_SIZE;

      const cx = x + (rng() * 2 - 1) * r * 0.1;
      const cy = y + (rng() * 2 - 1) * r * 0.1;
      const rx0 = r * (0.72 + rng() * 0.32);
      const ry0 = r * (0.42 + rng() * 0.46);
      const rot0 = (rng() * 2 - 1) * 0.75;
      path.moveTo(cx + rx0, cy);
      path.ellipse(cx, cy, rx0, ry0, rot0, 0, Math.PI * 2);
      bumpBounds(cx, cy, Math.max(rx0, ry0));

      const lobes = 2 + Math.floor(rng() * 2);
      for (let j = 0; j < lobes; j += 1) {
        const ang = rng() * Math.PI * 2;
        const off = (0.18 + 0.6 * rng()) * r;
        const lx = x + Math.cos(ang) * off + (rng() * 2 - 1) * r * 0.08;
        const ly = y + Math.sin(ang) * off + (rng() * 2 - 1) * r * 0.08;
        const rx = r * (0.24 + 0.44 * rng());
        const ry = rx * (0.55 + 0.7 * rng());
        const rot = (rng() * 2 - 1) * 0.9;
        path.moveTo(lx + rx, ly);
        path.ellipse(lx, ly, rx, ry, rot, 0, Math.PI * 2);
        bumpBounds(lx, ly, Math.max(rx, ry));
      }
    }

    const pad = TILE_SIZE * 8;
    bounds.minX -= pad;
    bounds.minY -= pad;
    bounds.maxX += pad;
    bounds.maxY += pad;
    return { path, bounds };
  }

  function buildFogAreaClouds(areaId: number, anchors: { x: number; y: number; r: number }[], cellCount: number) {
    const rng = mulberry32(((areaId * 2654435761) ^ 0x3c6ef372) >>> 0);
    const count = clampInt(Math.floor(16 + cellCount / 40 + anchors.length * 0.55), 18, 34);
    const clouds: FogCloud[] = [];
    for (let i = 0; i < count; i += 1) {
      const anchor = anchors[Math.floor(rng() * anchors.length)];
      const ang = rng() * Math.PI * 2;
      const rad = (0.12 + rng() * 0.88) * anchor.r * TILE_SIZE;
      const x = anchor.x * TILE_SIZE + Math.cos(ang) * rad;
      const y = anchor.y * TILE_SIZE + Math.sin(ang) * rad;
      const size = 58 + rng() * 92;
      const alpha = 0.55 + rng() * 0.35;
      const shadePick = rng();
      const shade: 0 | 1 | 2 = shadePick < 0.65 ? 0 : shadePick < 0.9 ? 1 : 2;
      clouds.push({
        x,
        y,
        size,
        alpha,
        shade,
        amp: (0.1 + rng() * 0.4) * TILE_SIZE,
        fx: 0.22 + rng() * 0.25,
        fy: 0.18 + rng() * 0.25,
        phaseX: rng() * Math.PI * 2,
        phaseY: rng() * Math.PI * 2,
      });
    }
    return clouds;
  }

  function isPlayerInsideFogArea(area: FogArea, playerCell: Vec) {
    // Treat "inside" as any of the 3x3 neighborhood to reduce boundary flicker.
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        const x = playerCell.x + dx;
        const y = playerCell.y + dy;
        if (!inBounds(x, y)) continue;
        if (area.cellSet.has(packCell(x, y))) return true;
      }
    }
    return false;
  }

  function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v));
  }

  function getCamera(player: Vec, viewW: number, viewH: number, worldW: number, worldH: number) {
    let x = player.x * TILE_SIZE - viewW / 2;
    let y = player.y * TILE_SIZE - viewH / 2;
    if (worldW <= viewW) x = (worldW - viewW) / 2;
    else x = clamp(x, 0, worldW - viewW);
    if (worldH <= viewH) y = (worldH - viewH) / 2;
    else y = clamp(y, 0, worldH - viewH);
    return { x, y };
  }

  function placeSpike() {
    const state = stateRef.current;
    if (state.status !== "playing") return;
    if (state.spikesLeft <= 0) return;
    const cell = {
      x: Math.floor(state.player.x),
      y: Math.floor(state.player.y),
    };
    const key = cellKey(cell.x, cell.y);
    if (state.grid[cell.y][cell.x] === 1) return;
    if (state.items.has(key)) return;
    if (state.spikes.has(key)) return;
    state.spikes.add(key);
    state.spikesLeft -= 1;
    setSpikesLeft(state.spikesLeft);
  }

  function placeBomb() {
    const state = stateRef.current;
    if (state.status !== "playing") return;
    if (state.bombsLeft <= 0) return;
    const cell = {
      x: Math.floor(state.player.x),
      y: Math.floor(state.player.y),
    };
    if (!inBounds(cell.x, cell.y)) return;
    if (state.grid[cell.y][cell.x] === 1) return;
    blowUp(state.grid, cell.x, cell.y);
    // If a bomb breaks the wall containing an arrow thrower, it is destroyed.
    state.arrowThrowers = state.arrowThrowers.filter((t) => state.grid[t.y][t.x] === 1);
    // Bombs also destroy traps inside the blast.
    const blast = keysInBlast(cell.x, cell.y);
    const blastSet = new Set(blast);
    for (const k of blast) {
      state.traps.delete(k);
      state.undergroundTrapsHidden.delete(k);
      state.undergroundTrapsRevealed.delete(k);
      state.undergroundTrapRevealMs.delete(k);
    }
    state.arrows = state.arrows.filter((a) => {
      const ax = Math.floor(a.pos.x);
      const ay = Math.floor(a.pos.y);
      if (!inBounds(ax, ay)) return false;
      return state.grid[ay][ax] === 0;
    });
    state.helpers = state.helpers.filter((h) => {
      const hx = Math.floor(h.pos.x);
      const hy = Math.floor(h.pos.y);
      return !blastSet.has(cellKey(hx, hy));
    });
    state.explosions.push({
      x: cell.x + 0.5,
      y: cell.y + 0.5,
      start: performance.now(),
    });
    const monsterCell = {
      x: Math.floor(state.monster.x),
      y: Math.floor(state.monster.y),
    };
    if (
      (monsterCell.x - cell.x) * (monsterCell.x - cell.x) +
        (monsterCell.y - cell.y) * (monsterCell.y - cell.y) <=
      BOMB_RADIUS_TILES * BOMB_RADIUS_TILES
    ) {
      const now = performance.now();
      state.stunUntil = Math.max(state.stunUntil, now + 3000);
    }
    state.bombsLeft -= 1;
    setBombsLeft(state.bombsLeft);
  }

  function spawnHelpers(state: GameState, playerCell: Vec) {
    const exclude = new Set<string>();
    state.items.forEach((k) => exclude.add(k));
    state.spikes.forEach((k) => exclude.add(k));
    state.boosters.forEach((k) => exclude.add(k));
    state.traps.forEach((k) => exclude.add(k));
    state.helpers.forEach((h) => {
      exclude.add(cellKey(Math.floor(h.pos.x), Math.floor(h.pos.y)));
    });
    exclude.add(cellKey(playerCell.x, playerCell.y));
    exclude.add(cellKey(Math.floor(state.monster.x), Math.floor(state.monster.y)));
    state.helpers.forEach((h) => {
      exclude.add(cellKey(Math.floor(h.pos.x), Math.floor(h.pos.y)));
    });

    const rng = mulberry32(Math.floor(performance.now()) ^ 0x9e3779b9);

    for (let i = 0; i < HELPER_COUNT; i += 1) {
      let helperPath: Vec[] | null = null;
      let startCell: Vec | null = null;
      for (let attempt = 0; attempt < 500; attempt += 1) {
        const candidate = randomOpenCellIndexFar(
          state.grid,
          exclude,
          playerCell,
          HELPER_MIN_DIST
        );
        const path = generateHelperPath(
          state.grid,
          candidate,
          HELPER_MIN_PATH_LEN,
          rng
        );
        if (path) {
          startCell = candidate;
          helperPath = path;
          break;
        }
      }
      if (!helperPath || !startCell) continue;
      exclude.add(cellKey(startCell.x, startCell.y));

      state.helpers.push({
        id: helperIdCounter++,
        pos: cellCenter(helperPath[0]),
        path: helperPath,
        index: 0,
        dir: 1,
        target: null,
        targetIndex: null,
        boostUntil: 0,
      });
    }
  }

  function updateHelpers(state: GameState, dt: number, now: number) {
    const next: Helper[] = [];
    for (const helper of state.helpers) {
      const cell = {
        x: Math.floor(helper.pos.x),
        y: Math.floor(helper.pos.y),
      };
      const key = cellKey(cell.x, cell.y);

      if (state.traps.has(key)) {
        state.traps.delete(key);
        continue;
      }
      if (state.boosters.has(key)) {
        state.boosters.delete(key);
        helper.boostUntil = Math.max(helper.boostUntil, now + CHASER_BOOST_MS);
      }

      if (distance(state.player, helper.pos) < 0.45) {
        state.status = "lose";
        state.loseReason = "helper";
        setLoseReason("helper");
        return;
      }

      const helperSpeed =
        PLAYER_SPEED *
        dt *
        HELPER_SPEED_MULT *
        (now < helper.boostUntil ? CHASER_BOOST_MULT : 1);

      if (!helper.target) {
        let nextIndex = helper.index + helper.dir;
        if (nextIndex < 0 || nextIndex >= helper.path.length) {
          helper.dir = (helper.dir * -1) as 1 | -1;
          nextIndex = helper.index + helper.dir;
        }
        const nextCell = helper.path[nextIndex];
        helper.target = cellCenter(nextCell);
        helper.targetIndex = nextIndex;
      }

      const toTarget = {
        x: helper.target.x - helper.pos.x,
        y: helper.target.y - helper.pos.y,
      };
      const dist = Math.hypot(toTarget.x, toTarget.y);
      if (dist <= helperSpeed) {
        helper.pos = { ...helper.target };
        if (helper.targetIndex !== null) helper.index = helper.targetIndex;
        const arrivedCell = {
          x: Math.floor(helper.pos.x),
          y: Math.floor(helper.pos.y),
        };
        const arrivedKey = cellKey(arrivedCell.x, arrivedCell.y);
        if (state.traps.has(arrivedKey)) {
          state.traps.delete(arrivedKey);
          continue;
        }
        if (state.boosters.has(arrivedKey)) {
          state.boosters.delete(arrivedKey);
          helper.boostUntil = Math.max(helper.boostUntil, now + CHASER_BOOST_MS);
        }
        helper.target = null;
        helper.targetIndex = null;
      } else {
        helper.pos = {
          x: helper.pos.x + (toTarget.x / dist) * helperSpeed,
          y: helper.pos.y + (toTarget.y / dist) * helperSpeed,
        };
      }

      if (distance(state.player, helper.pos) < 0.45) {
        state.status = "lose";
        state.loseReason = "helper";
        setLoseReason("helper");
        return;
      }

      next.push(helper);
    }
    state.helpers = next;
  }

  function triggerArtifactEffect(state: GameState, now: number, playerCell: Vec) {
    const effect = Math.floor(Math.random() * 3);

    // 0: boosters for chaser, 1: traps for player, 2: fog-of-war
    if (effect === 2) {
      if (now >= state.fogUntil) {
        state.fogStart = now;
        state.fogUntil = now + FOG_DURATION_MS;
      } else {
        state.fogUntil = Math.max(state.fogUntil, now + FOG_DURATION_MS);
      }
      spawnFogAreas(state, now, playerCell);
      return;
    }

    const exclude = new Set<string>();
    state.items.forEach((k) => exclude.add(k));
    state.coins.forEach((k) => exclude.add(k));
    state.undergroundTrapsHidden.forEach((k) => exclude.add(k));
    state.undergroundTrapsRevealed.forEach((k) => exclude.add(k));
    state.spikes.forEach((k) => exclude.add(k));
    state.boosters.forEach((k) => exclude.add(k));
    state.traps.forEach((k) => exclude.add(k));
    exclude.add(cellKey(playerCell.x, playerCell.y));
    exclude.add(cellKey(Math.floor(state.monster.x), Math.floor(state.monster.y)));

    const targetSet = effect === 0 ? state.boosters : state.traps;
    for (let i = 0; i < 3; i += 1) {
      const cell = randomOpenCellIndex(state.grid, exclude);
      const key = cellKey(cell.x, cell.y);
      targetSet.add(key);
      exclude.add(key);
    }
  }

  function spawnFogAreas(state: GameState, now: number, playerCell: Vec) {
    const rng = mulberry32((Math.floor(now) ^ 0x7f4a7c15) >>> 0);
    const count = 1 + Math.floor(rng() * FOG_AREA_COUNT_MAX);

    const occupied = new Set<number>();
    for (const area of state.fogAreas) {
      for (const c of area.cells) occupied.add(c);
    }

    const minDistSq = FOG_AREA_MIN_DIST * FOG_AREA_MIN_DIST;
    const targetSizeMin = 70;
    const targetSizeMax = 190;

    for (let n = 0; n < count; n += 1) {
      const duration =
        FOG_AREA_DURATION_MIN_MS +
        rng() * (FOG_AREA_DURATION_MAX_MS - FOG_AREA_DURATION_MIN_MS);
      const start = now;
      const end = now + duration;

      // Pick a seed on an open tile, far from the player, and not overlapping existing areas.
      let seed: Vec | null = null;
      for (let attempt = 0; attempt < 2000; attempt += 1) {
        const x = 1 + Math.floor(rng() * (GRID_W - 2));
        const y = 1 + Math.floor(rng() * (GRID_H - 2));
        if (state.grid[y][x] !== 0) continue;
        const dx = x - playerCell.x;
        const dy = y - playerCell.y;
        if (dx * dx + dy * dy < minDistSq) continue;
        const packed = packCell(x, y);
        if (occupied.has(packed)) continue;
        seed = { x, y };
        break;
      }
      if (!seed) continue;

      const targetSize =
        targetSizeMin + Math.floor(rng() * (targetSizeMax - targetSizeMin));
      const cells: number[] = [];
      const cellSet = new Set<number>();
      const frontier: number[] = [];

      const seedPacked = packCell(seed.x, seed.y);
      cells.push(seedPacked);
      cellSet.add(seedPacked);
      occupied.add(seedPacked);
      frontier.push(seedPacked);

      const dirs = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 },
      ];

      while (cells.length < targetSize && frontier.length > 0) {
        const baseIdx = Math.floor(rng() * frontier.length);
        const base = unpackCell(frontier[baseIdx]);

        // Try a few random neighbor expansions; if none works, retire this frontier cell.
        let added = false;
        for (let tries = 0; tries < 6; tries += 1) {
          const d = dirs[Math.floor(rng() * dirs.length)];
          const nx = base.x + d.x;
          const ny = base.y + d.y;
          if (nx <= 0 || ny <= 0 || nx >= GRID_W - 1 || ny >= GRID_H - 1)
            continue;
          if (state.grid[ny][nx] !== 0) continue;
          const dx = nx - playerCell.x;
          const dy = ny - playerCell.y;
          if (dx * dx + dy * dy < minDistSq) continue;
          const packed = packCell(nx, ny);
          if (cellSet.has(packed) || occupied.has(packed)) continue;
          cells.push(packed);
          cellSet.add(packed);
          occupied.add(packed);
          frontier.push(packed);
          added = true;
          break;
        }
        if (!added) {
          frontier.splice(baseIdx, 1);
        }
      }

      const anchors: { x: number; y: number; r: number }[] = [];
      const anchorCount = clampInt(10 + Math.floor(rng() * 10), 10, 22);
      for (let i = 0; i < anchorCount; i += 1) {
        const packed = cells[Math.floor(rng() * cells.length)];
        const c = unpackCell(packed);
        anchors.push({
          x: c.x + 0.5,
          y: c.y + 0.5,
          r: 1.8 + rng() * 3.2,
        });
      }

      const id = fogAreaIdCounter++;
      const clip = buildFogAreaClip(anchors, id);
      const clouds = buildFogAreaClouds(id, anchors, cells.length);
      state.fogAreas.push({
        id,
        cells,
        cellSet,
        anchors,
        clipPath: clip.path,
        bounds: clip.bounds,
        clouds,
        start,
        end,
      });
    }
  }

  function drawFog(
    ctx: CanvasRenderingContext2D,
    nowMs: number,
    playerPxX: number,
    playerPxY: number,
    fogStartMs: number,
    fogUntilMs: number,
    canvasW: number,
    canvasH: number
  ) {
    const radiusPx = FOG_RADIUS_TILES * TILE_SIZE;
    ctx.save();
    const fadeInMs = 550;
    const fadeOutMs = 750;
    const tIn = fogStartMs > 0 ? (nowMs - fogStartMs) / fadeInMs : 1;
    const tOut = (fogUntilMs - nowMs) / fadeOutMs;
    const fade = clamp01(Math.min(1, Math.min(tIn, tOut)));
    const eased = fade * fade * (3 - 2 * fade); // smoothstep
    const fogAlpha = 0.88 * eased;
    const fog = `rgba(6, 8, 14, ${fogAlpha.toFixed(3)})`;

    // Fill everything EXCEPT the player's visible circle.
    ctx.fillStyle = fog;
    ctx.beginPath();
    ctx.rect(0, 0, canvasW, canvasH);
    ctx.arc(playerPxX, playerPxY, radiusPx, 0, Math.PI * 2);
    ctx.fill("evenodd");

    const t = nowMs / 1000;
    const rand = mulberry32(1337);
    const cloudCount = 22;

    // Clouds ("frog") only in the hidden region.
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, canvasW, canvasH);
    ctx.arc(playerPxX, playerPxY, Math.max(radiusPx - 6, 0), 0, Math.PI * 2);
    ctx.clip("evenodd");
    ctx.globalCompositeOperation = "lighter";
    for (let i = 0; i < cloudCount; i += 1) {
      const baseX = rand() * canvasW;
      const baseY = rand() * canvasH;
      const vx = (rand() * 2 - 1) * 10;
      const vy = (rand() * 2 - 1) * 6;
      const x = (baseX + t * vx + canvasW) % canvasW;
      const y = (baseY + t * vy + canvasH) % canvasH;
      const size = 22 + rand() * 26;
      const alpha = (0.06 + rand() * 0.08) * eased;
      drawCloudBlob(ctx, x, y, size, alpha);
    }
    ctx.restore();

    // Soft edge around the visible circle.
    const inner = Math.max(radiusPx - 22, 0);
    const outer = radiusPx + 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(playerPxX, playerPxY, outer, 0, Math.PI * 2);
    ctx.arc(playerPxX, playerPxY, inner, 0, Math.PI * 2, true);
    ctx.clip();
    const grad = ctx.createRadialGradient(playerPxX, playerPxY, inner, playerPxX, playerPxY, outer);
    grad.addColorStop(0, "rgba(6, 8, 14, 0)");
    grad.addColorStop(1, fog);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvasW, canvasH);
    ctx.restore();

    ctx.restore();
  }

  function clamp01(v: number) {
    if (v < 0) return 0;
    if (v > 1) return 1;
    return v;
  }

  function clampInt(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v | 0));
  }

  function drawCloudBlob(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    alpha: number,
    rgb: RGB = { r: 180, g: 210, b: 255 }
  ) {
    ctx.save();
    ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.45, 0, Math.PI * 2);
    ctx.arc(x + size * 0.35, y + size * 0.05, size * 0.38, 0, Math.PI * 2);
    ctx.arc(x - size * 0.35, y + size * 0.08, size * 0.34, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
