import type { KeyboardContext } from "../keyboardContext";
import type { KeyboardCallbacks, KeyboardControlRefs } from "../types";

export type KeyDownHandlerParams = {
  e: KeyboardEvent;
  refs: KeyboardControlRefs;
  callbacks: KeyboardCallbacks;
  ctx: KeyboardContext;
};
