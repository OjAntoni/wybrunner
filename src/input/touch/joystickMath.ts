import {
  TOUCH_JOYSTICK_DEADZONE,
  TOUCH_JOYSTICK_MAX,
} from "../../game/config/constants";
import type { Vec } from "../../game/model/types";

export type JoystickSample = {
  move: Vec;
  knobX: number;
  knobY: number;
};

export function sampleJoystick(clientX: number, clientY: number, rect: DOMRect): JoystickSample {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const rawX = clientX - cx;
  const rawY = clientY - cy;
  const distanceRaw = Math.hypot(rawX, rawY);
  if (distanceRaw <= 0.0001) {
    return {
      move: { x: 0, y: 0 },
      knobX: 0,
      knobY: 0,
    };
  }

  const clamped = Math.min(TOUCH_JOYSTICK_MAX, distanceRaw);
  const nx = rawX / distanceRaw;
  const ny = rawY / distanceRaw;
  const knobRatio = clamped / TOUCH_JOYSTICK_MAX;
  const moveRatio =
    knobRatio <= TOUCH_JOYSTICK_DEADZONE
      ? 0
      : (knobRatio - TOUCH_JOYSTICK_DEADZONE) / (1 - TOUCH_JOYSTICK_DEADZONE);

  return {
    move: { x: nx * moveRatio, y: ny * moveRatio },
    knobX: nx * clamped,
    knobY: ny * clamped,
  };
}
