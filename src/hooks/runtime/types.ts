import type { MutableRefObject } from "react";
import type { GameState, LoseReason, Vec } from "../../game/model/types";
import type { HudRectsCache } from "../../game/render/hudOcclusion";

export type UseGameRuntimeParams = {
  stateRef: MutableRefObject<GameState>;
  gameNowRef: MutableRefObject<number>;
  keysRef: MutableRefObject<Set<string>>;
  touchMoveRef: MutableRefObject<Vec>;
  touchEnabledRef: MutableRefObject<boolean>;
  fogSpritesRef: MutableRefObject<HTMLCanvasElement[] | null>;
  exploreCloudSpritesRef: MutableRefObject<HTMLCanvasElement[] | null>;
  hudTopRef: MutableRefObject<HTMLDivElement | null>;
  inventoryRef: MutableRefObject<HTMLElement | null>;
  hudRectsRef: MutableRefObject<HudRectsCache>;
  dprRef: MutableRefObject<number>;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  setSpikesLeft: (value: number) => void;
  setBombsLeft: (value: number) => void;
  setCoinsCollected: (value: number) => void;
  setLoseReason: (value: LoseReason) => void;
};
