import {
  CAMERA_CHASE_BLEND_IN_SMOOTHING,
  CAMERA_CHASE_BLEND_OUT_SMOOTHING,
  CAMERA_CHASE_EXIT_HOLD_MS,
  CAMERA_CHASE_HEARTBEAT_BPM,
  CAMERA_CHASE_HEARTBEAT_ZOOM_AMPLITUDE,
  CAMERA_CHASE_RELEASE_RADIUS_TILES,
  CAMERA_CHASE_TRIGGER_RADIUS_TILES,
  CAMERA_CHASE_ZOOM_MULT,
  CAMERA_POSITION_SMOOTHING,
  CAMERA_ZOOM_SMOOTHING,
  TILE_SIZE,
} from "../config/constants";
import type { GameState, Vec } from "../model/types";
import { clamp } from "../utils/math";

type SceneCameraState = {
  x: number;
  y: number;
  zoom: number;
  chaseBlend: number;
  heartbeatBlend: number;
  chaseActiveUntilMs: number;
  lastNowMs: number;
};

type UpdateSceneCameraParams = {
  state: GameState;
  now: number;
  cssW: number;
  cssH: number;
  baseZoom: number;
  worldW: number;
  worldH: number;
};

type SceneCameraResult = {
  x: number;
  y: number;
  zoom: number;
  viewW: number;
  viewH: number;
  heartbeatPulse: number;
};

