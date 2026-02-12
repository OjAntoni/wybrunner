import { mulberry32 } from "../utils/random";
import { drawCloudBlob } from "./primitives";
import type { SpriteSpec, SpriteStyle } from "./cloudSpriteDefs";
import type { SpriteCacheRef } from "./cloudSprites";

function makeCloudSprite(spec: SpriteSpec, style: SpriteStyle) {
  const canvas = document.createElement("canvas");
  canvas.width = style.size;
  canvas.height = style.size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = false;
  const cx = style.size / 2;
  const cy = style.size / 2;
  const rng = mulberry32(spec.seed);
  const s = style.baseSize + rng() * style.variance;

  drawCloudBlob(ctx, cx, cy, s, 1, spec.base);
  drawCloudBlob(
    ctx,
    cx + style.hiOffsetX,
    cy + style.hiOffsetY,
    s * style.hiScale,
    style.hiAlpha,
    spec.hi
  );
  drawCloudBlob(
    ctx,
    cx + style.loOffsetX,
    cy + style.loOffsetY,
    s * style.loScale,
    style.loAlpha,
    spec.lo
  );
  return canvas;
}

export function ensureSprites(
  spriteRef: SpriteCacheRef,
  specs: SpriteSpec[],
  style: SpriteStyle
) {
  if (spriteRef.current) return;
  spriteRef.current = specs.map((spec) => makeCloudSprite(spec, style));
}
