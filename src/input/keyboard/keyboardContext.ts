import { keyToDir } from "../keymap";

export type KeyboardContext = {
  lowerKey: string;
  dirKey: string;
};

export function getKeyboardContext(e: KeyboardEvent): KeyboardContext {
  const lowerKey = e.key.toLowerCase();
  const dirKey = keyToDir[e.key] ? e.key : keyToDir[lowerKey] ? lowerKey : "";
  return { lowerKey, dirKey };
}
