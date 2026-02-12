import { ControlsRow } from "./ControlsRow";

export function TouchControlsList() {
  return (
    <>
      <ControlsRow label="Move">Use the joystick at the bottom-left.</ControlsRow>
      <ControlsRow label="Trap">
        Tap the trap icon button to place a trap and stun the chaser for 5s.
      </ControlsRow>
      <ControlsRow label="Bomb">Tap the bomb icon button to blast walls (radius 8).</ControlsRow>
      <ControlsRow label="Pause">Tap Menu in the top-right corner.</ControlsRow>
      <ControlsRow label="Equipment">
        Tap Gear in the top-right, or open it from the pause screen.
      </ControlsRow>
      <ControlsRow label="Restart">Open Menu, then tap Restart.</ControlsRow>
      <ControlsRow label="Arrows">Wall throwers fire every 3s down straight corridors.</ControlsRow>
    </>
  );
}
