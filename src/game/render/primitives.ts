import type { RGB } from "../model/types";

export function drawArtifactIndicator(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  viewW: number,
  viewH: number,
  now: number,
  color: string = "rgba(246, 201, 69, 1)",
  shineColor: string = "rgba(255, 255, 255, 0.10)"
) {
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.hypot(dx, dy);
  if (len < 0.001) return;
  const ux = dx / len;
  const uy = dy / len;

  const margin = 8;
  const left = margin;
  const right = viewW - margin;
  const top = margin;
  const bottom = viewH - margin;

  // Ray from player to direction; find intersection with the inner viewport rectangle.
  let t = Number.POSITIVE_INFINITY;
  if (ux > 0) t = Math.min(t, (right - fromX) / ux);
  if (ux < 0) t = Math.min(t, (left - fromX) / ux);
  if (uy > 0) t = Math.min(t, (bottom - fromY) / uy);
  if (uy < 0) t = Math.min(t, (top - fromY) / uy);
  if (!Number.isFinite(t)) return;

  const px = fromX + ux * t;
  const py = fromY + uy * t;

  const pulse = 0.75 + 0.25 * Math.sin(now / 150 + (ux + uy) * 2);
  const size = 3.5 + pulse * 1.6;
  const angle = Math.atan2(uy, ux);

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(angle);
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.55 + pulse * 0.25;
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.7, size * 0.55);
  ctx.lineTo(-size * 0.7, -size * 0.55);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.fillStyle = shineColor;
  ctx.beginPath();
  ctx.moveTo(size * 0.55, 0);
  ctx.lineTo(-size * 0.35, size * 0.35);
  ctx.lineTo(-size * 0.35, -size * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawCloudBlob(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  alpha: number,
  rgb: RGB = { r: 180, g: 210, b: 255 }
) {
  ctx.save();
  ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  ctx.beginPath();
  ctx.arc(x, y, size * 0.45, 0, Math.PI * 2);
  ctx.arc(x + size * 0.35, y + size * 0.05, size * 0.38, 0, Math.PI * 2);
  ctx.arc(x - size * 0.35, y + size * 0.08, size * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
