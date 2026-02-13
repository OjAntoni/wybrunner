import {
  CHASER_HEALTH,
  HUNTER_CHASER_PLACE_DOT_STEP_MS,
  HUNTER_HEALTH,
  SWORD_SWING_DURATION_MS,
  TILE_SIZE,
} from "../config/constants";
import type { GameState } from "../model/types";
import { getHunterFacingAngle } from "../world/hunterFacing";
import { getGhostVisibilityAlpha } from "../world/ghostVisibility";
import { isCellCoveredByExploreClouds } from "../world/exploration";
import { inBounds } from "../utils/grid";

function drawGhostPath(
  ctx: CanvasRenderingContext2D,
  path: { x: number; y: number }[],
  visibilityAlpha: number,
  now: number,
  camX: number,
  camY: number
) {
  if (path.length < 2 || visibilityAlpha <= 0.001) return;

  ctx.save();
  ctx.lineWidth = 0.7;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = `rgba(255, 255, 255, ${(0.34 * visibilityAlpha).toFixed(3)})`;
  ctx.setLineDash([1, 2.3]);
  ctx.lineDashOffset = -((now / 110) % 3.3);
  const first = path[0];
  ctx.beginPath();
  ctx.moveTo(first.x * TILE_SIZE - camX, first.y * TILE_SIZE - camY);
  for (let i = 1; i < path.length; i += 1) {
    const point = path[i];
    ctx.lineTo(point.x * TILE_SIZE - camX, point.y * TILE_SIZE - camY);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export function drawGhostPathsOverlay(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number
) {
  for (const monster of state.monsters) {
    if (monster.kind !== "ghost") continue;
    const visibilityAlpha = getGhostVisibilityAlpha(monster, now);
    drawGhostPath(ctx, monster.path, visibilityAlpha, now, camX, camY);
  }
}

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
  now: number,
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
  drawPlayerFacingIndicator(ctx, state, now, camX, camY);
  drawPlayerSwordSwing(ctx, state, now, camX, camY);
}

function drawPlayerFacingIndicator(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number
) {
  const facing = state.playerFacingIndicator;
  const facingLen = Math.hypot(facing.x, facing.y);
  if (facingLen <= 0.0001) return;

  const dirX = facing.x / facingLen;
  const dirY = facing.y / facingLen;
  const perpX = -dirY;
  const perpY = dirX;

  const centerX = state.player.x * TILE_SIZE - camX;
  const centerY = state.player.y * TILE_SIZE - camY;
  const pulse = 0.92 + Math.sin(now / 380) * 0.08;
  const alpha = 0.55 + (Math.sin(now / 520) + 1) * 0.06;
  const baseHalf = TILE_SIZE * 0.195 * pulse;
  const height = TILE_SIZE * 0.19125 * pulse;
  const frontDistance = TILE_SIZE * 0.55;

  const baseCenterX = centerX + dirX * frontDistance;
  const baseCenterY = centerY + dirY * frontDistance;
  const tipX = baseCenterX + dirX * height;
  const tipY = baseCenterY + dirY * height;
  const leftX = baseCenterX + perpX * baseHalf;
  const leftY = baseCenterY + perpY * baseHalf;
  const rightX = baseCenterX - perpX * baseHalf;
  const rightY = baseCenterY - perpY * baseHalf;

  ctx.save();
  ctx.fillStyle = `rgba(230, 230, 230, ${alpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(leftX, leftY);
  ctx.lineTo(rightX, rightY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function getCardinalFacing(facing: { x: number; y: number }) {
  const absX = Math.abs(facing.x);
  const absY = Math.abs(facing.y);
  if (absX >= absY) {
    const signX = facing.x >= 0 ? 1 : -1;
    return { x: signX, y: 0 };
  }
  const signY = facing.y >= 0 ? 1 : -1;
  return { x: 0, y: signY };
}

function drawPlayerSwordSwing(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number
) {
  const startMs = state.swordSwingStartMs;
  if (startMs === null) return;
  const elapsed = now - startMs;
  if (elapsed < 0 || elapsed > SWORD_SWING_DURATION_MS) return;

  const facing = state.playerFacingIndicator;
  const facingLen = Math.hypot(facing.x, facing.y);
  if (facingLen <= 0.0001) return;

  const dirX = facing.x / facingLen;
  const dirY = facing.y / facingLen;
  const centerX = state.player.x * TILE_SIZE - camX;
  const centerY = state.player.y * TILE_SIZE - camY;
  const bladeLen = TILE_SIZE * 1.05;
  const handleLen = TILE_SIZE * 0.2;
  const swingSpan = Math.PI * 0.9;

  const t = clamp01(elapsed / SWORD_SWING_DURATION_MS);
  const easeOut = 1 - (1 - t) * (1 - t);
  const intensity = Math.sin(t * Math.PI);

  const facingAngle = Math.atan2(dirY, dirX);
  const startAngle = facingAngle + swingSpan * 0.5;
  const endAngle = facingAngle - swingSpan * 0.5;
  const angle = startAngle + (endAngle - startAngle) * easeOut;

  const baseX = centerX + Math.cos(angle) * handleLen;
  const baseY = centerY + Math.sin(angle) * handleLen;
  const tipX = centerX + Math.cos(angle) * bladeLen;
  const tipY = centerY + Math.sin(angle) * bladeLen;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = `rgba(232, 232, 232, ${(0.65 * intensity).toFixed(3)})`;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.lineTo(tipX, tipY);
  ctx.stroke();

  const cardinal = getCardinalFacing({ x: dirX, y: dirY });
  const right = { x: -cardinal.y, y: cardinal.x };
  const left = { x: cardinal.y, y: -cardinal.x };
  const offsets = [
    cardinal,
    left,
    right,
    { x: cardinal.x * 2, y: cardinal.y * 2 },
    { x: cardinal.x + left.x, y: cardinal.y + left.y },
    { x: cardinal.x + right.x, y: cardinal.y + right.y },
  ];
  const glow = 0.1 * intensity;
  for (const offset of offsets) {
    const tileX = Math.floor(state.player.x) + offset.x;
    const tileY = Math.floor(state.player.y) + offset.y;
    if (!inBounds(tileX, tileY)) continue;
    if (state.grid[tileY][tileX] !== 0) continue;
    ctx.fillStyle = `rgba(220, 220, 220, ${glow.toFixed(3)})`;
    ctx.fillRect(
      tileX * TILE_SIZE - camX,
      tileY * TILE_SIZE - camY,
      TILE_SIZE,
      TILE_SIZE
    );
  }

  ctx.restore();
}

function drawGhost(
  ctx: CanvasRenderingContext2D,
  monster: GameState["monsters"][number],
  now: number,
  camX: number,
  camY: number
) {
  if (monster.kind !== "ghost") return;
  const visibilityAlpha = getGhostVisibilityAlpha(monster, now);
  if (visibilityAlpha <= 0.001) return;

  const cx = monster.pos.x * TILE_SIZE - camX;
  const cy = monster.pos.y * TILE_SIZE - camY - 2 + Math.sin(now / 240 + cx * 0.015) * 1.5;
  const scale = 0.72 + visibilityAlpha * 0.28;
  const isRelayActive = monster.behavior === "to_hunter" || monster.behavior === "with_hunter";
  const isReturningToPath = monster.behavior === "return_to_path";
  const outerBodyColor = isRelayActive
    ? `rgba(255, 208, 218, ${(0.22 * visibilityAlpha).toFixed(3)})`
    : `rgba(232, 246, 255, ${(0.2 * visibilityAlpha).toFixed(3)})`;
  const innerBodyColor = isRelayActive
    ? `rgba(255, 236, 240, ${(0.75 * visibilityAlpha).toFixed(3)})`
    : `rgba(245, 252, 255, ${(0.72 * visibilityAlpha).toFixed(3)})`;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = outerBodyColor;
  ctx.beginPath();
  ctx.arc(0, 0, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = innerBodyColor;
  ctx.beginPath();
  ctx.arc(0, 0, 5.2, 0, Math.PI * 2);
  ctx.fill();

  if (isRelayActive) {
    // Slight red tint + angry face while ghost is in hunter-relay states.
    ctx.fillStyle = `rgba(255, 132, 148, ${(0.13 * visibilityAlpha).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(82, 24, 38, ${(0.88 * visibilityAlpha).toFixed(3)})`;
    ctx.lineCap = "round";
    ctx.lineWidth = 0.46;
    ctx.beginPath();
    ctx.moveTo(-2.05, -1.45);
    ctx.lineTo(-0.95, -0.85);
    ctx.moveTo(0.95, -0.85);
    ctx.lineTo(2.05, -1.45);
    ctx.stroke();

    ctx.fillStyle = `rgba(82, 24, 38, ${(0.92 * visibilityAlpha).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(-1.35, -0.7, 0.44, 0, Math.PI * 2);
    ctx.arc(1.35, -0.7, 0.44, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(118, 40, 58, ${(0.86 * visibilityAlpha).toFixed(3)})`;
    ctx.lineWidth = 0.48;
    ctx.beginPath();
    ctx.moveTo(-1.45, 1.9);
    ctx.quadraticCurveTo(0, 1.2, 1.45, 1.9);
    ctx.stroke();
  } else if (isReturningToPath) {
    // Returning-to-path state: sad face, no red tint.
    ctx.fillStyle = `rgba(40, 58, 80, ${(0.8 * visibilityAlpha).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(-1.35, -1.0, 0.55, 0, Math.PI * 2);
    ctx.arc(1.35, -1.0, 0.55, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(62, 84, 108, ${(0.76 * visibilityAlpha).toFixed(3)})`;
    ctx.lineWidth = 0.44;
    ctx.beginPath();
    ctx.moveTo(-1.35, 2.0);
    ctx.quadraticCurveTo(0, 2.65, 1.35, 2.0);
    ctx.stroke();
  } else {
    // Default tiny ghost face.
    ctx.fillStyle = `rgba(36, 54, 74, ${(0.78 * visibilityAlpha).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(-1.45, -1.0, 0.58, 0, Math.PI * 2);
    ctx.arc(1.45, -1.0, 0.58, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(52, 72, 94, ${(0.68 * visibilityAlpha).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(0, 1.45, 1.15, 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawGhosts(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number
) {
  for (const monster of state.monsters) {
    if (monster.kind !== "ghost") continue;
    drawGhost(ctx, monster, now, camX, camY);
  }
}

export function drawMonsters(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number
) {
  for (const monster of state.monsters) {
    if (monster.kind === "ghost") continue;

    const monsterCell = {
      x: Math.floor(monster.pos.x),
      y: Math.floor(monster.pos.y),
    };
    if (isCellCoveredByExploreClouds(state, monsterCell.x, monsterCell.y)) continue;

    const stunned = now < monster.stunUntil;
    const hurtFlicker = now < monster.hurtUntilMs;
    const flickerOn = !hurtFlicker || Math.sin(now / 45) > 0;
    ctx.save();
    ctx.globalAlpha = flickerOn ? 1 : 0.35;
    if (stunned) {
      const stunFlicker = Math.sin(now / 60) > 0;
      ctx.fillStyle = stunFlicker ? "#ff4e4e" : "#ffd166";
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
    drawMobHearts(
      ctx,
      monster.pos.x * TILE_SIZE - camX - TILE_SIZE / 2 + 1,
      monster.pos.y * TILE_SIZE - camY - TILE_SIZE / 2 + 1,
      monster.health,
      CHASER_HEALTH
    );
    ctx.restore();
  }
}

function drawHunterPlacingPopup(
  ctx: CanvasRenderingContext2D,
  hunterX: number,
  hunterY: number,
  now: number,
  startMs: number,
  kind: "chaser" | "turret"
) {
  const elapsed = Math.max(0, now - startMs);
  const dotCount = (Math.floor(elapsed / HUNTER_CHASER_PLACE_DOT_STEP_MS) % 3) + 1;
  const text = `Placing the ${kind}${".".repeat(dotCount)}`;
  ctx.save();
  ctx.font = "400 4px 'Press Start 2P', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(232, 98, 98, 0.75)";
  ctx.fillText(text, hunterX, hunterY - TILE_SIZE * 0.8);
  ctx.restore();
}

function drawMobHearts(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  health: number,
  maxHealth: number
) {
  if (maxHealth <= 0) return;
  const heartSize = 1.7;
  const heartSpacing = 0.8;
  const heartWidth = heartSize * 2;
  const totalWidth = maxHealth * heartWidth + (maxHealth - 1) * heartSpacing;
  const startX = px + (TILE_SIZE - 2) / 2 - totalWidth / 2;
  const startY = py - 4.0;

  for (let i = 0; i < maxHealth; i += 1) {
    const filled = i < health;
    ctx.fillStyle = filled ? "rgba(255, 64, 64, 0.95)" : "rgba(84, 16, 16, 0.6)";
    drawTinyHeart(ctx, startX + i * (heartWidth + heartSpacing) + heartSize, startY, heartSize);
  }
}

function drawTinyHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number
) {
  const top = size * 0.45;
  ctx.beginPath();
  ctx.moveTo(cx, cy + top);
  ctx.bezierCurveTo(cx, cy, cx - size, cy, cx - size, cy + top);
  ctx.bezierCurveTo(cx - size, cy + size * 1.25, cx, cy + size * 1.5, cx, cy + size * 1.8);
  ctx.bezierCurveTo(cx, cy + size * 1.5, cx + size, cy + size * 1.25, cx + size, cy + top);
  ctx.bezierCurveTo(cx + size, cy, cx, cy, cx, cy + top);
  ctx.closePath();
  ctx.fill();
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
    const hurtFlicker = now < hunter.hurtUntilMs;
    const flickerOn = !hurtFlicker || Math.sin(now / 45) > 0;
    ctx.save();
    ctx.globalAlpha = flickerOn ? 1 : 0.35;
    ctx.fillStyle = isChasing
      ? "rgba(255, 130, 80, 1)"
      : `rgba(255, 192, 110, ${patrolPulse.toFixed(3)})`;

    const px = hunter.pos.x * TILE_SIZE - camX - TILE_SIZE / 2 + 1;
    const py = hunter.pos.y * TILE_SIZE - camY - TILE_SIZE / 2 + 1;
    ctx.fillRect(px, py, TILE_SIZE - 2, TILE_SIZE - 2);
    drawMobHearts(ctx, px, py, hunter.health, HUNTER_HEALTH);

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
        hunter.chaserPlaceStartMs,
        "chaser"
      );
    } else if (hunter.turretPlaceEndMs > now) {
      drawHunterPlacingPopup(
        ctx,
        hunter.pos.x * TILE_SIZE - camX,
        hunter.pos.y * TILE_SIZE - camY,
        now,
        hunter.turretPlaceStartMs,
        "turret"
      );
    }
    ctx.restore();
  }
}

export function drawTurrets(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number
) {
  for (const turret of state.turrets) {
    const turretCell = {
      x: Math.floor(turret.pos.x),
      y: Math.floor(turret.pos.y),
    };
    if (isCellCoveredByExploreClouds(state, turretCell.x, turretCell.y)) continue;

    const cx = turret.pos.x * TILE_SIZE - camX;
    const cy = turret.pos.y * TILE_SIZE - camY;
    const pulse = 0.7 + (Math.sin(now / 190 + turret.id * 0.4) + 1) * 0.15;

    ctx.save();
    ctx.fillStyle = `rgba(170, 58, 58, ${pulse.toFixed(3)})`;
    ctx.fillRect(cx - TILE_SIZE / 2 + 1, cy - TILE_SIZE / 2 + 1, TILE_SIZE - 2, TILE_SIZE - 2);
    ctx.fillStyle = "rgba(34, 14, 14, 0.9)";
    ctx.fillRect(cx - 2, cy - 2, 4, 4);

    const barrelLen = 5;
    ctx.strokeStyle = "rgba(255, 160, 160, 0.95)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(
      cx + Math.cos(turret.facingAngle) * barrelLen,
      cy + Math.sin(turret.facingAngle) * barrelLen
    );
    ctx.stroke();
    ctx.restore();
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
