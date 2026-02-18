import { Container } from "pixi.js";
import type { GameState } from "../../model/types";
import type { Renderable } from "./Renderable";

export class CloudLayer implements Renderable {
  public displayObject: Container;

  constructor(parent: Container) {
    this.displayObject = new Container();
    parent.addChild(this.displayObject);
  }

  update(_state: GameState, _now: number, _dt: number): void {
    // TODO: Implement cloud/fog rendering
  }

  destroy(): void {
    this.displayObject.destroy({ children: true });
  }
}
