import { ITEMS_TARGET } from "../../game/config/constants";
import { InventoryPanel } from "./InventoryPanel";
import type { GameViewModel, GameViewRefs } from "./types";

type HudLayerProps = {
  view: Pick<
    GameViewModel,
    "compactHud" | "status" | "touchEnabled" | "itemsLeft" | "coinsCollected" | "spikesLeft" | "bombsLeft" | "helpText"
  >;
  refs: Pick<GameViewRefs, "hudTopRef" | "inventoryRef">;
};

export function HudLayer({ view, refs }: HudLayerProps) {
  const {
    compactHud,
    status,
    touchEnabled,
    itemsLeft,
    coinsCollected,
    spikesLeft,
    bombsLeft,
    helpText,
  } = view;
  const { hudTopRef, inventoryRef } = refs;
  return (
    <div className="hud">
      <div className={`hud-top${compactHud ? " hud-top-compact" : ""}`} ref={hudTopRef}>
        {compactHud ? (
          <div className="stats stats-compact">
            <div>
              Artifacts: {ITEMS_TARGET - itemsLeft}/{ITEMS_TARGET}
            </div>
            <div className="coins-stat">
              Coins: <span className="coins-count">{coinsCollected}</span>
            </div>
          </div>
        ) : (
          <>
            <header className="title">
              <div>Labyrinth Runner</div>
              <div className="sub">96x64 Retro Maze</div>
            </header>
            <div className="stats">
              <div className="stats-primary">
                <div className="stat-item">
                  Artifacts: {ITEMS_TARGET - itemsLeft}/{ITEMS_TARGET}
                </div>
                <div className="stat-item coins-stat">
                  Coins: <span className="coins-count">{coinsCollected}</span>
                </div>
              </div>
              <div className="stats-secondary">
                <div className="stat-item">
                  Status: {status === "playing" ? "Running" : status.toUpperCase()}
                </div>
                <div className="stat-item">
                  {touchEnabled ? "Tap Menu to pause" : "R: restart"}
                </div>
              </div>
            </div>
            <div className="help">{helpText}</div>
          </>
        )}
      </div>
      {!touchEnabled && !compactHud && (
        <aside className="inventory" ref={inventoryRef}>
          <InventoryPanel
            touchEnabled={touchEnabled}
            spikesLeft={spikesLeft}
            bombsLeft={bombsLeft}
            itemsLeft={itemsLeft}
            coinsCollected={coinsCollected}
          />
        </aside>
      )}
    </div>
  );
}
