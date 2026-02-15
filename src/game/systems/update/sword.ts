import { SWORD_SWING_DURATION_MS } from "../../config/constants";
import type { GameState, Vec } from "../../model/types";
import { cellKey, inBounds } from "../../utils/grid";
import { castVisionRayDistance } from "../../world/hunterVision";
import { applyHunterDeathDrop } from "./hunterDrops";

function getCardinalFacing(facing: Vec) {
  const absX = Math.abs(facing.x);
  const absY = Math.abs(facing.y);
  if (absX >= absY) {
    const signX = facing.x >= 0 ? 1 : -1;
    return { x: signX, y: 0 };
  }
  const signY = facing.y >= 0 ? 1 : -1;
  return { x: 0, y: signY };
}

function isOffsetBlocked(grid: GameState["grid"], baseX: number, baseY: number, dx: number, dy: number) {
  const targetX = baseX + dx;
  const targetY = baseY + dy;
  if (!inBounds(targetX, targetY)) return true;
  if (grid[targetY][targetX] !== 0) return true;
  const origin = { x: baseX + 0.5, y: baseY + 0.5 };
  const targetPos = { x: targetX + 0.5, y: targetY + 0.5 };
  const toTargetX = targetPos.x - origin.x;
  const toTargetY = targetPos.y - origin.y;
  const dist = Math.hypot(toTargetX, toTargetY);
  if (dist <= 0.0001) return false;
  const angle = Math.atan2(toTargetY, toTargetX);
  const visible = castVisionRayDistance(grid, origin, angle, dist);
  return dist > visible + 0.08;
}

function buildSwordHitSet(state: GameState) {
  const facing = state.playerFacingIndicator;
  const facingLen = Math.hypot(facing.x, facing.y);
  if (facingLen <= 0.0001) return new Set<string>();
  const dir = { x: facing.x / facingLen, y: facing.y / facingLen };
  const cardinal = getCardinalFacing(dir);
  const right = { x: -cardinal.y, y: cardinal.x };
  const left = { x: cardinal.y, y: -cardinal.x };
  const baseX = Math.floor(state.player.x);
  const baseY = Math.floor(state.player.y);
  const offsets = [
    cardinal,
    left,
    right,
    { x: cardinal.x * 2, y: cardinal.y * 2 },
    { x: cardinal.x + left.x, y: cardinal.y + left.y },
    { x: cardinal.x + right.x, y: cardinal.y + right.y },
  ];

  const hitKeys = new Set<string>();
  for (const offset of offsets) {
    const tileX = baseX + offset.x;
    const tileY = baseY + offset.y;
    if (!inBounds(tileX, tileY)) continue;
    if (isOffsetBlocked(state.grid, baseX, baseY, offset.x, offset.y)) continue;
    hitKeys.add(cellKey(tileX, tileY));
  }
  return hitKeys;
}

export function updateSwordHits(state: GameState, now: number) {
  const startMs = state.swordSwingStartMs;
  if (startMs === null) return;
  if (state.swordSwingHitMs === startMs) return;
  if (now - startMs > SWORD_SWING_DURATION_MS) return;

  state.swordSwingHitMs = startMs;
  const hitKeys = buildSwordHitSet(state);
  if (hitKeys.size === 0) return;

  state.monsters = state.monsters.filter((monster) => {
    if (monster.kind !== "chaser") return true;
    const mx = Math.floor(monster.pos.x);
    const my = Math.floor(monster.pos.y);
    if (!hitKeys.has(cellKey(mx, my))) return true;
    monster.health = Math.max(0, monster.health - 1);
    if (monster.health > 0) {
      monster.hurtUntilMs = Math.max(monster.hurtUntilMs, now + 1200);
    }
    return monster.health > 0;
  });

  state.hunters = state.hunters.filter((hunter) => {
    const hx = Math.floor(hunter.pos.x);
    const hy = Math.floor(hunter.pos.y);
    if (!hitKeys.has(cellKey(hx, hy))) return true;
    hunter.health = Math.max(0, hunter.health - 1);
    if (hunter.health > 0) {
      hunter.hurtUntilMs = Math.max(hunter.hurtUntilMs, now + 1200);
      hunter.stunUntil = Math.max(hunter.stunUntil, now + 700);
      hunter.mode = "chase";
      hunter.lastSeenPlayer = { ...state.player };
      hunter.target = null;
      hunter.nervousScanActive = false;
      hunter.nervousScanIndex = 0;
      hunter.nervousScanStep = 1;
      hunter.nervousScanNextStepMs = 0;
      hunter.nervousScanUntilMs = 0;
      hunter.chaseOnHit = true;
      hunter.backCheckState = "none";
      hunter.backCheckForwardDir = null;
      hunter.backCheckHoldUntilMs = 0;
      hunter.patrolStepsUntilTurn = 0;
      hunter.ghostCommandTarget = null;
      hunter.ghostCommandGhostId = null;
      hunter.chaserPlaceStartMs = 0;
      hunter.chaserPlaceEndMs = 0;
      hunter.turretPlaceStartMs = 0;
      hunter.turretPlaceEndMs = 0;
    }
    if (hunter.health <= 0) {
      applyHunterDeathDrop(state, { x: hx, y: hy });
    }
    return hunter.health > 0;
  });
}
