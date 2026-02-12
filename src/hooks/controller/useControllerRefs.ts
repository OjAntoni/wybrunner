import { useRef, type MutableRefObject } from "react";
import { initGame } from "../../game/model/initGame";
import type { GameState, UIScreen, Vec } from "../../game/model/types";

export type ControllerRefs = {
  canvasRef: MutableRefObject<HTMLCanvasElement | null>;
  stateRef: MutableRefObject<GameState>;
  keysRef: MutableRefObject<Set<string>>;
  gameNowRef: MutableRefObject<number>;
  dprRef: MutableRefObject<number>;
  canvasCssSizeRef: MutableRefObject<{ w: number; h: number }>;
  hudTopRef: MutableRefObject<HTMLDivElement | null>;
  inventoryRef: MutableRefObject<HTMLElement | null>;
  fogSpritesRef: MutableRefObject<HTMLCanvasElement[] | null>;
  exploreCloudSpritesRef: MutableRefObject<HTMLCanvasElement[] | null>;
  screenRef: MutableRefObject<UIScreen>;
  mapOpenRef: MutableRefObject<boolean>;
  confirmRestartRef: MutableRefObject<boolean>;
  pausedRef: MutableRefObject<boolean>;
  equipmentOpenRef: MutableRefObject<boolean>;
  controlsReturnToGameRef: MutableRefObject<boolean>;
  mapReturnToPauseRef: MutableRefObject<boolean>;
  joystickRef: MutableRefObject<HTMLDivElement | null>;
  joystickKnobRef: MutableRefObject<HTMLDivElement | null>;
  touchEnabledRef: MutableRefObject<boolean>;
  touchMoveRef: MutableRefObject<Vec>;
  hudRectsRef: MutableRefObject<{
    hudTop: DOMRect | null;
    inventory: DOMRect | null;
    lastUpdate: number;
  }>;
};

export function useControllerRefs(): ControllerRefs {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState>(initGame());
  const keysRef = useRef<Set<string>>(new Set());
  const gameNowRef = useRef(0);
  const dprRef = useRef(1);
  const canvasCssSizeRef = useRef({ w: 0, h: 0 });
  const hudTopRef = useRef<HTMLDivElement>(null);
  const inventoryRef = useRef<HTMLElement>(null);
  const fogSpritesRef = useRef<HTMLCanvasElement[] | null>(null);
  const exploreCloudSpritesRef = useRef<HTMLCanvasElement[] | null>(null);
  const screenRef = useRef<UIScreen>("menu");
  const mapOpenRef = useRef(false);
  const confirmRestartRef = useRef(false);
  const pausedRef = useRef(false);
  const equipmentOpenRef = useRef(false);
  const controlsReturnToGameRef = useRef(false);
  const mapReturnToPauseRef = useRef(false);
  const joystickRef = useRef<HTMLDivElement>(null);
  const joystickKnobRef = useRef<HTMLDivElement>(null);
  const touchEnabledRef = useRef(false);
  const touchMoveRef = useRef<Vec>({ x: 0, y: 0 });
  const hudRectsRef = useRef<{
    hudTop: DOMRect | null;
    inventory: DOMRect | null;
    lastUpdate: number;
  }>({ hudTop: null, inventory: null, lastUpdate: 0 });

  return {
    canvasRef,
    stateRef,
    keysRef,
    gameNowRef,
    dprRef,
    canvasCssSizeRef,
    hudTopRef,
    inventoryRef,
    fogSpritesRef,
    exploreCloudSpritesRef,
    screenRef,
    mapOpenRef,
    confirmRestartRef,
    pausedRef,
    equipmentOpenRef,
    controlsReturnToGameRef,
    mapReturnToPauseRef,
    joystickRef,
    joystickKnobRef,
    touchEnabledRef,
    touchMoveRef,
    hudRectsRef,
  };
}
