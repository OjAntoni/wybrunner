import { PLAYER_SPEED } from "../../config/constants";
import type { Arrow, GameState } from "../../model/types";
import { inBounds } from "../../utils/grid";
import { distance } from "../../utils/math";
import { applyPlayerEnemyHit } from "./playerDamage";
import { getGlobalActiveChunks, shouldUpdateEntity } from "../../world/chunkProcessing";

export function updateProjectiles(
  state: GameState,
  dt: number,
  now: number
) {
  const arrowSpeed = PLAYER_SPEED * 1.5;
  const activeChunks = getGlobalActiveChunks();

  if (state.arrowThrowers.length > 0) {
    for (const thrower of state.arrowThrowers) {
      if (state.grid[thrower.y][thrower.x] !== 1) continue;
      if (now < thrower.nextFireMs) continue;

      // Skip arrow throwers outside active chunks for performance
      if (!shouldUpdateEntity(thrower.x, thrower.y, activeChunks)) {
        // Still update the timer to prevent back-log of arrows
        thrower.nextFireMs = now + thrower.periodMs;
        continue;
      }

      thrower.nextFireMs = now + thrower.periodMs;
      thrower.lastFireMs = now;
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
        if (applyPlayerEnemyHit(state, now, "arrow")) return false;
        continue;
      }

      // Only keep arrows that are in or approaching active chunks
      // This prevents arrows from accumulating infinitely in far-off chunks
      if (shouldUpdateEntity(nextPos.x, nextPos.y, activeChunks)) {
        nextArrows.push({ ...arrow, pos: nextPos });
      } else if (arrow.source === "turret") {
        // For turret arrows, be more lenient since they can travel far
        // Keep them if they're within a larger margin
        const chunkX = Math.floor(ax / 16);
        const chunkY = Math.floor(ay / 16);
        const isNearby = Array.from(activeChunks).some(key => {
          const [acx, acy] = key.split(',').map(Number);
          return Math.abs(acx - chunkX) <= 1 && Math.abs(acy - chunkY) <= 1;
        });
        if (isNearby) {
          nextArrows.push({ ...arrow, pos: nextPos });
        }
      }
    }
    state.arrows = nextArrows;
  }

  return true;
}
