import {
  HELPER_COUNT,
  HELPER_MIN_DIST,
  HELPER_MIN_PATH_LEN,
} from "../../config/constants";
import type { GameState, Vec } from "../../model/types";
import { cellCenter, cellKey } from "../../utils/grid";
import { mulberry32 } from "../../utils/random";
import { generateHelperPath, randomOpenCellIndexFar } from "../../world/pathing";

let helperIdCounter = 1;

export function spawnHelpers(state: GameState, playerCell: Vec) {
  const exclude = new Set<string>();
  state.items.forEach((k) => exclude.add(k));
  state.spikes.forEach((k) => exclude.add(k));
  state.boosters.forEach((k) => exclude.add(k));
  state.traps.forEach((k) => exclude.add(k));
  state.helpers.forEach((h) => {
    exclude.add(cellKey(Math.floor(h.pos.x), Math.floor(h.pos.y)));
  });
  exclude.add(cellKey(playerCell.x, playerCell.y));
  state.monsters.forEach((monster) => {
    exclude.add(cellKey(Math.floor(monster.pos.x), Math.floor(monster.pos.y)));
  });
  state.hunters.forEach((hunter) => {
    exclude.add(cellKey(Math.floor(hunter.pos.x), Math.floor(hunter.pos.y)));
  });
  state.turrets.forEach((turret) => {
    exclude.add(cellKey(Math.floor(turret.pos.x), Math.floor(turret.pos.y)));
  });
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
