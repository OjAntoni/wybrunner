import {
  PLAYER_SPEED,
  TURRET_FIRE_PERIOD_MS,
  TURRET_LOCK_IN_TRANSITION_MS,
  TURRET_LOST_TARGET_RETURN_DELAY_MS,
  TURRET_PROJECTILE_SPEED_MULT,
  TURRET_SWEEP_PERIOD_MS,
  TURRET_VISION_ANGLE_DEG,
  TURRET_VISION_RADIUS_TILES,
} from "../../config/constants";
import type { GameState, Turret, Vec } from "../../model/types";
import { isTargetVisibleInVisionCone } from "../../world/hunterVision";
import { isPlayerInvisibleToEnemies } from "./playerDamage";
import { getGlobalActiveChunks, shouldUpdateEntity } from "../../world/chunkProcessing";

let turretIdCounter = 1;

const TWO_PI = Math.PI * 2;

function normalizeAngle(angle: number) {
  let out = angle;
  while (out <= -Math.PI) out += TWO_PI;
  while (out > Math.PI) out -= TWO_PI;
  return out;
}

export function createTurretAt(position: Vec, now: number): Turret {
  return {
    id: turretIdCounter++,
    pos: { ...position },
    facingAngle: 0,
    mode: "sweep",
    trackingAngle: 0,
    seenTargetAtMs: 0,
    nextShotMs: now + TURRET_FIRE_PERIOD_MS,
    lockTransitionStartMs: now,
    lockTransitionDir: -1,
  };
}

function updateSweepAngle(turret: Turret, dt: number) {
  const angularSpeed = TWO_PI / (TURRET_SWEEP_PERIOD_MS / 1000);
  turret.facingAngle = normalizeAngle(turret.facingAngle + angularSpeed * dt);
}

function tryShootAtPlayer(state: GameState, turret: Turret, now: number) {
  if (now < turret.nextShotMs) return;
  const toPlayer = {
    x: state.player.x - turret.pos.x,
    y: state.player.y - turret.pos.y,
  };
  const length = Math.hypot(toPlayer.x, toPlayer.y);
  if (length <= 0.0001) return;

  turret.nextShotMs = now + TURRET_FIRE_PERIOD_MS;
  const speed = PLAYER_SPEED * TURRET_PROJECTILE_SPEED_MULT;
  state.arrows.push({
    pos: { ...turret.pos },
    dir: {
      x: toPlayer.x / length,
      y: toPlayer.y / length,
    },
    speed,
    source: "turret",
  });
}

function enterTrackMode(turret: Turret, now: number) {
  if (turret.mode === "track") return;
  turret.mode = "track";
  turret.lockTransitionStartMs = now;
  turret.lockTransitionDir = 1;
  turret.nextShotMs = now + TURRET_LOCK_IN_TRANSITION_MS;
}

function enterSweepMode(turret: Turret, now: number) {
  if (turret.mode === "sweep") return;
  turret.mode = "sweep";
  turret.lockTransitionStartMs = now;
  turret.lockTransitionDir = -1;
}

export function updateTurrets(state: GameState, dt: number, now: number) {
  if (state.turrets.length === 0) return;

  const activeChunks = getGlobalActiveChunks();

  for (const turret of state.turrets) {
    // Skip turrets outside active chunks for performance
    // However, always update turrets that are tracking or in cooldown
    // to maintain gameplay integrity (they could have been tracking player)
    if (turret.mode === "sweep") {
      if (!shouldUpdateEntity(turret.pos.x, turret.pos.y, activeChunks)) {
        continue;
      }
    }
    const facingDirection = {
      x: Math.cos(turret.facingAngle),
      y: Math.sin(turret.facingAngle),
    };
    const playerInvisible = isPlayerInvisibleToEnemies(state, now);
    const seesPlayer =
      !playerInvisible &&
      isTargetVisibleInVisionCone(
        state.grid,
        turret.pos,
        facingDirection,
        state.player,
        TURRET_VISION_RADIUS_TILES,
        TURRET_VISION_ANGLE_DEG
      );

    if (seesPlayer) {
      enterTrackMode(turret, now);
      turret.seenTargetAtMs = now;
      turret.trackingAngle = Math.atan2(state.player.y - turret.pos.y, state.player.x - turret.pos.x);
      turret.facingAngle = turret.trackingAngle;
      tryShootAtPlayer(state, turret, now);
      continue;
    }

    if (turret.mode === "track") {
      turret.mode = "cooldown";
      turret.seenTargetAtMs = now;
      continue;
    }

    if (turret.mode === "cooldown") {
      turret.facingAngle = turret.trackingAngle;
      if (now - turret.seenTargetAtMs >= TURRET_LOST_TARGET_RETURN_DELAY_MS) {
        enterSweepMode(turret, now);
      }
      continue;
    }

    updateSweepAngle(turret, dt);
  }
}
