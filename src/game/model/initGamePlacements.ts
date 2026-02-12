import { mulberry32 } from "../utils/random";
import type { Cell } from "./types";
import { pickPlayerAndMonsterCells } from "./init/spawnActors";
import {
  placeCoins,
  placeItems,
  placeUndergroundTraps,
} from "./init/spawnCollectibles";
import { placeArrowThrowers } from "./init/spawnArrowThrowers";
import type { InitialPlacements } from "./init/types";

function createRngSeed() {
  return ((Date.now() & 0xffffffff) ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

export function buildInitialPlacements(grid: Cell[][]): InitialPlacements {
  const taken = new Set<string>();
  const { playerCell, monsterCell } = pickPlayerAndMonsterCells(grid, taken);

  const items = placeItems(grid, taken);
  const rng = mulberry32(createRngSeed());
  const baseNow = performance.now();
  const coins = placeCoins(grid, taken, items, rng);
  const undergroundTrapsHidden = placeUndergroundTraps(grid, taken, items, coins);
  const arrowThrowers = placeArrowThrowers(grid, rng, baseNow);

  return {
    playerCell,
    monsterCell,
    items,
    coins,
    undergroundTrapsHidden,
    arrowThrowers,
  };
}
