export function runTouchAction(
  e: { pointerType: string; preventDefault: () => void },
  touchEnabled: boolean,
  action: () => void
) {
  if (!touchEnabled || e.pointerType === "mouse") return;
  action();
  e.preventDefault();
}
