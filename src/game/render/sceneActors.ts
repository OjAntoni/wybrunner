import { HUNTER_CHASER_PLACE_DOT_STEP_MS, TILE_SIZE } from "../config/constants";
import type { GameState } from "../model/types";
import { getHunterFacingAngle } from "../world/hunterFacing";
import { isCellCoveredByExploreClouds } from "../world/exploration";

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
  for (const monster of state.monsters) {
    const monsterCell = {
      x: Math.floor(monster.pos.x),
      y: Math.floor(monster.pos.y),
    };
    if (isCellCoveredByExploreClouds(state, monsterCell.x, monsterCell.y)) continue;

    const stunned = now < monster.stunUntil;
    if (stunned) {
      const flicker = Math.sin(now / 60) > 0;
      ctx.fillStyle = flicker ? "#ff4e4e" : "#ffd166";
    } else {
      ctx.fillStyle = "#ff4e4e";
    }

    if (now < monster.boostUntil) {
      const glow = 0.35 + 0.25 * Math.sin(now / 80);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = `rgba(80,255,140,${glow})`;
      ctx.beginPath();
      ctx.arc(monster.pos.x * TILE_SIZE - camX, monster.pos.y * TILE_SIZE - camY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    ctx.fillRect(
      monster.pos.x * TILE_SIZE - camX - TILE_SIZE / 2 + 1,
      monster.pos.y * TILE_SIZE - camY - TILE_SIZE / 2 + 1,
      TILE_SIZE - 2,
      TILE_SIZE - 2
    );
  }
}

function drawHunterPlacingPopup(
  ctx: CanvasRenderingContext2D,
  hunterX: number,
  hunterY: number,
  now: number,
  startMs: number
) {
  const elapsed = Math.max(0, now - startMs);
  const dotCount = (Math.floor(elapsed / HUNTER_CHASER_PLACE_DOT_STEP_MS) % 3) + 1;
  const text = `Placing the chaser${".".repeat(dotCount)}`;
  ctx.save();
  ctx.font = "400 4px 'Press Start 2P', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(232, 98, 98, 0.75)";
  ctx.fillText(text, hunterX, hunterY - TILE_SIZE * 0.8);
  ctx.restore();
}

export function drawHunters(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number
) {
  for (let i = 0; i < state.hunters.length; i += 1) {
    const hunter = state.hunters[i];
    const hunterCell = {
      x: Math.floor(hunter.pos.x),
      y: Math.floor(hunter.pos.y),
    };
    if (hunter.mode !== "chase" && isCellCoveredByExploreClouds(state, hunterCell.x, hunterCell.y)) {
      continue;
    }

    const patrolPulse = 0.75 + (Math.sin(now / 220 + i * 0.7) + 1) * 0.125;
    const isChasing = hunter.mode === "chase";
    const facingAngle = getHunterFacingAngle(hunter, now);
    ctx.fillStyle = isChasing
      ? "rgba(255, 130, 80, 1)"
      : `rgba(255, 192, 110, ${patrolPulse.toFixed(3)})`;

    const px = hunter.pos.x * TILE_SIZE - camX - TILE_SIZE / 2 + 1;
    const py = hunter.pos.y * TILE_SIZE - camY - TILE_SIZE / 2 + 1;
    ctx.fillRect(px, py, TILE_SIZE - 2, TILE_SIZE - 2);

    const eyeOffsetX = Math.cos(facingAngle) * 2;
    const eyeOffsetY = Math.sin(facingAngle) * 2;
    const centerX = px + (TILE_SIZE - 2) / 2;
    const centerY = py + (TILE_SIZE - 2) / 2;

    ctx.fillStyle = "rgba(22, 18, 14, 0.9)";
    ctx.fillRect(centerX + eyeOffsetX - 1, centerY + eyeOffsetY - 1, 2, 2);

    if (hunter.chaserPlaceEndMs > now) {
      drawHunterPlacingPopup(
        ctx,
        hunter.pos.x * TILE_SIZE - camX,
        hunter.pos.y * TILE_SIZE - camY,
        now,
        hunter.chaserPlaceStartMs
      );
    }
  }
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function drawPlayerPopup(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number,
  touchEnabled: boolean
) {
  const popup = state.playerPopup;
  if (!popup) return;
  if (now >= popup.endMs) return;

  const duration = popup.endMs - popup.startMs;
  if (duration <= 0) return;

  const t = clamp01((now - popup.startMs) / duration);
  const fadeIn = clamp01(t / 0.15);
  const fadeOut = clamp01((1 - t) / 0.2);
  const alpha = Math.min(fadeIn, fadeOut);
  if (alpha <= 0) return;

  const playerX = state.player.x * TILE_SIZE - camX;
  const playerY = state.player.y * TILE_SIZE - camY;
  const rise = 2 + t * 8;
  const textY = playerY - TILE_SIZE / 2 - rise;

  const text = popup.text;
  const fontPx = touchEnabled ? 9 : 4;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `400 ${fontPx}px 'Press Start 2P', monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillStyle = "rgba(232, 98, 98, 0.75)";
  ctx.fillText(text, playerX, textY + 0.5);
  ctx.restore();
}
