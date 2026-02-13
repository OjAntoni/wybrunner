import {
  GHOST_NIGHT_VISION_RADIUS_TILES,
  PLAYER_NIGHT_NEAR_VISION_RADIUS_TILES,
  PLAYER_NIGHT_VISION_ANGLE_DEG,
  PLAYER_NIGHT_VISION_RADIUS_TILES,
  TILE_SIZE,
} from "../config/constants";
import type { GameState } from "../model/types";
import { getDayNightSnapshot, type DayNightSnapshot } from "../systems/dayNight";
import { getGhostVisibilityAlpha } from "../world/ghostVisibility";
import { sampleVisionConeBoundary } from "../world/hunterVision";

type VisionCircle = {
  x: number;
  y: number;
  radiusPx: number;
  alpha: number;
  revealAlpha: number;
  relayActive: boolean;
};

type DarknessOverlay = {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  scaleX: number;
  scaleY: number;
};

let darknessOverlayCanvas: HTMLCanvasElement | null = null;
const PLAYER_NIGHT_VISION_RAY_COUNT = 192;
const GHOST_VISION_BORDER_ALPHA = 0.28;
const GHOST_VISION_BORDER_WIDTH_PX = 1.25;
const GHOST_VISION_REVEAL_ALPHA = 0.2;
const GHOST_VISION_REVEAL_ALPHA_WITH_HUNTER = Math.min(1, GHOST_VISION_REVEAL_ALPHA * 3);

function ensureOverlayCanvas(
  canvas: HTMLCanvasElement | null,
  width: number,
  height: number,
  ownerDocument: Document
) {
  const nextCanvas = canvas ?? ownerDocument.createElement("canvas");
  if (nextCanvas.width !== width) nextCanvas.width = width;
  if (nextCanvas.height !== height) nextCanvas.height = height;
  return nextCanvas;
}

function getDarknessOverlay(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number
): DarknessOverlay | null {
  const transform = ctx.getTransform();
  const scaleX = Math.max(1, Math.abs(transform.a));
  const scaleY = Math.max(1, Math.abs(transform.d));
  const width = Math.max(1, Math.ceil(viewW * scaleX));
  const height = Math.max(1, Math.ceil(viewH * scaleY));
  const ownerDocument = ctx.canvas.ownerDocument ?? document;
  darknessOverlayCanvas = ensureOverlayCanvas(darknessOverlayCanvas, width, height, ownerDocument);
  const overlayCtx = darknessOverlayCanvas.getContext("2d");
  if (!overlayCtx) return null;
  return { canvas: darknessOverlayCanvas, ctx: overlayCtx, scaleX, scaleY };
}

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

function collectGhostVisionCircles(
  state: GameState,
  now: number,
  camX: number,
  camY: number
): VisionCircle[] {
  const radiusPx = GHOST_NIGHT_VISION_RADIUS_TILES * TILE_SIZE;
  const circles: VisionCircle[] = [];
  for (const monster of state.monsters) {
    if (monster.kind !== "ghost") continue;
    const alpha = getGhostVisibilityAlpha(monster, now);
    if (alpha <= 0.001) continue;
    circles.push({
      x: monster.pos.x * TILE_SIZE - camX,
      y: monster.pos.y * TILE_SIZE - camY,
      radiusPx,
      alpha,
      revealAlpha:
        monster.behavior === "with_hunter"
          ? GHOST_VISION_REVEAL_ALPHA_WITH_HUNTER
          : GHOST_VISION_REVEAL_ALPHA,
      relayActive: monster.behavior === "to_hunter" || monster.behavior === "with_hunter",
    });
  }
  return circles;
}

function eraseDarknessInVisionAreas(
  ctx: CanvasRenderingContext2D,
  playerX: number,
  playerY: number,
  nearRadiusPx: number,
  points: { x: number; y: number }[],
  ghostVisionCircles: VisionCircle[],
  camX: number,
  camY: number
) {
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(0, 0, 0, 1)";

  ctx.beginPath();
  ctx.arc(playerX, playerY, nearRadiusPx, 0, Math.PI * 2);
  ctx.fill();

  if (points.length > 0) {
    ctx.beginPath();
    buildVisionConePath(ctx, playerX, playerY, points, camX, camY);
    ctx.fill();
  }

  for (const circle of ghostVisionCircles) {
    ctx.globalAlpha = circle.alpha * circle.revealAlpha;
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.radiusPx, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawGhostVisionBorders(
  ctx: CanvasRenderingContext2D,
  ghostVisionCircles: VisionCircle[],
  overlayScaleX: number,
  overlayScaleY: number
) {
  if (ghostVisionCircles.length === 0) return;

  const invScale = 1 / Math.max(1, overlayScaleX, overlayScaleY);
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.lineWidth = GHOST_VISION_BORDER_WIDTH_PX * invScale;

  for (const circle of ghostVisionCircles) {
    ctx.globalAlpha = circle.alpha * GHOST_VISION_BORDER_ALPHA;
    ctx.strokeStyle = circle.relayActive ? "rgba(255, 128, 138, 1)" : "rgba(255, 255, 255, 1)";
    ctx.beginPath();
    ctx.arc(circle.x, circle.y, circle.radiusPx, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
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

  const overlay = getDarknessOverlay(ctx, viewW, viewH);
  if (!overlay) {
    ctx.save();
    ctx.fillStyle = `rgba(0, 0, 0, ${snapshot.darknessAlpha.toFixed(3)})`;
    ctx.fillRect(0, 0, viewW, viewH);
    ctx.restore();
    return snapshot;
  }

  const overlayCtx = overlay.ctx;
  overlayCtx.setTransform(1, 0, 0, 1, 0, 0);
  overlayCtx.globalCompositeOperation = "source-over";
  overlayCtx.globalAlpha = 1;
  overlayCtx.clearRect(0, 0, overlay.canvas.width, overlay.canvas.height);
  overlayCtx.setTransform(overlay.scaleX, 0, 0, overlay.scaleY, 0, 0);
  overlayCtx.fillStyle = `rgba(0, 0, 0, ${snapshot.darknessAlpha.toFixed(3)})`;
  overlayCtx.fillRect(0, 0, viewW, viewH);

  const flashlightIsOff =
    snapshot.phase === "transition_to_night" && snapshot.flashlightFlickerAlpha >= 0.5;
  if (!snapshot.nightVisionActive || flashlightIsOff) {
    ctx.drawImage(overlay.canvas, 0, 0, viewW, viewH);
    return snapshot;
  }

  const points = sampleVisionConeBoundary(
    state.grid,
    state.player,
    state.playerFacing,
    PLAYER_NIGHT_VISION_RADIUS_TILES,
    PLAYER_NIGHT_VISION_ANGLE_DEG,
    PLAYER_NIGHT_VISION_RAY_COUNT
  );
  const playerX = state.player.x * TILE_SIZE - camX;
  const playerY = state.player.y * TILE_SIZE - camY;
  const nearRadiusPx = PLAYER_NIGHT_NEAR_VISION_RADIUS_TILES * TILE_SIZE;
  const ghostVisionCircles = collectGhostVisionCircles(state, now, camX, camY);

  eraseDarknessInVisionAreas(
    overlayCtx,
    playerX,
    playerY,
    nearRadiusPx,
    points,
    ghostVisionCircles,
    camX,
    camY
  );
  drawGhostVisionBorders(overlayCtx, ghostVisionCircles, overlay.scaleX, overlay.scaleY);

  ctx.drawImage(overlay.canvas, 0, 0, viewW, viewH);
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
