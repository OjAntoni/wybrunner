import {
  CHASER_BOOST_MS,
  CHASER_BOOST_MULT,
  HELPER_SPEED_MULT,
  PLAYER_SPEED,
} from "../../config/constants";
import type { GameState, Helper } from "../../model/types";
import { cellCenter, cellKey } from "../../utils/grid";
import { distance } from "../../utils/math";
import { applyPlayerEnemyHit } from "../update/playerDamage";

export function updateHelpers(
  state: GameState,
  dt: number,
  now: number
) {
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
      if (applyPlayerEnemyHit(state, now, "helper")) return;
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
      if (applyPlayerEnemyHit(state, now, "helper")) return;
    }

    next.push(helper);
  }
  state.helpers = next;
}
