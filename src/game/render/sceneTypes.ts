import type { GameState } from "../model/types";
import type { SpriteCacheRef } from "./cloudSprites";

export type DrawSceneParams = {
  ctx: CanvasRenderingContext2D;
  state: GameState;
  now: number;
  dpr: number;
  touchEnabled: boolean;
  fogSpritesRef: SpriteCacheRef;
  exploreCloudSpritesRef: SpriteCacheRef;
};

export type VisibleTileBounds = {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
};

export type SceneViewport = {
  camX: number;
  camY: number;
  viewW: number;
  viewH: number;
  bounds: VisibleTileBounds;
};
