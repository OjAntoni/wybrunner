import type { ReactNode } from "react";

type ControlsRowProps = {
  label: string;
  children: ReactNode;
};

export function ControlsRow({ label, children }: ControlsRowProps) {
  return (
    <div className="controls-row">
      <div className="controls-label">{label}</div>
      <div className="controls-value">{children}</div>
    </div>
  );
}
