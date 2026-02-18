import { Container, Graphics } from "pixi.js";
import type { GameState } from "../../model/types";
import { GRID_H, GRID_W, TILE_SIZE } from "../../config/constants";
import type { Renderable } from "./Renderable";

export class TerrainLayer implements Renderable {
  public displayObject: Container;
  private background: Graphics | null = null;
  private initialized = false;

  constructor(parent: Container) {
    this.displayObject = new Container();
    parent.addChild(this.displayObject);
  }

  update(state: GameState, _now: number, _dt: number): void {
    if (!this.initialized) {
      this.createTerrain(state);
      this.initialized = true;
    }
  }

  private createTerrain(state: GameState): void {
    const graphics = new Graphics();
    
    const worldWidth = GRID_W * TILE_SIZE;
    const worldHeight = GRID_H * TILE_SIZE;
    
    // Draw floor background
    graphics.rect(0, 0, worldWidth, worldHeight);
    graphics.fill({ color: 0x1a5a45 });
    
    // Draw walls
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        const tileType = state.grid[y]?.[x] ?? 0;
        if (tileType === 1) {
          graphics.rect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          graphics.fill({ color: 0x3a3a60 });
        }
      }
    }
    
    this.background = graphics;
    this.displayObject.addChild(graphics);
  }

  destroy(): void {
    this.background?.destroy();
    this.displayObject.destroy({ children: true });
  }
}
