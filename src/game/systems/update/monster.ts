import {
  CHASER_BOOST_MS,
  CHASER_BOOST_MULT,
  CHASER_SPEED_MULT,
  PLAYER_SPEED,
  TOUCH_CHASER_SPEED_MULT,
} from "../../config/constants";
import type { GameState, LoseReason } from "../../model/types";
import { cellKey, countOpenNeighbors, inBounds } from "../../utils/grid";
import { distance } from "../../utils/math";
import { bfsNextStep, bestNeighborStep, bestNeighborStepAvoid } from "../../world/pathing";
import { isAtCellCenter, isOpposite } from "../movement";
import { loseGame } from "../outcome";

export function updateMonster(
  state: GameState,
  dt: number,
  now: number,
  touchEnabled: boolean,
  onLoseReason: (value: LoseReason) => void
) {
  const monsterCell = {
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
      CHASER_SPEED_MULT *
      (touchEnabled ? TOUCH_CHASER_SPEED_MULT : 1) *
      (now < state.boostUntil ? CHASER_BOOST_MULT : 1);

    const atCenter = isAtCellCenter(state.monster);
    if (atCenter && !state.monsterTarget) {
      let desired = bfsNextStep(state.grid, monsterCell, {
        x: Math.floor(state.player.x),
        y: Math.floor(state.player.y),
      });
      if (desired.x === 0 && desired.y === 0) {
        desired = bestNeighborStep(state.grid, monsterCell, {
          x: Math.floor(state.player.x),
          y: Math.floor(state.player.y),
        });
      }

      const neighborCount = countOpenNeighbors(state.grid, monsterCell);
      const canReverse = neighborCount <= 1;
      let nextDir = desired;
      if (isOpposite(desired, state.monsterDir) && !canReverse) {
        nextDir = bestNeighborStepAvoid(state.grid, monsterCell, {
          x: Math.floor(state.player.x),
          y: Math.floor(state.player.y),
        }, desired);
      }

      state.monsterDir = nextDir;
      const targetCell = {
        x: monsterCell.x + nextDir.x,
        y: monsterCell.y + nextDir.y,
      };
      if (inBounds(targetCell.x, targetCell.y) && state.grid[targetCell.y][targetCell.x] === 0) {
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
    loseGame(state, "caught", onLoseReason);
    return false;
  }

  return true;
}
