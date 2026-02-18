import { Container } from "pixi.js";
import type { GameState, Hunter, Turret, Monster } from "../../model/types";
import type { Renderable } from "./Renderable";
import { HunterSprite } from "../sprites/HunterSprite";
import { ChaserSprite } from "../sprites/ChaserSprite";
import { TurretSprite } from "../sprites/TurretSprite";
import { PlayerSprite } from "../sprites/PlayerSprite";

export class EntityLayer implements Renderable {
  public displayObject: Container;
  private hunters: Map<number, HunterSprite> = new Map();
  private chasers: Map<number, ChaserSprite> = new Map();
  private turrets: Map<number, TurretSprite> = new Map();
  private player: PlayerSprite | null = null;

  constructor(parent: Container) {
    this.displayObject = new Container();
    parent.addChild(this.displayObject);
  }

  update(state: GameState, now: number, _dt: number): void {
    // Sync and update player
    if (!this.player) {
      this.player = new PlayerSprite(this.displayObject);
    }
    this.player.update(state, now, _dt);

    // Sync hunters by id
    this.syncHunters(state.hunters, now, _dt);

    // Sync chasers by index
    this.syncChasers(state.monsters, now, _dt);

    // Sync turrets by id
    this.syncTurrets(state.turrets, now, _dt);
  }

  private syncHunters(hunters: Hunter[], now: number, _dt: number): void {
    const currentIds = new Set(hunters.map((h) => h.id));

    // Add new hunters
    for (const hunter of hunters) {
      if (!this.hunters.has(hunter.id)) {
        this.hunters.set(hunter.id, new HunterSprite(hunter, this.displayObject));
      }
    }

    // Update existing hunters
    for (const [id, sprite] of this.hunters) {
      const hunter = hunters.find((h) => h.id === id);
      if (hunter) {
        sprite.update(hunter, now, _dt);
      }
    }

    // Remove destroyed hunters
    for (const [id, sprite] of this.hunters) {
      if (!currentIds.has(id)) {
        sprite.destroy();
        this.hunters.delete(id);
      }
    }
  }

  private syncChasers(monsters: Monster[], now: number, _dt: number): void {
    // Track chasers by index since they don't have ids
    const currentCount = monsters.length;

    // Add new chasers
    for (let i = this.chasers.size; i < currentCount; i++) {
      this.chasers.set(i, new ChaserSprite(monsters[i], this.displayObject));
    }

    // Update existing chasers
    for (let i = 0; i < currentCount; i++) {
      const sprite = this.chasers.get(i);
      if (sprite) {
        sprite.update(monsters[i], now, _dt);
      }
    }

    // Remove destroyed chasers (remove from end)
    for (let i = this.chasers.size - 1; i >= currentCount; i--) {
      const sprite = this.chasers.get(i);
      if (sprite) {
        sprite.destroy();
        this.chasers.delete(i);
      }
    }
  }

  private syncTurrets(turrets: Turret[], now: number, _dt: number): void {
    const currentIds = new Set(turrets.map((t) => t.id));

    // Add new turrets
    for (const turret of turrets) {
      if (!this.turrets.has(turret.id)) {
        this.turrets.set(turret.id, new TurretSprite(turret, this.displayObject));
      }
    }

    // Update existing turrets
    for (const [id, sprite] of this.turrets) {
      const turret = turrets.find((t) => t.id === id);
      if (turret) {
        sprite.update(turret, now, _dt);
      }
    }

    // Remove destroyed turrets
    for (const [id, sprite] of this.turrets) {
      if (!currentIds.has(id)) {
        sprite.destroy();
        this.turrets.delete(id);
      }
    }
  }

  destroy(): void {
    this.player?.destroy();
    this.hunters.forEach((s) => s.destroy());
    this.chasers.forEach((s) => s.destroy());
    this.turrets.forEach((s) => s.destroy());
    this.hunters.clear();
    this.chasers.clear();
    this.turrets.clear();
    this.displayObject.destroy({ children: true });
  }
}
