import { InventoryPanel } from "../InventoryPanel";
import type { GameViewActions, GameViewModel } from "../types";

type EquipmentOverlayProps = {
  view: Pick<
    GameViewModel,
    "status" | "touchEnabled" | "equipmentOpen" | "confirmRestartOpen" | "spikesLeft" | "bombsLeft" | "itemsLeft" | "coinsCollected"
  >;
  actions: Pick<GameViewActions, "onCloseEquipment" | "onResumeFromEquipment">;
};

export function EquipmentOverlay({ view, actions }: EquipmentOverlayProps) {
  const {
    status,
    touchEnabled,
    equipmentOpen,
    confirmRestartOpen,
    spikesLeft,
    bombsLeft,
    itemsLeft,
    coinsCollected,
  } = view;
  const { onCloseEquipment, onResumeFromEquipment } = actions;

  if (!equipmentOpen || status !== "playing" || confirmRestartOpen) return null;

  return (
    <div className="overlay overlay-equipment">
      <div className="overlay-box equipment-box">
        <div className="equipment-header">
          <div className="overlay-title">Equipment</div>
          <button className="overlay-button" onClick={onCloseEquipment}>
            Close
          </button>
        </div>
        <div className="overlay-text">
          Trap and Bomb actions are mapped to touch buttons while playing.
        </div>
        <div className="equipment-panel">
          <InventoryPanel
            touchEnabled={touchEnabled}
            spikesLeft={spikesLeft}
            bombsLeft={bombsLeft}
            itemsLeft={itemsLeft}
            coinsCollected={coinsCollected}
          />
        </div>
        <div className="confirm-actions equipment-actions">
          <button className="overlay-button" onClick={onCloseEquipment}>
            Back
          </button>
          <button className="overlay-button" onClick={onResumeFromEquipment}>
            Resume
          </button>
        </div>
      </div>
    </div>
  );
}
