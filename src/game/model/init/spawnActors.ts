import { randomOpenCellIndex } from "../../world/pathing";
import { cellKey } from "../../utils/grid";
import { distance } from "../../utils/math";
import type { Cell } from "../types";

export function pickPlayerAndMonsterCells(grid: Cell[][], taken: Set<string>) {
  const playerCell = randomOpenCellIndex(grid, taken);
  taken.add(cellKey(playerCell.x, playerCell.y));

  let monsterCell = randomOpenCellIndex(grid, taken);
  while (distance(playerCell, monsterCell) < 18) {
    monsterCell = randomOpenCellIndex(grid, taken);
  }
  taken.add(cellKey(monsterCell.x, monsterCell.y));

  return { playerCell, monsterCell };
}
