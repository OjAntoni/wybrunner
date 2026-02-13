import {
  PLAYER_NIGHT_NEAR_VISION_RADIUS_TILES,
  PLAYER_NIGHT_VISION_ANGLE_DEG,
  PLAYER_NIGHT_VISION_RADIUS_TILES,
  TILE_SIZE,
} from "../config/constants";
import type { GameState } from "../model/types";
import { getDayNightSnapshot, type DayNightSnapshot } from "../systems/dayNight";
import { sampleVisionConeBoundary } from "../world/hunterVision";

function buildVisionConePath(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  points: { x: number; y: number }[],
  camX: number,
  camY: number
) {
  ctx.moveTo(originX, originY);
  for (const point of points) {
    ctx.lineTo(point.x * TILE_SIZE - camX, point.y * TILE_SIZE - camY);
  }
  ctx.closePath();
}

function clipVisibleVisionArea(
  ctx: CanvasRenderingContext2D,
  playerX: number,
  playerY: number,
  nearRadiusPx: number,
  points: { x: number; y: number }[],
  camX: number,
  camY: number
) {
  ctx.beginPath();
  ctx.arc(playerX, playerY, nearRadiusPx, 0, Math.PI * 2);
  if (points.length > 0) {
    buildVisionConePath(ctx, playerX, playerY, points, camX, camY);
  }
  ctx.clip();
}

function drawFlashlightTint(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  darknessAlpha: number,
  visionStrength: number
) {
  // Keep a minimum warm tint so the visible area never starts as dark.
  const steadyAlpha = 0.035 + darknessAlpha * 0.028;
  const totalAlpha = Math.min(0.09, steadyAlpha) * visionStrength;
  if (totalAlpha <= 0) return;
  ctx.fillStyle = `rgba(255, 226, 148, ${totalAlpha.toFixed(3)})`;
  ctx.fillRect(0, 0, viewW, viewH);
}

function drawVisibleAreaDimming(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  darknessAlpha: number,
  visionStrength: number
) {
  const dimAlpha = Math.min(0.36, 0.12 + darknessAlpha * 0.18) * visionStrength;
  if (dimAlpha <= 0) return;
  ctx.fillStyle = `rgba(0, 0, 0, ${dimAlpha.toFixed(3)})`;
  ctx.fillRect(0, 0, viewW, viewH);
}

export function drawNightLightingOverlay(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  camX: number,
  camY: number,
  viewW: number,
  viewH: number
): DayNightSnapshot {
  const snapshot = getDayNightSnapshot(state, now);
  if (snapshot.darknessAlpha <= 0) return snapshot;

  ctx.save();
  ctx.fillStyle = `rgba(0, 0, 0, ${snapshot.darknessAlpha.toFixed(3)})`;
  const flashlightIsOff =
    snapshot.phase === "transition_to_night" && snapshot.flashlightFlickerAlpha >= 0.5;
  if (!snapshot.nightVisionActive || flashlightIsOff) {
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.restore();
    return snapshot;
  }

  const points = sampleVisionConeBoundary(
    state.grid,
    state.player,
    state.playerFacing,
    PLAYER_NIGHT_VISION_RADIUS_TILES,
    PLAYER_NIGHT_VISION_ANGLE_DEG,
    64
  );

  const playerX = state.player.x * TILE_SIZE - camX;
  const playerY = state.player.y * TILE_SIZE - camY;
  const nearRadiusPx = PLAYER_NIGHT_NEAR_VISION_RADIUS_TILES * TILE_SIZE;
  const visionStrength = Math.max(0, Math.min(1, snapshot.nightVisionStrength));

  // Darken only where the player should not see: outside near circle AND outside cone.
  if (points.length > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, viewW, viewH);
    ctx.arc(playerX, playerY, nearRadiusPx, 0, Math.PI * 2);
    ctx.clip("evenodd");

    ctx.beginPath();
    ctx.rect(0, 0, viewW, viewH);
    buildVisionConePath(ctx, playerX, playerY, points, camX, camY);
    ctx.fill("evenodd");
    ctx.restore();
  } else {
    ctx.beginPath();
    ctx.rect(0, 0, viewW, viewH);
    ctx.arc(playerX, playerY, nearRadiusPx, 0, Math.PI * 2);
    ctx.fill("evenodd");
  }

  // Smoothly fade vision out during night->day by blending back toward ambient darkness.
  if (visionStrength < 1) {
    ctx.save();
    clipVisibleVisionArea(ctx, playerX, playerY, nearRadiusPx, points, camX, camY);
    const fadeBackAlpha = snapshot.darknessAlpha * (1 - visionStrength);
    if (fadeBackAlpha > 0) {
      ctx.fillStyle = `rgba(0, 0, 0, ${fadeBackAlpha.toFixed(3)})`;
      ctx.fillRect(0, 0, viewW, viewH);
    }
    ctx.restore();
  }

  // Slight warm/yellow flashlight tint across the full visible shape (circle + cone union).
  ctx.save();
  clipVisibleVisionArea(ctx, playerX, playerY, nearRadiusPx, points, camX, camY);
  drawVisibleAreaDimming(ctx, viewW, viewH, snapshot.darknessAlpha, visionStrength);
  drawFlashlightTint(
    ctx,
    viewW,
    viewH,
    snapshot.darknessAlpha,
    visionStrength
  );
  ctx.restore();

  ctx.restore();
  return snapshot;
}

export function drawNightWarningText(
  ctx: CanvasRenderingContext2D,
  snapshot: DayNightSnapshot,
  viewW: number,
  viewH: number
) {
  if (!snapshot.showNightWarning || snapshot.nightWarningOpacity <= 0) return;

  const text = "Night is coming...";
  const splitLines = ["Night is", "coming..."];
  const maxTextWidth = Math.max(120, viewW * 0.9);
  let fontPx = Math.max(8, Math.floor(Math.min(viewW * 0.07, viewH * 0.11)));

  ctx.save();
  ctx.globalAlpha = snapshot.nightWarningOpacity;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "rgba(30, 20, 16, 0.95)";
  ctx.fillStyle = "rgba(255, 208, 118, 0.97)";

  const setFont = (sizePx: number) => {
    ctx.font = `400 ${sizePx}px 'Press Start 2P', monospace`;
  };

  setFont(fontPx);
  while (fontPx > 8 && ctx.measureText(text).width > maxTextWidth) {
    fontPx -= 1;
    setFont(fontPx);
  }

  let lines = [text];
  if (ctx.measureText(text).width > maxTextWidth) {
    lines = splitLines;
    while (fontPx > 8) {
      setFont(fontPx);
      const widest = Math.max(
        ctx.measureText(splitLines[0]).width,
        ctx.measureText(splitLines[1]).width
      );
      if (widest <= maxTextWidth) break;
      fontPx -= 1;
    }
  }

  ctx.lineWidth = Math.max(2, Math.floor(fontPx * 0.08));
  const lineHeight = Math.max(fontPx * 1.45, fontPx + 6);
  const firstLineY = viewH * 0.5 - ((lines.length - 1) * lineHeight) / 2;
  for (let i = 0; i < lines.length; i += 1) {
    const y = firstLineY + i * lineHeight;
    ctx.strokeText(lines[i], viewW * 0.5, y);
    ctx.fillText(lines[i], viewW * 0.5, y);
  }
  ctx.restore();
}
