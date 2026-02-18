import { Application } from "pixi.js";
import type { GameState } from "../model/types";
import { GRID_H, GRID_W, TILE_SIZE } from "../config/constants";
import { ViewportManager } from "./ViewportManager";
import { LayerManager } from "./layers/LayerManager";

export interface PixiAppConfig {
  container: HTMLElement;
  backgroundColor?: number;
  resolution?: number;
}

export class PixiApp {
  private app: Application;
  private viewportManager!: ViewportManager;
  private layerManager!: LayerManager;
  private isDestroyed = false;
  private isInitialized = false;
  private container: HTMLElement;

  constructor(config: PixiAppConfig) {
    const { container, backgroundColor = 0x0a0c12, resolution = window.devicePixelRatio } = config;
    
    this.container = container;

    // Create Pixi Application with init options
    this.app = new Application();
    
    // Initialize asynchronously
    this.init(backgroundColor, resolution);
  }

  private async init(backgroundColor: number, resolution: number): Promise<void> {
    await this.app.init({
      resizeTo: this.container,
      backgroundColor,
      resolution,
      autoDensity: true,
      antialias: false,
      powerPreference: "high-performance",
    });

    // Add canvas to container after initialization
    if (this.app.canvas) {
      this.container.appendChild(this.app.canvas as HTMLCanvasElement);
    }

    // Setup viewport (camera)
    const worldWidth = GRID_W * TILE_SIZE;
    const worldHeight = GRID_H * TILE_SIZE;
    this.viewportManager = new ViewportManager(this.app, worldWidth, worldHeight);

    // Setup layers
    this.layerManager = new LayerManager(this.viewportManager.viewport);

    // Disable default ticker - we'll use our own game loop
    this.app.ticker.stop();
    
    this.isInitialized = true;
  }

  get canvas(): HTMLCanvasElement | null {
    return this.app.canvas as HTMLCanvasElement;
  }

  get renderer() {
    return this.app.renderer;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  render(state: GameState, now: number, dt: number): void {
    if (this.isDestroyed || !this.isInitialized) return;

    // Update camera
    this.viewportManager.update(state, now, dt);

    // Update all layers
    this.layerManager.update(state, now, dt);

    // Render frame
    this.app.renderer.render(this.app.stage);
  }

  resize(): void {
    if (this.isDestroyed || !this.isInitialized) return;
    this.app.resize();
  }

  destroy(): void {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    if (this.isInitialized) {
      this.layerManager.destroy();
      this.viewportManager.destroy();
      this.app.destroy();
    }
  }
}
