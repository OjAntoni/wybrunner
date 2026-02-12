import { TILE_SIZE } from "../config/constants";
import type { GameState } from "../model/types";

export function drawHelpers(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number
) {
  for (const helper of state.helpers) {
    const px = helper.pos.x * TILE_SIZE - camX - TILE_SIZE / 2;
    const py = helper.pos.y * TILE_SIZE - camY - TILE_SIZE / 2;
    const bob = Math.sin(now / 180 + helper.id * 0.01) * 1.2;
    const blink = Math.sin(now / 90 + helper.id) > 0;

    if (now < helper.boostUntil) {
      const glow = 0.25 + 0.2 * Math.sin(now / 70);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(80,255,140,${glow})`;
      ctx.beginPath();
      ctx.arc(helper.pos.x * TILE_SIZE - camX, helper.pos.y * TILE_SIZE - camY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = blink ? "#d56bff" : "#8f2ad9";
    ctx.fillRect(px + 2, py + 2 + bob, TILE_SIZE - 4, TILE_SIZE - 4);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(px + 3, py + 3 + bob, TILE_SIZE - 6, TILE_SIZE - 6);
    ctx.fillStyle = "#e9d6ff";
    ctx.fillRect(px + 4, py + 4 + bob, 2, 1);
    ctx.fillRect(px + 6, py + 4 + bob, 2, 1);
  }
}

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  camX: number,
  camY: number
) {
  ctx.fillStyle = "#59d9ff";
  ctx.fillRect(
    state.player.x * TILE_SIZE - camX - TILE_SIZE / 2 + 1,
    state.player.y * TILE_SIZE - camY - TILE_SIZE / 2 + 1,
    TILE_SIZE - 2,
    TILE_SIZE - 2
  );
}

export function drawMonster(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number
) {
  const stunned = now < state.stunUntil;
  if (stunned) {
    const flicker = Math.sin(now / 60) > 0;
    ctx.fillStyle = flicker ? "#ff4e4e" : "#ffd166";
  } else {
    ctx.fillStyle = "#ff4e4e";
  }

  if (now < state.boostUntil) {
    const glow = 0.35 + 0.25 * Math.sin(now / 80);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = `rgba(80,255,140,${glow})`;
    ctx.beginPath();
    ctx.arc(state.monster.x * TILE_SIZE - camX, state.monster.y * TILE_SIZE - camY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.fillRect(
    state.monster.x * TILE_SIZE - camX - TILE_SIZE / 2 + 1,
    state.monster.y * TILE_SIZE - camY - TILE_SIZE / 2 + 1,
    TILE_SIZE - 2,
    TILE_SIZE - 2
  );
}
