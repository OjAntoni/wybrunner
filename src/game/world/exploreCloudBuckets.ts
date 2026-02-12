import { EXPLORE_CLOUD_BUCKET_SIZE, GRID_H, GRID_W, TILE_SIZE } from "../config/constants";
import type { ExploreCloud, ExploreCloudBuckets } from "../model/types";

export function buildExploreCloudBuckets(clouds: ExploreCloud[]): ExploreCloudBuckets {
  const bucketSize = EXPLORE_CLOUD_BUCKET_SIZE;
  const worldW = GRID_W * TILE_SIZE;
  const worldH = GRID_H * TILE_SIZE;
  const cols = Math.max(1, Math.ceil(worldW / bucketSize));
  const rows = Math.max(1, Math.ceil(worldH / bucketSize));
  const buckets: number[][] = Array.from({ length: cols * rows }, () => []);

  for (let i = 0; i < clouds.length; i += 1) {
    const cloud = clouds[i];
    const minWX = cloud.x - cloud.half;
    const minWY = cloud.y - cloud.half;
    const maxWX = cloud.x + cloud.half;
    const maxWY = cloud.y + cloud.half;

    if (maxWX < 0 || maxWY < 0 || minWX > worldW || minWY > worldH) continue;

    const minBX = Math.max(0, Math.min(cols - 1, Math.floor(minWX / bucketSize)));
    const maxBX = Math.max(0, Math.min(cols - 1, Math.floor(maxWX / bucketSize)));
    const minBY = Math.max(0, Math.min(rows - 1, Math.floor(minWY / bucketSize)));
    const maxBY = Math.max(0, Math.min(rows - 1, Math.floor(maxWY / bucketSize)));

    for (let by = minBY; by <= maxBY; by += 1) {
      for (let bx = minBX; bx <= maxBX; bx += 1) {
        buckets[by * cols + bx].push(i);
      }
    }
  }

  return { bucketSize, cols, rows, buckets };
}
