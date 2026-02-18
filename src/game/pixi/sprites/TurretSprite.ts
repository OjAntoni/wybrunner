import { Container, Graphics } from "pixi.js";
import type { Turret } from "../../model/types";
import { TILE_SIZE } from "../../config/constants";

export class TurretSprite {
  public displayObject: Container;
  private body: Graphics;
  private barrel: Graphics;
  private id: number;

  constructor(turret: Turret, parent: Container) {
    this.id = turret.id;
    this.displayObject = new Container();
    parent.addChild(this.displayObject);

    this.body = new Graphics();
    this.displayObject.addChild(this.body);

    this.barrel = new Graphics();
    this.displayObject.addChild(this.barrel);

    this.update(turret, 0, 0);
  }

  update(turret: Turret, now: number, _dt: number): void {
    this.displayObject.x = turret.pos.x * TILE_SIZE;
    this.displayObject.y = turret.pos.y * TILE_SIZE;

    const pulse = 0.7 + (Math.sin(now / 190 + this.id * 0.4) + 1) * 0.15;

    // Draw body - PixiJS v8 API
    this.body.clear();
    this.body
      .rect(-TILE_SIZE / 2 + 1, -TILE_SIZE / 2 + 1, TILE_SIZE - 2, TILE_SIZE - 2)
      .fill({ color: 0xaa3a3a, alpha: pulse });

    // Draw center
    this.body
      .rect(-2, -2, 4, 4)
      .fill({ color: 0x220e0e, alpha: 0.9 });

    // Draw barrel - PixiJS v8 API
    const barrelLen = 5;
    const angle = turret.facingAngle;

    this.barrel.clear();
    this.barrel
      .moveTo(0, 0)
      .lineTo(Math.cos(angle) * barrelLen, Math.sin(angle) * barrelLen)
      .stroke({ width: 1.5, color: 0xffa0a0, alpha: 0.95 });
  }

  destroy(): void {
    this.displayObject.destroy({ children: true });
  }
}
