import { Container, Graphics } from "pixi.js";
import type { GameState } from "../../model/types";
import { TILE_SIZE } from "../../config/constants";

export class PlayerSprite {
  public displayObject: Container;
  private body: Graphics;
  private facingIndicator: Graphics;

  constructor(parent: Container) {
    this.displayObject = new Container();
    parent.addChild(this.displayObject);

    this.body = new Graphics();
    this.displayObject.addChild(this.body);

    this.facingIndicator = new Graphics();
    this.displayObject.addChild(this.facingIndicator);
  }

  update(state: GameState, now: number, _dt: number): void {
    this.displayObject.x = state.player.x * TILE_SIZE;
    this.displayObject.y = state.player.y * TILE_SIZE;

    const hurtFlicker = now < state.playerHurtUntilMs;
    const hurtPulse = 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(now / 55));
    const alpha = hurtFlicker ? hurtPulse : 1;

    // Draw body - PixiJS v8 API
    this.body.clear();
    this.body
      .rect(-TILE_SIZE / 2 + 1, -TILE_SIZE / 2 + 1, TILE_SIZE - 2, TILE_SIZE - 2)
      .fill({ color: 0x59d9ff, alpha });

    this.drawFacingIndicator(state.playerFacingIndicator, now);
  }

  private drawFacingIndicator(facing: { x: number; y: number }, now: number): void {
    const facingLen = Math.hypot(facing.x, facing.y);
    if (facingLen <= 0.0001) return;

    const dirX = facing.x / facingLen;
    const dirY = facing.y / facingLen;
    const perpX = -dirY;
    const perpY = dirX;

    const pulse = 0.92 + Math.sin(now / 380) * 0.08;
    const alpha = 0.55 + (Math.sin(now / 520) + 1) * 0.06;
    const baseHalf = TILE_SIZE * 0.195 * pulse;
    const height = TILE_SIZE * 0.19125 * pulse;
    const frontDistance = TILE_SIZE * 0.55;

    const baseCenterX = dirX * frontDistance;
    const baseCenterY = dirY * frontDistance;
    const tipX = baseCenterX + dirX * height;
    const tipY = baseCenterY + dirY * height;
    const leftX = baseCenterX + perpX * baseHalf;
    const leftY = baseCenterY + perpY * baseHalf;
    const rightX = baseCenterX - perpX * baseHalf;
    const rightY = baseCenterY - perpY * baseHalf;

    // Draw triangle - PixiJS v8 API
    this.facingIndicator.clear();
    this.facingIndicator
      .moveTo(tipX, tipY)
      .lineTo(leftX, leftY)
      .lineTo(rightX, rightY)
      .closePath()
      .fill({ color: 0xe6e6e6, alpha });
  }

  destroy(): void {
    this.displayObject.destroy({ children: true });
  }
}
