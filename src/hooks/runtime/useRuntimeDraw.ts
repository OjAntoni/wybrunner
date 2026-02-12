import { useCallback, type MutableRefObject } from "react";
import type { GameState } from "../../game/model/types";
import { updateHudOcclusion, type HudRectsCache } from "../../game/render/hudOcclusion";
import { drawScene } from "../../game/render/scene";

type UseRuntimeDrawParams = {
  touchEnabledRef: MutableRefObject<boolean>;
  fogSpritesRef: MutableRefObject<HTMLCanvasElement[] | null>;
  exploreCloudSpritesRef: MutableRefObject<HTMLCanvasElement[] | null>;
  hudTopRef: MutableRefObject<HTMLDivElement | null>;
  inventoryRef: MutableRefObject<HTMLElement | null>;
  hudRectsRef: MutableRefObject<HudRectsCache>;
  dprRef: MutableRefObject<number>;
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
};

export function useRuntimeDraw({
  touchEnabledRef,
  fogSpritesRef,
  exploreCloudSpritesRef,
  hudTopRef,
  inventoryRef,
  hudRectsRef,
  dprRef,
  canvasRef,
}: UseRuntimeDrawParams) {
  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, state: GameState, now: number) => {
      updateHudOcclusion({
        now,
        state,
        hudTopEl: hudTopRef.current,
        inventoryEl: inventoryRef.current,
        cache: hudRectsRef.current,
        dpr: dprRef.current,
        canvasWidth: canvasRef.current?.width ?? 0,
        canvasHeight: canvasRef.current?.height ?? 0,
        touchEnabled: touchEnabledRef.current,
      });
      drawScene({
        ctx,
        state,
        now,
        dpr: dprRef.current,
        touchEnabled: touchEnabledRef.current,
        fogSpritesRef,
        exploreCloudSpritesRef,
      });
    },
    [
      canvasRef,
      dprRef,
      exploreCloudSpritesRef,
      fogSpritesRef,
      hudRectsRef,
      hudTopRef,
      inventoryRef,
      touchEnabledRef,
    ]
  );

  return { draw };
}
