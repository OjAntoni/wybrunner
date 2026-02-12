import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { TILE_SIZE } from "../../../game/config/constants";
import {
  MAP_WORLD_H,
  MAP_WORLD_W,
  drawMapWindowScene,
  type MapCenter,
} from "../../../game/render/mapWindowScene";
import { clamp } from "../../../game/utils/math";
import type { GameViewActions, GameViewModel, GameViewRefs } from "../types";

const MAP_MAX_ZOOM_FACTOR = 8;
const MAP_MIN_PAN_ZOOM_FACTOR = 1.001;

type PointerPosition = { x: number; y: number };
type PinchState = { distance: number; midX: number; midY: number };

type MapOverlayProps = {
  view: Pick<GameViewModel, "status" | "touchEnabled" | "mapOpen" | "confirmRestartOpen"> &
    Pick<GameViewRefs, "stateRef" | "gameNowRef" | "fogSpritesRef" | "exploreCloudSpritesRef">;
  actions: Pick<GameViewActions, "onCloseMap">;
};

function getFitZoom(width: number, height: number) {
  if (width <= 0 || height <= 0) return 1;
  return Math.min(width / MAP_WORLD_W, height / MAP_WORLD_H);
}

function getPinchState(pointers: Map<number, PointerPosition>): PinchState | null {
  if (pointers.size < 2) return null;
  const [a, b] = Array.from(pointers.values());
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return {
    distance: Math.hypot(dx, dy),
    midX: (a.x + b.x) * 0.5,
    midY: (a.y + b.y) * 0.5,
  };
}

