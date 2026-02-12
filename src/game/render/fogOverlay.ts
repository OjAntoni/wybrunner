import { FOG_RADIUS_TILES, TILE_SIZE } from "../config/constants";
import { clamp01 } from "../utils/math";
import { mulberry32 } from "../utils/random";
import { drawCloudBlob } from "./primitives";

export function drawFog(
  ctx: CanvasRenderingContext2D,
  nowMs: number,
  playerPxX: number,
  playerPxY: number,
  fogStartMs: number,
  fogUntilMs: number,
  canvasW: number,
  canvasH: number
) {
  const radiusPx = FOG_RADIUS_TILES * TILE_SIZE;
  ctx.save();
  const fadeInMs = 550;
  const fadeOutMs = 750;
  const tIn = fogStartMs > 0 ? (nowMs - fogStartMs) / fadeInMs : 1;
  const tOut = (fogUntilMs - nowMs) / fadeOutMs;
  const fade = clamp01(Math.min(1, Math.min(tIn, tOut)));
  const eased = fade * fade * (3 - 2 * fade); // smoothstep
  const fogAlpha = 0.88 * eased;
  const fog = `rgba(6, 8, 14, ${fogAlpha.toFixed(3)})`;

  // Fill everything EXCEPT the player's visible circle.
  ctx.fillStyle = fog;
  ctx.beginPath();
  ctx.rect(0, 0, canvasW, canvasH);
  ctx.arc(playerPxX, playerPxY, radiusPx, 0, Math.PI * 2);
  ctx.fill("evenodd");

  const t = nowMs / 1000;
  const rand = mulberry32(1337);
  const cloudCount = 22;

  // Clouds ("frog") only in the hidden region.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, canvasW, canvasH);
  ctx.arc(playerPxX, playerPxY, Math.max(radiusPx - 6, 0), 0, Math.PI * 2);
  ctx.clip("evenodd");
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < cloudCount; i += 1) {
    const baseX = rand() * canvasW;
    const baseY = rand() * canvasH;
    const vx = (rand() * 2 - 1) * 10;
    const vy = (rand() * 2 - 1) * 6;
    const x = (baseX + t * vx + canvasW) % canvasW;
    const y = (baseY + t * vy + canvasH) % canvasH;
    const size = 22 + rand() * 26;
    const alpha = (0.06 + rand() * 0.08) * eased;
    drawCloudBlob(ctx, x, y, size, alpha);
  }
  ctx.restore();

  // Soft edge around the visible circle.
  const inner = Math.max(radiusPx - 22, 0);
  const outer = radiusPx + 2;
  ctx.save();
  ctx.beginPath();
  ctx.arc(playerPxX, playerPxY, outer, 0, Math.PI * 2);
  ctx.arc(playerPxX, playerPxY, inner, 0, Math.PI * 2, true);
  ctx.clip();
  const grad = ctx.createRadialGradient(playerPxX, playerPxY, inner, playerPxX, playerPxY, outer);
  grad.addColorStop(0, "rgba(6, 8, 14, 0)");
  grad.addColorStop(1, fog);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvasW, canvasH);
  ctx.restore();

  ctx.restore();
}
