import { Container } from "pixi.js";
import type { GameState } from "../../model/types";
import type { Renderable } from "./Renderable";

export class EffectsLayer implements Renderable {
  public displayObject: Container;

  constructor(parent: Container) {
    this.displayObject = new Container();
    parent.addChild(this.displayObject);
  }

  update(_state: GameState, _now: number, _dt: number): void {
    // TODO: Implement effects rendering (explosions, sword swings)
  }

  destroy(): void {
    this.displayObject.destroy({ children: true });
  }
}
