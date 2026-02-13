import {
  exploreSpecs,
  exploreNightSpecs,
  exploreStyle,
  fogSpecs,
  fogNightSpecs,
  fogStyle,
} from "./cloudSpriteDefs";
import { ensureSprites } from "./cloudSpriteFactory";

export type SpriteCacheRef = {
  current: HTMLCanvasElement[] | null;
};

const exploreNightSpriteRef: SpriteCacheRef = { current: null };
const fogNightSpriteRef: SpriteCacheRef = { current: null };

export function ensureExploreCloudSprites(spriteRef: SpriteCacheRef) {
  ensureSprites(spriteRef, exploreSpecs, exploreStyle);
}

export function ensureExploreCloudNightSprites() {
  ensureSprites(exploreNightSpriteRef, exploreNightSpecs, exploreStyle);
  return exploreNightSpriteRef.current;
}

export function ensureFogSprites(spriteRef: SpriteCacheRef) {
  ensureSprites(spriteRef, fogSpecs, fogStyle);
}

export function ensureFogNightSprites() {
  ensureSprites(fogNightSpriteRef, fogNightSpecs, fogStyle);
  return fogNightSpriteRef.current;
}
