import { PLAYER_SPEED } from "../../config/constants";
import type { Arrow, GameState, LoseReason } from "../../model/types";
import { inBounds } from "../../utils/grid";
import { distance } from "../../utils/math";
import { loseGame } from "../outcome";

export function updateProjectiles(
  state: GameState,
  dt: number,
  now: number,
  onLoseReason: (value: LoseReason) => void
) {
  const arrowSpeed = PLAYER_SPEED * 1.5;
  if (state.arrowThrowers.length > 0) {
    for (const thrower of state.arrowThrowers) {
      if (state.grid[thrower.y][thrower.x] !== 1) continue;
      if (now < thrower.nextFireMs) continue;

      thrower.nextFireMs = now + thrower.periodMs;
      const spawnX = thrower.x + thrower.dir.x;
      const spawnY = thrower.y + thrower.dir.y;
      if (!inBounds(spawnX, spawnY)) continue;
      if (state.grid[spawnY][spawnX] !== 0) continue;

      state.arrows.push({
        pos: { x: spawnX + 0.5, y: spawnY + 0.5 },
        dir: thrower.dir,
        speed: arrowSpeed,
        source: "thrower",
      });
    }

    state.arrowThrowers = state.arrowThrowers.filter(
      (thrower) => state.grid[thrower.y][thrower.x] === 1
    );
  }

  if (state.arrows.length > 0) {
    const nextArrows: Arrow[] = [];
    for (const arrow of state.arrows) {
      const nextPos = {
        x: arrow.pos.x + arrow.dir.x * arrow.speed * dt,
        y: arrow.pos.y + arrow.dir.y * arrow.speed * dt,
      };
      const ax = Math.floor(nextPos.x);
      const ay = Math.floor(nextPos.y);
      if (!inBounds(ax, ay)) continue;
      if (state.grid[ay][ax] === 1) continue;
      if (distance(nextPos, state.player) < 0.42) {
        loseGame(state, "arrow", onLoseReason);
        return false;
      }
      nextArrows.push({ ...arrow, pos: nextPos });
    }
    state.arrows = nextArrows;
  }

  return true;
}
