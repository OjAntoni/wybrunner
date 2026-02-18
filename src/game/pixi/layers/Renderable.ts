import type { Container } from "pixi.js";
import type { GameState } from "../../model/types";

export interface Renderable {
  readonly displayObject: Container;
  update(state: GameState, now: number, dt: number): void;
  destroy(): void;
}
