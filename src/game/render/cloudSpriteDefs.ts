import type { RGB } from "../model/types";

export type SpriteSpec = {
  seed: number;
  base: RGB;
  hi: RGB;
  lo: RGB;
};

export type SpriteStyle = {
  size: number;
  baseSize: number;
  variance: number;
  hiOffsetX: number;
  hiOffsetY: number;
  hiScale: number;
  hiAlpha: number;
  loOffsetX: number;
  loOffsetY: number;
  loScale: number;
  loAlpha: number;
};

export const exploreSpecs: SpriteSpec[] = [
  {
    seed: 5011,
    base: { r: 244, g: 246, b: 250 },
    hi: { r: 255, g: 255, b: 255 },
    lo: { r: 215, g: 219, b: 226 },
  },
  {
    seed: 7331,
    base: { r: 224, g: 228, b: 236 },
    hi: { r: 244, g: 247, b: 252 },
    lo: { r: 192, g: 198, b: 208 },
  },
  {
    seed: 9901,
    base: { r: 202, g: 208, b: 218 },
    hi: { r: 227, g: 233, b: 241 },
    lo: { r: 170, g: 176, b: 186 },
  },
];

export const exploreStyle: SpriteStyle = {
  size: 112,
  baseSize: 66,
  variance: 10,
  hiOffsetX: 7,
  hiOffsetY: -2,
  hiScale: 0.8,
  hiAlpha: 0.88,
  loOffsetX: -7,
  loOffsetY: 5,
  loScale: 0.88,
  loAlpha: 0.74,
};

export const fogSpecs: SpriteSpec[] = [
  {
    seed: 911,
    base: { r: 96, g: 102, b: 112 },
    hi: { r: 132, g: 138, b: 152 },
    lo: { r: 72, g: 76, b: 84 },
  },
  {
    seed: 1337,
    base: { r: 114, g: 120, b: 132 },
    hi: { r: 150, g: 156, b: 170 },
    lo: { r: 86, g: 90, b: 100 },
  },
  {
    seed: 2027,
    base: { r: 132, g: 138, b: 152 },
    hi: { r: 170, g: 176, b: 192 },
    lo: { r: 96, g: 102, b: 112 },
  },
];

export const fogStyle: SpriteStyle = {
  size: 96,
  baseSize: 62,
  variance: 8,
  hiOffsetX: 6,
  hiOffsetY: -2,
  hiScale: 0.82,
  hiAlpha: 0.85,
  loOffsetX: -6,
  loOffsetY: 4,
  loScale: 0.9,
  loAlpha: 0.75,
};
