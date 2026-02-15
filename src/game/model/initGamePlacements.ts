import { mulberry32 } from "../utils/random";
import type { Cell } from "./types";
import { pickActorSpawnCells } from "./init/spawnActors";
import {
  placeLifeHeartsNearArtifacts,
  placeCoins,
  placeItems,
  placeUndergroundTraps,
} from "./init/spawnCollectibles";
import { placeArrowThrowers } from "./init/spawnArrowThrowers";
import type { InitialPlacements } from "./init/types";

function createRngSeed() {
  return ((Date.now() & 0xffffffff) ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

export function buildInitialPlacements(grid: Cell[][], baseNow: number): InitialPlacements {
  const taken = new Set<string>();
  const { playerCell, hunterCells } = pickActorSpawnCells(grid, taken);

  const items = placeItems(grid, taken);
  const rng = mulberry32(createRngSeed());
  const lifeHearts = placeLifeHeartsNearArtifacts(grid, taken, items, rng);
  const coins = placeCoins(grid, taken, items, rng);
  const undergroundTrapsHidden = placeUndergroundTraps(grid, taken, items, coins);
  const arrowThrowers = placeArrowThrowers(grid, rng, baseNow);

  return {
    playerCell,
    hunterCells,
    items,
    lifeHearts,
    coins,
    undergroundTrapsHidden,
    arrowThrowers,
  };
}
