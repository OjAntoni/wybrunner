import { Application, Container } from "pixi.js";
import type { GameState } from "../model/types";
import { clamp } from "../utils/math";
import {
  CAMERA_CHASE_BLEND_IN_SMOOTHING,
  CAMERA_CHASE_BLEND_OUT_SMOOTHING,
  CAMERA_CHASE_EXIT_HOLD_MS,
  CAMERA_CHASE_HEARTBEAT_BPM,
  CAMERA_CHASE_HEARTBEAT_ZOOM_AMPLITUDE,
  CAMERA_CHASE_RELEASE_RADIUS_TILES,
  CAMERA_CHASE_TRIGGER_RADIUS_TILES,
  CAMERA_CHASE_ZOOM_MULT,
  CAMERA_POSITION_SMOOTHING,
  CAMERA_ZOOM_SMOOTHING,
  TILE_SIZE,
} from "../config/constants";

export class ViewportManager {
  public viewport: Container;
  private app: Application;
  private worldWidth: number;
  private worldHeight: number;

  // Camera state
  private x = 0;
  private y = 0;
  private zoom = 1;
  private chaseBlend = 0;
  private chaseActiveUntilMs = 0;
  private lastNowMs = 0;

  constructor(app: Application, worldWidth: number, worldHeight: number) {
    this.app = app;
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;

    // Create viewport container
    this.viewport = new Container();
    this.app.stage.addChild(this.viewport);

    console.log("ViewportManager created:", { 
      worldWidth, 
      worldHeight, 
      screenWidth: app.screen.width, 
      screenHeight: app.screen.height 
    });
  }

  update(state: GameState, now: number, _dt: number): void {
    const previousNow = this.lastNowMs || now;
    const dtMs = Math.max(0, now - previousNow);
    this.lastNowMs = now;

    // Update camera position and zoom
    this.updateCamera(state, now, dtMs);

    // Apply transform to viewport
    // Position is negative to move world opposite to camera direction
    const viewX = -this.x;
    const viewY = -this.y;
    
    this.viewport.position.set(viewX, viewY);
    this.viewport.scale.set(this.zoom);
  }

  private updateCamera(state: GameState, now: number, dtMs: number): void {
    const screenW = this.app.screen.width;
    const screenH = this.app.screen.height;
    
    // Calculate base zoom
    const minDimension = Math.min(screenW, screenH);
    const baseZoom = Math.max(1, minDimension / 600); // Zoom to show ~600px worth of content
    
    // Check for nearby chasing hunters
    const { triggerActive, releaseActive } = this.hasNearbyChasingHunter(state);

    // Update chase blend
    const prevChaseUntil = this.chaseActiveUntilMs;
    this.chaseActiveUntilMs = triggerActive ? now + CAMERA_CHASE_EXIT_HOLD_MS : prevChaseUntil;
    const chaseWanted = triggerActive || (releaseActive && now < this.chaseActiveUntilMs);

    const chaseTarget = chaseWanted ? 1 : 0;
    const prevChaseBlend = this.chaseBlend;
    const chaseBlendSmoothing = chaseTarget > prevChaseBlend
      ? CAMERA_CHASE_BLEND_IN_SMOOTHING
      : CAMERA_CHASE_BLEND_OUT_SMOOTHING;
    this.chaseBlend = this.lerp(prevChaseBlend, chaseTarget, this.frameAlpha(chaseBlendSmoothing, dtMs));

    // Calculate target zoom with heartbeat
    const chaseZoomTarget = baseZoom * this.lerp(1, CAMERA_CHASE_ZOOM_MULT, this.chaseBlend);
    const beatPeriodMs = 60000 / CAMERA_CHASE_HEARTBEAT_BPM;
    const beatPhase = (now % beatPeriodMs) / beatPeriodMs;
    const beatPulse = Math.sin(beatPhase * Math.PI * 2) * 0.5 + 0.5;
    const heartbeatZoom = 1 + CAMERA_CHASE_HEARTBEAT_ZOOM_AMPLITUDE * beatPulse * this.chaseBlend;
    const targetZoom = chaseZoomTarget * heartbeatZoom;

    // Smooth zoom
    this.zoom = this.lerp(this.zoom, targetZoom, this.frameAlpha(CAMERA_ZOOM_SMOOTHING, dtMs));

    // Calculate view dimensions in world space
    const viewW = screenW / this.zoom;
    const viewH = screenH / this.zoom;

    // Calculate target position (centered on player in world pixels)
    const playerWorldX = state.player.x * TILE_SIZE;
    const playerWorldY = state.player.y * TILE_SIZE;
    
    let targetX = playerWorldX - viewW / 2;
    let targetY = playerWorldY - viewH / 2;

    // Clamp to world bounds (keep camera within valid range)
    // Camera can go from 0 to (worldSize - viewSize), but not negative
    const maxCamX = Math.max(0, this.worldWidth - viewW);
    const maxCamY = Math.max(0, this.worldHeight - viewH);
    
    targetX = clamp(targetX, 0, maxCamX);
    targetY = clamp(targetY, 0, maxCamY);

    // If world is smaller than view, center it
    if (this.worldWidth <= viewW) {
      targetX = -viewW / 2 + this.worldWidth / 2;
    }
    if (this.worldHeight <= viewH) {
      targetY = -viewH / 2 + this.worldHeight / 2;
    }

    // Apply smoothing
    const positionAlpha = this.frameAlpha(CAMERA_POSITION_SMOOTHING, dtMs);
    this.x = this.lerp(this.x, targetX, positionAlpha);
    this.y = this.lerp(this.y, targetY, positionAlpha);
    
    // Debug first frame
    if (this.lastNowMs === now) {
      console.log("Camera debug:", {
        screenW, screenH, viewW, viewH, 
        playerWorldX, playerWorldY,
        targetX, targetY,
        maxCamX, maxCamY,
        cameraX: this.x, cameraY: this.y,
        zoom: this.zoom
      });
    }
  }

  private hasNearbyChasingHunter(state: GameState): { triggerActive: boolean; releaseActive: boolean } {
    const triggerRadiusSq = CAMERA_CHASE_TRIGGER_RADIUS_TILES * CAMERA_CHASE_TRIGGER_RADIUS_TILES;
    const releaseRadiusSq = CAMERA_CHASE_RELEASE_RADIUS_TILES * CAMERA_CHASE_RELEASE_RADIUS_TILES;
    const playerX = state.player.x;
    const playerY = state.player.y;

    let triggerActive = false;
    let releaseActive = false;

    for (const hunter of state.hunters) {
      if (hunter.mode !== "chase") continue;
      const dx = hunter.pos.x - playerX;
      const dy = hunter.pos.y - playerY;
      const distSq = dx * dx + dy * dy;

      if (!triggerActive && distSq <= triggerRadiusSq) {
        triggerActive = true;
      }
      if (!releaseActive && distSq <= releaseRadiusSq) {
        releaseActive = true;
      }

      if (triggerActive && releaseActive) break;
    }

    return { triggerActive, releaseActive };
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  private frameAlpha(perFrameSmoothing: number, dtMs: number): number {
    const safeDt = Math.min(dtMs, 24);
    const frameUnits = safeDt / 16.6667;
    return Math.min(0.2, 1 - Math.pow(1 - perFrameSmoothing, frameUnits));
  }

  destroy(): void {
    this.app.stage.removeChild(this.viewport);
    this.viewport.destroy({ children: true });
  }
}
