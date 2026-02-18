import { Container, Graphics } from "pixi.js";
import type { ChaserMonster } from "../../model/types";
import { TILE_SIZE, CHASER_HEALTH } from "../../config/constants";

export class ChaserSprite {
  public displayObject: Container;
  private body: Graphics;
  private hearts: Graphics;

  constructor(monster: ChaserMonster, parent: Container) {
    this.displayObject = new Container();
    parent.addChild(this.displayObject);

    this.body = new Graphics();
    this.displayObject.addChild(this.body);

    this.hearts = new Graphics();
    this.displayObject.addChild(this.hearts);

    this.update(monster, 0, 0);
  }

  update(monster: ChaserMonster, now: number, _dt: number): void {
    this.displayObject.x = monster.pos.x * TILE_SIZE;
    this.displayObject.y = monster.pos.y * TILE_SIZE;

    const stunned = now < monster.stunUntil;
    const hurtFlicker = now < monster.hurtUntilMs;
    const flickerOn = !hurtFlicker || Math.sin(now / 45) > 0;
    const alpha = flickerOn ? 1 : 0.35;
    const color = stunned ? (Math.sin(now / 60) > 0 ? 0xff4e4e : 0xffd166) : 0xff4e4e;

    // Draw body - PixiJS v8 API
    this.body.clear();
    this.body
      .rect(-TILE_SIZE / 2 + 1, -TILE_SIZE / 2 + 1, TILE_SIZE - 2, TILE_SIZE - 2)
      .fill({ color, alpha });

    // Draw boost glow if boosted - PixiJS v8 API
    if (now < monster.boostUntil) {
      const glow = 0.35 + 0.25 * Math.sin(now / 80);
      this.body
        .circle(0, 0, 9)
        .fill({ color: 0x50ff8c, alpha: glow });
    }

    this.drawHearts(monster.health);
  }

  private drawHearts(health: number): void {
    this.hearts.clear();
    if (health <= 0 || health >= CHASER_HEALTH) return;

    const heartSize = 1.7;
    const heartSpacing = 0.8;
    const heartWidth = heartSize * 2;
    const totalWidth = CHASER_HEALTH * heartWidth + (CHASER_HEALTH - 1) * heartSpacing;
    const startX = -totalWidth / 2 + heartSize;
    const startY = -TILE_SIZE / 2 - 4;

    for (let i = 0; i < CHASER_HEALTH; i++) {
      const filled = i < health;
      const color = filled ? 0xff4040 : 0x541010;
      const alpha = filled ? 0.95 : 0.6;

      // Draw heart shape - PixiJS v8 API
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

  destroy(): void {
    this.displayObject.destroy({ children: true });
  }
}
