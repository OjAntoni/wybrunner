import type { GameState, Vec } from "../../model/types";
import { isPlayerInsideFogArea } from "../../world/fogAreas";

export function updateTimedSystems(
  state: GameState,
  dt: number,
  now: number,
  playerCell: Vec
) {
  state.explosions = state.explosions.filter((explosion) => now - explosion.start < 600);
  if (state.playerPopup && now >= state.playerPopup.endMs) {
    state.playerPopup = null;
  }
  state.fogAreas = state.fogAreas.filter((area) => now < area.end);

  // Smooth "inside fog area" factor to avoid flicker at boundaries while walking.
  if (state.fogAreas.length === 0) {
    state.fogAreaInside.clear();
    return;
  }

  const alive = new Set<number>();
  for (const area of state.fogAreas) alive.add(area.id);
  for (const id of Array.from(state.fogAreaInside.keys())) {
    if (!alive.has(id)) state.fogAreaInside.delete(id);
  }

  const k = 1 - Math.exp(-dt / 0.45);
  for (const area of state.fogAreas) {
    const target = isPlayerInsideFogArea(area, playerCell) ? 1 : 0;
    const current = state.fogAreaInside.get(area.id) ?? 0;
    state.fogAreaInside.set(area.id, current + (target - current) * k);
  }
}
