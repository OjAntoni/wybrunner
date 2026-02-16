import { clamp } from "../utils/math";

export function drawHeartbeatBorderOverlay(
  ctx: CanvasRenderingContext2D,
  viewW: number,
  viewH: number,
  heartbeatPulse: number
) {
  const intensity = clamp(heartbeatPulse, 0, 1);
  if (intensity <= 0.001) return;

  const edgeWidth = Math.max(18, Math.min(viewW, viewH) * 0.2);
  const alpha = 0.12 + intensity * 0.3;

  ctx.save();

  const top = ctx.createLinearGradient(0, 0, 0, edgeWidth);
  top.addColorStop(0, `rgba(132, 26, 26, ${alpha.toFixed(3)})`);
  top.addColorStop(1, "rgba(132, 26, 26, 0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, viewW, edgeWidth);

  const bottom = ctx.createLinearGradient(0, viewH, 0, viewH - edgeWidth);
  bottom.addColorStop(0, `rgba(132, 26, 26, ${alpha.toFixed(3)})`);
  bottom.addColorStop(1, "rgba(132, 26, 26, 0)");
  ctx.fillStyle = bottom;
  ctx.fillRect(0, viewH - edgeWidth, viewW, edgeWidth);

  const left = ctx.createLinearGradient(0, 0, edgeWidth, 0);
  left.addColorStop(0, `rgba(132, 26, 26, ${(alpha * 0.85).toFixed(3)})`);
  left.addColorStop(1, "rgba(132, 26, 26, 0)");
  ctx.fillStyle = left;
  ctx.fillRect(0, 0, edgeWidth, viewH);

  const right = ctx.createLinearGradient(viewW, 0, viewW - edgeWidth, 0);
  right.addColorStop(0, `rgba(132, 26, 26, ${(alpha * 0.85).toFixed(3)})`);
  right.addColorStop(1, "rgba(132, 26, 26, 0)");
  ctx.fillStyle = right;
  ctx.fillRect(viewW - edgeWidth, 0, edgeWidth, viewH);

  const vignette = ctx.createRadialGradient(
    viewW / 2,
    viewH / 2,
    Math.min(viewW, viewH) * 0.38,
    viewW / 2,
    viewH / 2,
    Math.max(viewW, viewH) * 0.7
  );
  vignette.addColorStop(0, "rgba(120, 24, 24, 0)");
  vignette.addColorStop(1, `rgba(120, 24, 24, ${(0.08 + intensity * 0.14).toFixed(3)})`);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, viewW, viewH);

  ctx.restore();
}
