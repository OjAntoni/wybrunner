import {
  FOG_AREA_COUNT_MAX,
  FOG_AREA_DURATION_MAX_MS,
  FOG_AREA_DURATION_MIN_MS,
} from "../config/constants";
import type { GameState, Vec } from "../model/types";
import { mulberry32 } from "../utils/random";
import { buildFogAreaClip, buildFogAreaClouds } from "../world/fogAreas";
import {
  buildFogAnchors,
  buildOccupiedFogCells,
  getFogMinDistanceSq,
  growFogCells,
  pickFogSeed,
} from "./fogAreaGrowth";

let fogAreaIdCounter = 1;

export function spawnFogAreas(state: GameState, now: number, playerCell: Vec) {
  const rng = mulberry32((Math.floor(now) ^ 0x7f4a7c15) >>> 0);
  const count = 1 + Math.floor(rng() * FOG_AREA_COUNT_MAX);
  const occupied = buildOccupiedFogCells(state);

  const minDistSq = getFogMinDistanceSq();
  const targetSizeMin = 70;
  const targetSizeMax = 190;

  for (let n = 0; n < count; n += 1) {
    const duration =
      FOG_AREA_DURATION_MIN_MS +
      rng() * (FOG_AREA_DURATION_MAX_MS - FOG_AREA_DURATION_MIN_MS);
    const start = now;
    const end = now + duration;

    // Pick a seed on an open tile, far from the player, and not overlapping existing areas.
    const seed = pickFogSeed(state, rng, playerCell, occupied, minDistSq);
    if (!seed) continue;

    const targetSize =
      targetSizeMin + Math.floor(rng() * (targetSizeMax - targetSizeMin));
    const { cells, cellSet } = growFogCells(
      state,
      rng,
      playerCell,
      occupied,
      minDistSq,
      seed,
      targetSize
    );

    const anchors = buildFogAnchors(cells, rng);
    const id = fogAreaIdCounter++;
    const clip = buildFogAreaClip(anchors, id);
    const clouds = buildFogAreaClouds(id, anchors, cells.length);

    state.fogAreas.push({
      id,
      cells,
      cellSet,
      anchors,
      clipPath: clip.path,
      bounds: clip.bounds,
      clouds,
      start,
      end,
    });
  }
}
