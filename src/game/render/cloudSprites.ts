import {
  exploreSpecs,
  exploreStyle,
  fogSpecs,
  fogStyle,
} from "./cloudSpriteDefs";
import { ensureSprites } from "./cloudSpriteFactory";

export type SpriteCacheRef = {
  current: HTMLCanvasElement[] | null;
};

export function ensureExploreCloudSprites(spriteRef: SpriteCacheRef) {
  ensureSprites(spriteRef, exploreSpecs, exploreStyle);
}

export function ensureFogSprites(spriteRef: SpriteCacheRef) {
  ensureSprites(spriteRef, fogSpecs, fogStyle);
}
