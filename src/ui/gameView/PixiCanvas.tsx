import { useEffect, useRef } from "react";
import { PixiApp } from "../../game/pixi/PixiApp";
import type { GameState } from "../../game/model/types";

interface PixiCanvasProps {
  stateRef: React.MutableRefObject<GameState>;
  gameNowRef: React.MutableRefObject<number>;
}

export function PixiCanvas({ stateRef, gameNowRef }: PixiCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const pixiRef = useRef<PixiApp | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Pixi application
    pixiRef.current = new PixiApp({
      container: containerRef.current,
      backgroundColor: 0x0a0c12,
    });

    // Wait for initialization then start render loop
    const checkReady = () => {
      if (pixiRef.current?.isReady()) {
        startRenderLoop();
      } else {
        requestAnimationFrame(checkReady);
      }
    };

    const startRenderLoop = () => {
      let lastTime = performance.now();

      const render = () => {
        const now = performance.now();
        const dt = (now - lastTime) / 1000;
        lastTime = now;

        if (pixiRef.current) {
          pixiRef.current.render(stateRef.current, gameNowRef.current, dt);
        }

        rafRef.current = requestAnimationFrame(render);
      };

      rafRef.current = requestAnimationFrame(render);
    };

    // Start checking for readiness
    checkReady();

    return () => {
      cancelAnimationFrame(rafRef.current);
      pixiRef.current?.destroy();
      pixiRef.current = null;
    };
  }, [stateRef, gameNowRef]);

  return (
    <div
      ref={containerRef}
      className="pixi-container"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    />
  );
}
