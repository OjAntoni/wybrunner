import { ControlsRow } from "./ControlsRow";

export function KeyboardControlsList() {
  return (
    <>
      <ControlsRow label="Move">
        <span className="keycap">W</span>
        <span className="keycap">A</span>
        <span className="keycap">S</span>
        <span className="keycap">D</span>
        <span className="controls-or">or</span>
        <span className="keycap">Arrows</span>
      </ControlsRow>
      <ControlsRow label="Spike">
        <span className="keycap">Space</span>
        <span className="controls-or">or</span>
        <span className="keycap">E</span>
        <span className="controls-note">stuns chaser for 5s</span>
      </ControlsRow>
      <ControlsRow label="Bomb">
        <span className="keycap">B</span>
        <span className="controls-note">blasts walls (radius 8)</span>
      </ControlsRow>
      <ControlsRow label="Restart">
        <span className="keycap">R</span>
      </ControlsRow>
      <ControlsRow label="Pause">
        <span className="keycap">Esc</span>
      </ControlsRow>
      <ControlsRow label="Equipment">
        <span className="keycap">I</span>
      </ControlsRow>
      <ControlsRow label="Touch">
        Joystick movement plus Trap and Bomb action buttons. Use Menu and Gear buttons in the
        top-right while playing.
      </ControlsRow>
      <ControlsRow label="Arrows">
        Wall throwers fire every <span className="keycap">3s</span> down straight corridors.
      </ControlsRow>
    </>
  );
}