let sceneCameraState: SceneCameraState | null = null;

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function smoothStep01(t: number) {
  const x = clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function frameAlpha(perFrameSmoothing: number, dtMs: number) {
  const safeDt = clamp(dtMs, 0, 24);
  const frameUnits = safeDt / 16.6667;
  return Math.min(0.2, 1 - Math.pow(1 - perFrameSmoothing, frameUnits));
}

function heartbeatZoomPulse(now: number, bpm: number) {
  const beatMs = 60000 / Math.max(1, bpm);
  const t = (now % beatMs) / beatMs;

  if (t < 0.28) {
    return smoothStep01(t / 0.28);
  }
  if (t < 0.74) {
    return 1 - smoothStep01((t - 0.28) / 0.46);
  }
  return 0;
}

function hasNearbyChasingHunter(state: GameState, radiusTiles: number) {
  const maxDistSq = radiusTiles * radiusTiles;
  const playerX = state.player.x;
  const playerY = state.player.y;
  for (const hunter of state.hunters) {
    if (hunter.mode !== "chase") continue;
    const dx = hunter.pos.x - playerX;
    const dy = hunter.pos.y - playerY;
    if (dx * dx + dy * dy <= maxDistSq) return true;
  }
  return false;
}

export function updateSceneCamera({
  state,
  now,
  cssW,
  cssH,
  baseZoom,
  worldW,
  worldH,
}: UpdateSceneCameraParams): SceneCameraResult {
  const previousNow = sceneCameraState?.lastNowMs ?? now;
  const dtMs = Math.max(0, now - previousNow);

  const chaseTriggerActive = hasNearbyChasingHunter(state, CAMERA_CHASE_TRIGGER_RADIUS_TILES);
  const chaseReleaseActive = hasNearbyChasingHunter(state, CAMERA_CHASE_RELEASE_RADIUS_TILES);

  const prevChaseUntil = sceneCameraState?.chaseActiveUntilMs ?? 0;
  const chaseActiveUntilMs = chaseTriggerActive
    ? now + CAMERA_CHASE_EXIT_HOLD_MS
    : prevChaseUntil;
  const chaseWanted = chaseTriggerActive || (chaseReleaseActive && now < chaseActiveUntilMs);

  const chaseTarget = chaseWanted ? 1 : 0;
  const prevChaseBlend = sceneCameraState?.chaseBlend ?? chaseTarget;
  const chaseBlendSmoothing = chaseTarget > prevChaseBlend
    ? CAMERA_CHASE_BLEND_IN_SMOOTHING
    : CAMERA_CHASE_BLEND_OUT_SMOOTHING;
  const chaseBlend = lerp(prevChaseBlend, chaseTarget, frameAlpha(chaseBlendSmoothing, dtMs));

  const prevHeartbeatBlend = sceneCameraState?.heartbeatBlend ?? chaseTarget;
  const heartbeatBlend = lerp(prevHeartbeatBlend, chaseTarget, frameAlpha(0.02, dtMs));
  const chaseZoomTarget = baseZoom * lerp(1, CAMERA_CHASE_ZOOM_MULT, chaseBlend);
  const heartbeat = heartbeatZoomPulse(now, CAMERA_CHASE_HEARTBEAT_BPM);
  const heartbeatZoom = 1 - CAMERA_CHASE_HEARTBEAT_ZOOM_AMPLITUDE * heartbeatBlend * heartbeat;
  const nextZoomTarget = chaseZoomTarget * heartbeatZoom;
  const nextZoom =
    sceneCameraState === null
      ? nextZoomTarget
      : lerp(sceneCameraState.zoom, nextZoomTarget, frameAlpha(CAMERA_ZOOM_SMOOTHING, dtMs));

  const viewW = cssW / nextZoom;
  const viewH = cssH / nextZoom;
  const target = getCamera(state.player, viewW, viewH, worldW, worldH);

  if (sceneCameraState === null) {
    sceneCameraState = {
      x: target.x,
      y: target.y,
      zoom: nextZoom,
      chaseBlend,
      heartbeatBlend,
      chaseActiveUntilMs,
      lastNowMs: now,
    };
    return {
      x: sceneCameraState.x,
      y: sceneCameraState.y,
      zoom: sceneCameraState.zoom,
      viewW,
      viewH,
      heartbeatPulse: chaseBlend * heartbeat,
    };
  }

  const snapDistance = Math.max(viewW, viewH) * 1.35;
  const dx = target.x - sceneCameraState.x;
  const dy = target.y - sceneCameraState.y;
  if (Math.abs(dx) > snapDistance || Math.abs(dy) > snapDistance) {
    sceneCameraState.x = target.x;
    sceneCameraState.y = target.y;
  } else {
    const positionAlpha = frameAlpha(CAMERA_POSITION_SMOOTHING, dtMs);
    sceneCameraState.x = lerp(sceneCameraState.x, target.x, positionAlpha);
    sceneCameraState.y = lerp(sceneCameraState.y, target.y, positionAlpha);
  }
  sceneCameraState.zoom = nextZoom;
  sceneCameraState.chaseBlend = chaseBlend;
  sceneCameraState.heartbeatBlend = heartbeatBlend;
  sceneCameraState.chaseActiveUntilMs = chaseActiveUntilMs;
  sceneCameraState.lastNowMs = now;

  if (worldW <= viewW) {
    sceneCameraState.x = (worldW - viewW) / 2;
  } else {
    sceneCameraState.x = clamp(sceneCameraState.x, 0, worldW - viewW);
  }
  if (worldH <= viewH) {
    sceneCameraState.y = (worldH - viewH) / 2;
  } else {
    sceneCameraState.y = clamp(sceneCameraState.y, 0, worldH - viewH);
  }

  return {
    x: sceneCameraState.x,
    y: sceneCameraState.y,
    zoom: sceneCameraState.zoom,
    viewW,
    viewH,
    heartbeatPulse: chaseBlend * heartbeat,
  };
}

export function resetSceneCamera() {
  sceneCameraState = null;
}

export function getCamera(
  player: Vec,
  viewW: number,
  viewH: number,
  worldW: number,
  worldH: number
) {
  let x = player.x * TILE_SIZE - viewW / 2;
  let y = player.y * TILE_SIZE - viewH / 2;
  if (worldW <= viewW) x = (worldW - viewW) / 2;
  else x = clamp(x, 0, worldW - viewW);
  if (worldH <= viewH) y = (worldH - viewH) / 2;
  else y = clamp(y, 0, worldH - viewH);
  return { x, y };
}
