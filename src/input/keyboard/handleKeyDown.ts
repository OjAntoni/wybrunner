import { getKeyboardContext } from "./keyboardContext";
import { handleEndScreenKeyDown } from "./handlers/handleEndScreenKeyDown";
import { handleEquipmentKeyDown } from "./handlers/handleEquipmentKeyDown";
import { handleEscapeGameKeyDown } from "./handlers/handleEscapeGameKeyDown";
import { handleMapKeyDown } from "./handlers/handleMapKeyDown";
import { handleMenuKeyDown } from "./handlers/handleMenuKeyDown";
import { handlePausedKeyDown } from "./handlers/handlePausedKeyDown";
import { handlePlayingKeyDown } from "./handlers/handlePlayingKeyDown";
import { handleRestartConfirmKeyDown } from "./handlers/handleRestartConfirmKeyDown";
import type { KeyboardCallbacks, KeyboardControlRefs } from "./types";

export function handleKeyDown(
  e: KeyboardEvent,
  refs: KeyboardControlRefs,
  callbacks: KeyboardCallbacks
) {
  const ctx = getKeyboardContext(e);
  const params = { e, refs, callbacks, ctx };

  if (refs.screenRef.current !== "game") {
    handleMenuKeyDown(params);
    return;
  }

  if (handleEndScreenKeyDown(params)) return;
  if (handleMapKeyDown(params)) return;
  if (handleRestartConfirmKeyDown(params)) return;
  if (handleEquipmentKeyDown(params)) return;
  if (handleEscapeGameKeyDown(params)) return;
  if (handlePausedKeyDown(params)) return;
  handlePlayingKeyDown(params);
}
