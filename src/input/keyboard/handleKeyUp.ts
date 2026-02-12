import { keyToDir } from "../keymap";
import type { KeyboardControlRefs } from "./types";

export function handleKeyUp(e: KeyboardEvent, refs: KeyboardControlRefs) {
  const lowerKey = e.key.toLowerCase();
  const dirKey = keyToDir[e.key] ? e.key : keyToDir[lowerKey] ? lowerKey : "";
  if (refs.screenRef.current === "game" && refs.mapOpenRef.current && dirKey) {
    e.preventDefault();
    return;
  }
  if (refs.screenRef.current === "game" && dirKey) {
    refs.keysRef.current.delete(dirKey);
    e.preventDefault();
  }
}