export function MapOverlay({ view, actions }: MapOverlayProps) {
  const {
    status,
    touchEnabled,
    mapOpen,
    confirmRestartOpen,
    stateRef,
    gameNowRef,
    fogSpritesRef,
    exploreCloudSpritesRef,
  } = view;
  const { onCloseMap } = actions;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const centerRef = useRef<MapCenter>({ x: MAP_WORLD_W * 0.5, y: MAP_WORLD_H * 0.5 });
  const zoomFactorRef = useRef(1);
  const sizeRef = useRef({ width: 1, height: 1 });
  const pointersRef = useRef<Map<number, PointerPosition>>(new Map());
  const pinchRef = useRef<PinchState | null>(null);
  const [zoomFactor, setZoomFactor] = useState(1);

  const setClampedZoomFactor = useCallback((next: number) => {
    const clamped = clamp(next, 1, MAP_MAX_ZOOM_FACTOR);
    zoomFactorRef.current = clamped;
    setZoomFactor(clamped);
  }, []);

  const panByCssDelta = useCallback((dx: number, dy: number) => {
    if (zoomFactorRef.current <= MAP_MIN_PAN_ZOOM_FACTOR) return;
    const fitZoom = getFitZoom(sizeRef.current.width, sizeRef.current.height);
    const zoom = fitZoom * zoomFactorRef.current;
    if (zoom <= 0) return;
    centerRef.current = {
      x: centerRef.current.x - dx / zoom,
      y: centerRef.current.y - dy / zoom,
    };
  }, []);

  const zoomBy = useCallback(
    (multiplier: number) => {
      setClampedZoomFactor(zoomFactorRef.current * multiplier);
    },
    [setClampedZoomFactor]
  );

  const centerOnPlayer = useCallback(() => {
    const player = stateRef.current.player;
    centerRef.current = {
      x: player.x * TILE_SIZE,
      y: player.y * TILE_SIZE,
    };
  }, [stateRef]);

  const onCanvasPointerDown = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const element = event.currentTarget;
    try {
      element.setPointerCapture(event.pointerId);
    } catch {
      // Ignore if capture is unavailable for this pointer.
    }
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size >= 2) {
      pinchRef.current = getPinchState(pointersRef.current);
    }
    event.preventDefault();
  }, []);

  const onCanvasPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const pointers = pointersRef.current;
      const previous = pointers.get(event.pointerId);
      if (!previous) return;

      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 1) {
        panByCssDelta(event.clientX - previous.x, event.clientY - previous.y);
        event.preventDefault();
        return;
      }

      const previousPinch = pinchRef.current;
      const nextPinch = getPinchState(pointers);
      if (!previousPinch || !nextPinch) {
        pinchRef.current = nextPinch;
        event.preventDefault();
        return;
      }

      const ratio = nextPinch.distance / Math.max(1, previousPinch.distance);
      if (Number.isFinite(ratio) && ratio > 0) {
        const nextFactor = clamp(zoomFactorRef.current * ratio, 1, MAP_MAX_ZOOM_FACTOR);
        zoomFactorRef.current = nextFactor;
        setZoomFactor(nextFactor);
      }
      panByCssDelta(nextPinch.midX - previousPinch.midX, nextPinch.midY - previousPinch.midY);
      pinchRef.current = nextPinch;
      event.preventDefault();
    },
    [panByCssDelta]
  );

  const onCanvasPointerUp = useCallback((event: ReactPointerEvent<HTMLCanvasElement>) => {
    const pointers = pointersRef.current;
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    pinchRef.current = pointers.size >= 2 ? getPinchState(pointers) : null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Ignore if capture was already released.
    }
    event.preventDefault();
  }, []);

  useEffect(() => {
    if (!mapOpen) return;
    pointersRef.current.clear();
    pinchRef.current = null;
    setClampedZoomFactor(1);
    centerOnPlayer();
  }, [centerOnPlayer, mapOpen, setClampedZoomFactor]);

  useEffect(() => {
    if (!mapOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const lowerKey = event.key.toLowerCase();

      if (lowerKey === "+" || event.key === "=") {
        zoomBy(1.14);
        event.preventDefault();
        return;
      }

      if (lowerKey === "-" || event.key === "_") {
        zoomBy(1 / 1.14);
        event.preventDefault();
        return;
      }

      if (zoomFactorRef.current <= MAP_MIN_PAN_ZOOM_FACTOR) return;

      const step = TILE_SIZE * 2.5;
      if (lowerKey === "w" || event.key === "ArrowUp") {
        centerRef.current = { x: centerRef.current.x, y: centerRef.current.y - step };
        event.preventDefault();
        return;
      }
      if (lowerKey === "s" || event.key === "ArrowDown") {
        centerRef.current = { x: centerRef.current.x, y: centerRef.current.y + step };
        event.preventDefault();
        return;
      }
      if (lowerKey === "a" || event.key === "ArrowLeft") {
        centerRef.current = { x: centerRef.current.x - step, y: centerRef.current.y };
        event.preventDefault();
        return;
      }
      if (lowerKey === "d" || event.key === "ArrowRight") {
        centerRef.current = { x: centerRef.current.x + step, y: centerRef.current.y };
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mapOpen, zoomBy]);

  useEffect(() => {
    if (!mapOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (event: WheelEvent) => {
      const wheelScale = Math.exp(-event.deltaY * 0.0014);
      setClampedZoomFactor(zoomFactorRef.current * wheelScale);
      event.preventDefault();
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [mapOpen, setClampedZoomFactor]);

  useEffect(() => {
    if (!mapOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.imageSmoothingEnabled = false;

    let rafId = 0;
    const frame = () => {
      const nextCanvas = canvasRef.current;
      if (!nextCanvas) return;
      const bounds = nextCanvas.getBoundingClientRect();
      const width = Math.max(1, Math.round(bounds.width));
      const height = Math.max(1, Math.round(bounds.height));
      sizeRef.current = { width, height };

      const dpr = Math.max(1, window.devicePixelRatio || 1);
      const nextWidth = Math.max(1, Math.round(width * dpr));
      const nextHeight = Math.max(1, Math.round(height * dpr));
      if (nextCanvas.width !== nextWidth || nextCanvas.height !== nextHeight) {
        nextCanvas.width = nextWidth;
        nextCanvas.height = nextHeight;
        context.imageSmoothingEnabled = false;
      }

      const fitZoom = getFitZoom(width, height);
      const result = drawMapWindowScene({
        ctx: context,
        state: stateRef.current,
        now: gameNowRef.current,
        dpr,
        zoom: fitZoom * zoomFactorRef.current,
        center: centerRef.current,
        fogSpritesRef,
        exploreCloudSpritesRef,
      });
      centerRef.current = result.center;
      rafId = window.requestAnimationFrame(frame);
    };

    rafId = window.requestAnimationFrame(frame);
    return () => {
      window.cancelAnimationFrame(rafId);
    };
  }, [exploreCloudSpritesRef, fogSpritesRef, gameNowRef, mapOpen, stateRef]);

  if (!mapOpen || status !== "playing" || confirmRestartOpen) return null;

  return (
    <div className="overlay overlay-map">
      <div className="overlay-box map-box">
        <div className="map-header">
          <div className="overlay-title">World Map</div>
          <button className="overlay-button" onClick={onCloseMap}>
            Close
          </button>
        </div>
        <div className="map-toolbar">
          <div className="map-zoom-controls">
            <button className="overlay-button map-zoom-button" onClick={() => zoomBy(1 / 1.18)}>
              -
            </button>
            <div className="map-zoom-readout">{Math.round(zoomFactor * 100)}%</div>
            <button className="overlay-button map-zoom-button" onClick={() => zoomBy(1.18)}>
              +
            </button>
          </div>
          <button className="overlay-button" onClick={centerOnPlayer}>
            Center Player
          </button>
        </div>
        <canvas
          ref={canvasRef}
          className="map-canvas"
          onPointerDown={onCanvasPointerDown}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
          onPointerCancel={onCanvasPointerUp}
        />
        <div className="menu-hint">
          {touchEnabled ? (
            "Drag to pan. Pinch or use +/- to zoom. Close to return to pause menu."
          ) : (
            <>
              <span className="keycap">M</span>/<span className="keycap">Esc</span> close{" "}
              <span className="keycap">WASD</span> or drag to pan when zoomed in, mouse wheel or{" "}
              <span className="keycap">+/-</span> to zoom
            </>
          )}
        </div>
      </div>
    </div>
  );
}
