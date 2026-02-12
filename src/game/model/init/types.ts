import type { ArrowThrower, Vec } from "../types";

export type InitialPlacements = {
  playerCell: Vec;
  monsterCell: Vec;
  items: Set<string>;
  coins: Set<string>;
  undergroundTrapsHidden: Set<string>;
  arrowThrowers: ArrowThrower[];
};
