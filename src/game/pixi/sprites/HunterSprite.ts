import { Container, Graphics } from "pixi.js";
import type { Hunter } from "../../model/types";
import { TILE_SIZE, HUNTER_HEALTH } from "../../config/constants";
import { getHunterFacingAngle } from "../../world/hunterFacing";

export class HunterSprite {
  public displayObject: Container;
  private body: Graphics;
  private eyes: Graphics;
  private hearts: Graphics;
  private id: number;

  constructor(hunter: Hunter, parent: Container) {
    this.id = hunter.id;
    this.displayObject = new Container();
    parent.addChild(this.displayObject);

    this.body = new Graphics();
    this.displayObject.addChild(this.body);

    this.eyes = new Graphics();
    this.displayObject.addChild(this.eyes);

    this.hearts = new Graphics();
    this.displayObject.addChild(this.hearts);

    this.update(hunter, 0, 0);
  }

  update(hunter: Hunter, now: number, _dt: number): void {
    this.displayObject.x = hunter.pos.x * TILE_SIZE;
    this.displayObject.y = hunter.pos.y * TILE_SIZE;

    const isChasing = hunter.mode === "chase";
    const hurtFlicker = now < hunter.hurtUntilMs;
    const flickerOn = !hurtFlicker || Math.sin(now / 45) > 0;
    const patrolPulse = 0.75 + (Math.sin(now / 220 + this.id * 0.7) + 1) * 0.125;

    const alpha = flickerOn ? 1 : 0.35;
    const color = isChasing ? 0xff8250 : this.blendColors(0xffc06e, 0xffc06e, patrolPulse);

    // Draw body - PixiJS v8 API
    this.body.clear();
    this.body
      .rect(-TILE_SIZE / 2 + 1, -TILE_SIZE / 2 + 1, TILE_SIZE - 2, TILE_SIZE - 2)
      .fill({ color, alpha });

    // Draw eyes based on facing direction
    const facingAngle = getHunterFacingAngle(hunter, now);
    const eyeOffsetX = Math.cos(facingAngle) * 2;
    const eyeOffsetY = Math.sin(facingAngle) * 2;

    this.eyes.clear();
    this.eyes
      .rect(eyeOffsetX - 1, eyeOffsetY - 1, 2, 2)
      .fill({ color: 0x16120e, alpha: 0.9 * alpha });

    // Draw health hearts
    this.drawHearts(hunter.health);
  }

  private drawHearts(health: number): void {
    this.hearts.clear();
    if (health <= 0 || health >= HUNTER_HEALTH) return;

    const heartSize = 1.7;
    const heartSpacing = 0.8;
    const heartWidth = heartSize * 2;
    const totalWidth = HUNTER_HEALTH * heartWidth + (HUNTER_HEALTH - 1) * heartSpacing;
    const startX = -totalWidth / 2 + heartSize;
    const startY = -TILE_SIZE / 2 - 4;

    for (let i = 0; i < HUNTER_HEALTH; i++) {
      const filled = i < health;
      const color = filled ? 0xff4040 : 0x541010;
      const alpha = filled ? 0.95 : 0.6;

      // Draw heart shape
      const cx = startX + i * (heartWidth + heartSpacing);
      const cy = startY;
      const top = heartSize * 0.45;
      
      this.hearts
        .moveTo(cx, cy + top)
        .bezierCurveTo(cx, cy, cx - heartSize, cy, cx - heartSize, cy + top)
        .bezierCurveTo(cx - heartSize, cy + heartSize * 1.25, cx, cy + heartSize * 1.5, cx, cy + heartSize * 1.8)
        .bezierCurveTo(cx, cy + heartSize * 1.5, cx + heartSize, cy + heartSize * 1.25, cx + heartSize, cy + top)
        .bezierCurveTo(cx + heartSize, cy, cx, cy, cx, cy + top)
        .closePath()
        .fill({ color, alpha });
    }
  }

  private blendColors(color1: number, color2: number, ratio: number): number {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;
    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;

    const r = Math.round(r1 * ratio + r2 * (1 - ratio));
    const g = Math.round(g1 * ratio + g2 * (1 - ratio));
    const b = Math.round(b1 * ratio + b2 * (1 - ratio));

    return (r << 16) | (g << 8) | b;
  }

  destroy(): void {
    this.displayObject.destroy({ children: true });
  }
}
