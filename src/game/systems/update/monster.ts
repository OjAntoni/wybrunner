import {
  CHASER_BOOST_MS,
  CHASER_BOOST_MULT,
  CHASER_SPEED_MULT,
  PLAYER_SPEED,
  TOUCH_CHASER_SPEED_MULT,
} from "../../config/constants";
import type { GameState, LoseReason, Monster, Vec } from "../../model/types";
import { cellKey, countOpenNeighbors, inBounds } from "../../utils/grid";
import { distance } from "../../utils/math";
import { bfsNextStep, bestNeighborStep, bestNeighborStepAvoid } from "../../world/pathing";
import { isAtCellCenter, isOpposite } from "../movement";
import { loseGame } from "../outcome";

export function createMonsterAt(position: Vec, now: number, bombKillable: boolean): Monster {
  return {
    pos: { ...position },
    dir: { x: 0, y: 0 },
    target: null,
    boostUntil: 0,
    stunUntil: 0,
    lastPathTime: now,
    lastCell: {
      x: Math.floor(position.x),
      y: Math.floor(position.y),
    },
    bombKillable,
  };
}

export function updateMonster(
  state: GameState,
  dt: number,
  now: number,
  touchEnabled: boolean,
  onLoseReason: (value: LoseReason) => void
) {
  if (state.monsters.length === 0) return true;

  const playerCell = {
    x: Math.floor(state.player.x),
    y: Math.floor(state.player.y),
  };

  for (const monster of state.monsters) {
    const monsterCell = {
      x: Math.floor(monster.pos.x),
      y: Math.floor(monster.pos.y),
    };
    const monsterKey = cellKey(monsterCell.x, monsterCell.y);

    if (state.spikes.has(monsterKey)) {
      state.spikes.delete(monsterKey);
      monster.stunUntil = now + 5000;
    }
    if (state.boosters.has(monsterKey)) {
      state.boosters.delete(monsterKey);
      monster.boostUntil = Math.max(monster.boostUntil, now + CHASER_BOOST_MS);
    }

    if (now >= monster.stunUntil) {
      const chaserSpeed =
        PLAYER_SPEED *
        dt *
        CHASER_SPEED_MULT *
        (touchEnabled ? TOUCH_CHASER_SPEED_MULT : 1) *
        (now < monster.boostUntil ? CHASER_BOOST_MULT : 1);

      const atCenter = isAtCellCenter(monster.pos);
      if (atCenter && !monster.target) {
        let desired = bfsNextStep(state.grid, monsterCell, playerCell);
        if (desired.x === 0 && desired.y === 0) {
          desired = bestNeighborStep(state.grid, monsterCell, playerCell);
        }

        const neighborCount = countOpenNeighbors(state.grid, monsterCell);
        const canReverse = neighborCount <= 1;
        let nextDir = desired;
        if (isOpposite(desired, monster.dir) && !canReverse) {
          nextDir = bestNeighborStepAvoid(state.grid, monsterCell, playerCell, desired);
        }

        monster.dir = nextDir;
        const targetCell = {
          x: monsterCell.x + nextDir.x,
          y: monsterCell.y + nextDir.y,
        };
        if (inBounds(targetCell.x, targetCell.y) && state.grid[targetCell.y][targetCell.x] === 0) {
          monster.target = {
            x: targetCell.x + 0.5,
            y: targetCell.y + 0.5,
          };
        }

        monster.lastPathTime = now;
        monster.lastCell = { x: monsterCell.x, y: monsterCell.y };
      }

      if (monster.target) {
        const toTarget = {
          x: monster.target.x - monster.pos.x,
          y: monster.target.y - monster.pos.y,
        };
        const dist = Math.hypot(toTarget.x, toTarget.y);
        if (dist <= chaserSpeed) {
          monster.pos = { ...monster.target };
          monster.target = null;
        } else {
          monster.pos = {
            x: monster.pos.x + (toTarget.x / dist) * chaserSpeed,
            y: monster.pos.y + (toTarget.y / dist) * chaserSpeed,
          };
        }
      }
    }

    if (distance(state.player, monster.pos) < 0.45) {
      loseGame(state, "caught", onLoseReason);
      return false;
    }
  }

  return true;
}
