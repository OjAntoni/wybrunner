import { startTransition } from "react";
import type { MutableRefObject } from "react";
import { ITEMS_TARGET, PLAYER_HEARTS_MAX } from "../../game/config/constants";
import {
  updateCoinsDom,
  updateHeartsDom,
  updateSpikesDom,
  updateBombsDom,
  updateArtifactsDom,
} from "../../game/utils/updateGameUi";
import type { GameState, GameStatus, LoseReason, UIScreen } from "../../game/model/types";

const COIN_UI_SYNC_INTERVAL_MS = 80;

type StepGameFrameParams = {
  now: number;
  dt: number;
  ctx: CanvasRenderingContext2D;
  stateRef: MutableRefObject<GameState>;
  screenRef: MutableRefObject<UIScreen>;
  confirmRestartRef: MutableRefObject<boolean>;
  pausedRef: MutableRefObject<boolean>;
  statusRef: MutableRefObject<GameStatus>;
  updateStateRef: MutableRefObject<(state: GameState, dt: number, now: number) => void>;
  drawRef: MutableRefObject<(ctx: CanvasRenderingContext2D, state: GameState, now: number) => void>;
  setStatus: (value: GameStatus) => void;
  setItemsLeft: (value: number) => void;
  setLoseReason: (value: LoseReason) => void;
  measureTimings?: boolean;
  uiStateCache: {
    itemsLeft: number;
    coinsCollected: number;
    coinsDisplayed: number;
    coinsNextSyncAt: number;
    playerHearts: number;
    spikesLeft: number;
    bombsLeft: number;
    loseReason: LoseReason;
  };
  onTimings?: (updateMs: number, drawMs: number, activeFrame: boolean) => void;
};

export function stepGameFrame({
  now,
  dt,
  ctx,
  stateRef,
  screenRef,
  confirmRestartRef,
  pausedRef,
  statusRef,
  updateStateRef,
  drawRef,
  setStatus,
  setItemsLeft,
  setLoseReason,
  measureTimings,
  uiStateCache,
  onTimings,
}: StepGameFrameParams): number {
  const shouldMeasure = !!(measureTimings && onTimings);
  let nextNow = now;
  const state = stateRef.current;
  let updateMs = 0;
  let activeFrame = false;
  if (
    screenRef.current === "game" &&
    !confirmRestartRef.current &&
    !pausedRef.current &&
    state.status === "playing"
  ) {
    activeFrame = true;
    const updateStart = shouldMeasure ? performance.now() : 0;
    nextNow += dt * 1000;
    updateStateRef.current(state, dt, nextNow);
    if (state.status !== statusRef.current) {
      setStatus(state.status);
    }
    let nextItemsLeft: number | null = null;

    if (state.items.size !== uiStateCache.itemsLeft) {
      uiStateCache.itemsLeft = state.items.size;
      nextItemsLeft = state.items.size;
      // Update DOM directly to avoid React render jitter
      updateArtifactsDom(ITEMS_TARGET - state.items.size, ITEMS_TARGET);
    }
    if (state.coinsCollected !== uiStateCache.coinsCollected) {
      uiStateCache.coinsCollected = state.coinsCollected;
    }
    const shouldSyncCoins =
      uiStateCache.coinsDisplayed !== uiStateCache.coinsCollected &&
      (nextNow >= uiStateCache.coinsNextSyncAt || state.status !== "playing");
    if (shouldSyncCoins) {
      uiStateCache.coinsDisplayed = uiStateCache.coinsCollected;
      uiStateCache.coinsNextSyncAt = nextNow + COIN_UI_SYNC_INTERVAL_MS;
      // Update DOM directly to avoid React render jitter
      updateCoinsDom(uiStateCache.coinsDisplayed);
    }
    if (state.playerHearts !== uiStateCache.playerHearts) {
      uiStateCache.playerHearts = state.playerHearts;
      // Update DOM directly to avoid React render jitter
      updateHeartsDom(state.playerHearts, PLAYER_HEARTS_MAX);
    }
    if (state.spikesLeft !== uiStateCache.spikesLeft) {
      uiStateCache.spikesLeft = state.spikesLeft;
      // Update DOM directly to avoid React render jitter
      updateSpikesDom(state.spikesLeft);
    }
    if (state.bombsLeft !== uiStateCache.bombsLeft) {
      uiStateCache.bombsLeft = state.bombsLeft;
      // Update DOM directly to avoid React render jitter
      updateBombsDom(state.bombsLeft);
    }
    if (nextItemsLeft !== null) {
      startTransition(() => {
        if (nextItemsLeft !== null) setItemsLeft(nextItemsLeft);
      });
    }
    if (state.loseReason !== uiStateCache.loseReason) {
      uiStateCache.loseReason = state.loseReason;
      setLoseReason(state.loseReason);
    }
    if (shouldMeasure) {
      updateMs = performance.now() - updateStart;
    }
  }
  if (!activeFrame && uiStateCache.coinsDisplayed !== uiStateCache.coinsCollected) {
    uiStateCache.coinsDisplayed = uiStateCache.coinsCollected;
    uiStateCache.coinsNextSyncAt = nextNow + COIN_UI_SYNC_INTERVAL_MS;
    updateCoinsDom(uiStateCache.coinsDisplayed);
  }

  const drawStart = shouldMeasure ? performance.now() : 0;
  drawRef.current(ctx, state, nextNow);
  if (shouldMeasure) {
    const drawMs = performance.now() - drawStart;
    onTimings(updateMs, drawMs, activeFrame);
  }
  return nextNow;
}
