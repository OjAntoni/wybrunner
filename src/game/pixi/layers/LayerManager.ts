import { Container } from "pixi.js";
import type { GameState } from "../../model/types";
import type { Renderable } from "./Renderable";
import { TerrainLayer } from "./TerrainLayer";
import { EntityLayer } from "./EntityLayer";
import { EffectsLayer } from "./EffectsLayer";
import { CloudLayer } from "./CloudLayer";

export class LayerManager implements Renderable {
  public displayObject: Container;
  private layers: Renderable[] = [];

  constructor(viewport: Container) {
    this.displayObject = new Container();
    viewport.addChild(this.displayObject);

    // Create layers in render order (back to front)
    this.layers = [
      new TerrainLayer(this.displayObject),      // 0 - Terrain tiles
      new EffectsLayer(this.displayObject),      // 1 - Explosions, bursts
      new CloudLayer(this.displayObject),        // 2 - Fog and exploration clouds
      new EntityLayer(this.displayObject),       // 3 - Entities (hunters, player, etc)
    ];
  }

  update(state: GameState, now: number, dt: number): void {
    for (const layer of this.layers) {
      layer.update(state, now, dt);
    }
  }

  destroy(): void {
    for (const layer of this.layers) {
      layer.destroy();
    }
    this.layers = [];
    this.displayObject.destroy({ children: true });
  }
}
