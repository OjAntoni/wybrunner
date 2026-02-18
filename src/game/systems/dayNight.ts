import {
  DAY_NIGHT_INITIAL_DAY_DURATION_MS,
  DAY_DURATION_MS,
  DAY_TO_NIGHT_TRANSITION_MS,
  FLASHLIGHT_STARTUP_DELAY_MS,
  FLASHLIGHT_STARTUP_FLICKER_MS,
  NIGHT_DURATION_MS,
  NIGHT_TO_DAY_TRANSITION_MS,
  NIGHT_TO_DAY_VISION_DISABLE_DARKNESS_ALPHA,
  NIGHT_TO_DAY_VISION_FADE_RANGE_ALPHA,
  NIGHT_WARNING_TEXT_MS,
} from "../config/constants";
import type { GameState } from "../model/types";

export type DayNightPhase = "day" | "night" | "transition_to_night" | "transition_to_day";

export type DayNightSnapshot = {
  phase: DayNightPhase;
  darknessAlpha: number;
  nightVisionActive: boolean;
  nightVisionStrength: number;
  flashlightFlickerAlpha: number;
  showNightWarning: boolean;
  nightWarningOpacity: number;
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function pulseFadeOpacity(elapsedMs: number, durationMs: number) {
  if (durationMs <= 0) return 0;
  const t = clamp01(elapsedMs / durationMs);
  const fadeIn = clamp01(t / 0.2);
  const fadeOut = clamp01((1 - t) / 0.28);
  return Math.min(fadeIn, fadeOut);
}

function normalizeCycleOffset(elapsedMs: number, cycleDurationMs: number) {
  return ((elapsedMs % cycleDurationMs) + cycleDurationMs) % cycleDurationMs;
}

function getFlashlightFlickerAlpha(elapsedMs: number) {
  if (elapsedMs < FLASHLIGHT_STARTUP_DELAY_MS) return 1;
  const startupMs = elapsedMs - FLASHLIGHT_STARTUP_DELAY_MS;
  if (startupMs >= FLASHLIGHT_STARTUP_FLICKER_MS) return 0;

  // Startup flicker sequence:
  // on 0.25s -> off 0.5s -> on 0.4s -> off 0.4s -> steady on.
  const on1End = 250;
  const off1End = on1End + 500;
  const on2End = off1End + 400;
  const off2End = on2End + 400;

  if (startupMs < on1End) return 0;
  if (startupMs < off1End) return 1;
  if (startupMs < on2End) return 0;
  if (startupMs < off2End) return 1;
  return 0;
}

function resolveCycleSnapshot(dayDurationMs: number, cycleOffsetMs: number): DayNightSnapshot {
  if (cycleOffsetMs < dayDurationMs) {
    return {
      phase: "day",
      darknessAlpha: 0,
      nightVisionActive: false,
      nightVisionStrength: 0,
      flashlightFlickerAlpha: 0,
      showNightWarning: false,
      nightWarningOpacity: 0,
    };
  }

  const afterDayMs = cycleOffsetMs - dayDurationMs;
  if (afterDayMs < DAY_TO_NIGHT_TRANSITION_MS) {
    const transitionProgress = clamp01(afterDayMs / DAY_TO_NIGHT_TRANSITION_MS);
    const warningDuration = Math.min(NIGHT_WARNING_TEXT_MS, DAY_TO_NIGHT_TRANSITION_MS);
    return {
      phase: "transition_to_night",
      darknessAlpha: transitionProgress,
      nightVisionActive: true,
      nightVisionStrength: 1,
      flashlightFlickerAlpha: getFlashlightFlickerAlpha(afterDayMs),
      showNightWarning: afterDayMs < warningDuration,
      nightWarningOpacity: pulseFadeOpacity(afterDayMs, warningDuration),
    };
  }

  const afterToNightMs = afterDayMs - DAY_TO_NIGHT_TRANSITION_MS;
  if (afterToNightMs < NIGHT_DURATION_MS) {
    return {
      phase: "night",
      darknessAlpha: 1,
      nightVisionActive: true,
      nightVisionStrength: 1,
      flashlightFlickerAlpha: 0,
      showNightWarning: false,
      nightWarningOpacity: 0,
    };
  }

  const afterNightMs = afterToNightMs - NIGHT_DURATION_MS;
  const reverseProgress = clamp01(afterNightMs / NIGHT_TO_DAY_TRANSITION_MS);
  const darknessAlpha = 1 - reverseProgress;
  const nightVisionStrength = clamp01(
    (darknessAlpha - NIGHT_TO_DAY_VISION_DISABLE_DARKNESS_ALPHA) /
    Math.max(0.001, NIGHT_TO_DAY_VISION_FADE_RANGE_ALPHA)
  );
  return {
    phase: "transition_to_day",
    darknessAlpha,
    nightVisionActive: nightVisionStrength > 0.001,
    nightVisionStrength,
    flashlightFlickerAlpha: 0,
    showNightWarning: false,
    nightWarningOpacity: 0,
  };
}

// Per-frame cache: avoids recomputing the same snapshot multiple times per tick.
let _cachedNowMs = -1;
let _cachedCycleStart = -1;
let _cachedSnapshot: DayNightSnapshot | null = null;

export function getDayNightSnapshot(state: GameState, nowMs: number): DayNightSnapshot {
  if (nowMs === _cachedNowMs && state.dayNightCycleStartMs === _cachedCycleStart && _cachedSnapshot) {
    return _cachedSnapshot;
  }

  const elapsedMs = Math.max(0, nowMs - state.dayNightCycleStartMs);

  const initialCycleMs =
    DAY_NIGHT_INITIAL_DAY_DURATION_MS +
    DAY_TO_NIGHT_TRANSITION_MS +
    NIGHT_DURATION_MS +
    NIGHT_TO_DAY_TRANSITION_MS;

  let result: DayNightSnapshot;
  if (elapsedMs < initialCycleMs) {
    result = resolveCycleSnapshot(
      DAY_NIGHT_INITIAL_DAY_DURATION_MS,
      normalizeCycleOffset(elapsedMs, initialCycleMs)
    );
  } else {
    const recurringElapsedMs = elapsedMs - initialCycleMs;
    const recurringCycleMs =
      DAY_DURATION_MS + DAY_TO_NIGHT_TRANSITION_MS + NIGHT_DURATION_MS + NIGHT_TO_DAY_TRANSITION_MS;
    const recurringOffsetMs = normalizeCycleOffset(recurringElapsedMs, recurringCycleMs);
    result = resolveCycleSnapshot(DAY_DURATION_MS, recurringOffsetMs);
  }

  _cachedNowMs = nowMs;
  _cachedCycleStart = state.dayNightCycleStartMs;
  _cachedSnapshot = result;
  return result;
}
