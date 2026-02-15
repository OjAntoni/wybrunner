import { memo, useMemo } from "react";
import { ITEMS_TARGET, PLAYER_HEARTS_MAX } from "../../game/config/constants";
import { InventoryPanel } from "./InventoryPanel";
import type { GameViewModel, GameViewRefs } from "./types";

type HudLayerProps = {
  view: Pick<
    GameViewModel,
    | "compactHud"
    | "status"
    | "touchEnabled"
    | "itemsLeft"
    | "coinsCollected"
    | "spikesLeft"
    | "bombsLeft"
    | "playerHearts"
    | "helpText"
  >;
  refs: Pick<GameViewRefs, "hudTopRef" | "inventoryRef">;
};

function buildHeartSlots(heartsVisible: number, playerHearts: number, keyPrefix: string) {
  return Array.from({ length: heartsVisible }, (_, i) => (
    <span key={`${keyPrefix}-${i}`} className={`hud-heart ${i < playerHearts ? "filled" : "empty"}`}>
      <svg className="hud-heart-icon" viewBox="0 0 16 14" aria-hidden="true">
        <path d="M8 13 L2.6 7.6 C1.2 6.2 1.2 3.8 2.6 2.6 C4 1.4 6.2 1.8 8 3.8 C9.8 1.8 12 1.4 13.4 2.6 C14.8 3.8 14.8 6.2 13.4 7.6 Z" />
      </svg>
    </span>
  ));
}

function HudLayerComponent({ view, refs }: HudLayerProps) {
  const {
    compactHud,
    status,
    touchEnabled,
    itemsLeft,
    coinsCollected,
    spikesLeft,
    bombsLeft,
    playerHearts,
    helpText,
  } = view;
  const { hudTopRef, inventoryRef } = refs;
  const heartsVisible = PLAYER_HEARTS_MAX;
  const filledHearts = Math.max(0, Math.min(playerHearts, PLAYER_HEARTS_MAX));
  const extraHearts = Math.max(0, playerHearts - PLAYER_HEARTS_MAX);
  const compactHeartSlots = useMemo(
    () => buildHeartSlots(heartsVisible, filledHearts, "compact-heart"),
    [filledHearts, heartsVisible]
  );
  const fullHeartSlots = useMemo(
    () => buildHeartSlots(heartsVisible, filledHearts, "heart"),
    [filledHearts, heartsVisible]
  );

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
            <div className="hearts-stat">
              Lives:
              <span className="hud-hearts" aria-label={`Lives: ${playerHearts}`}>
                {compactHeartSlots}
                <span className="hud-hearts-extra">{extraHearts > 0 ? `+${extraHearts}` : "\u00A0"}</span>
              </span>
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
                <div className="stat-item hearts-stat">
                  Lives:
                  <span className="hud-hearts" aria-label={`Lives: ${playerHearts}`}>
                    {fullHeartSlots}
                    <span className="hud-hearts-extra">{extraHearts > 0 ? `+${extraHearts}` : "\u00A0"}</span>
                  </span>
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

export const HudLayer = memo(HudLayerComponent, (prev, next) => {
  return (
    prev.view.compactHud === next.view.compactHud &&
    prev.view.status === next.view.status &&
    prev.view.touchEnabled === next.view.touchEnabled &&
    prev.view.itemsLeft === next.view.itemsLeft &&
    prev.view.coinsCollected === next.view.coinsCollected &&
    prev.view.spikesLeft === next.view.spikesLeft &&
    prev.view.bombsLeft === next.view.bombsLeft &&
    prev.view.playerHearts === next.view.playerHearts &&
    prev.view.helpText === next.view.helpText &&
    prev.refs.hudTopRef === next.refs.hudTopRef &&
    prev.refs.inventoryRef === next.refs.inventoryRef
  );
});
