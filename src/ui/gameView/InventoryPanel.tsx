import { ITEMS_TARGET } from "../../game/config/constants";

type InventoryPanelProps = {
  touchEnabled: boolean;
  spikesLeft: number;
  bombsLeft: number;
  itemsLeft: number;
  coinsCollected: number;
};

export function InventoryPanel({
  touchEnabled,
  spikesLeft,
  bombsLeft,
  itemsLeft,
  coinsCollected,
}: InventoryPanelProps) {
  return (
    <>
      <div className="inventory-title">Inventory</div>
      <div className="inventory-group">
        <div className="inventory-label">Spikes</div>
        <div className="inventory-slots">
          {[0, 1, 2].map((i) => (
            <div
              key={`spike-${i}`}
              className={`inventory-slot ${i < spikesLeft ? "filled" : ""}`}
            >
              <svg className="inventory-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2 L18 10 L12 8 L6 10 Z" fill="currentColor" />
                <rect x="10.5" y="10" width="3" height="10" />
                <rect x="7" y="20" width="10" height="2" />
              </svg>
            </div>
          ))}
        </div>
        <div className="inventory-hint">
          {touchEnabled ? "Tap Trap button" : "Place with Space or E"}
        </div>
      </div>

      <div className="inventory-group">
        <div className="inventory-label">Bombs</div>
        <div className="inventory-slots">
          {[0, 1, 2].map((i) => (
            <div
              key={`bomb-${i}`}
              className={`inventory-slot ${i < bombsLeft ? "filled" : ""}`}
            >
              <svg className="inventory-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="10" cy="14" r="6" />
                <rect x="14" y="6" width="6" height="2" />
                <circle cx="20" cy="6" r="2" />
              </svg>
            </div>
          ))}
        </div>
        <div className="inventory-hint">{touchEnabled ? "Tap Bomb button" : "Place with B"}</div>
      </div>

      <div className="inventory-group">
        <div className="inventory-label">Artifacts</div>
        <div className="inventory-counter">
          <svg className="inventory-icon small" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="6" width="12" height="12" rx="2" />
            <path d="M12 3 L14 6 L10 6 Z" />
            <path d="M12 21 L14 18 L10 18 Z" />
          </svg>
          <span>
            {ITEMS_TARGET - itemsLeft} / {ITEMS_TARGET}
          </span>
        </div>
      </div>

      <div className="inventory-group">
        <div className="inventory-label">Coins</div>
        <div className="inventory-counter coin-counter">
          <svg className="inventory-icon small" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="8" />
            <rect x="11" y="7" width="2" height="10" fill="#05070c" opacity="0.35" />
          </svg>
          <span className="coins-count">{coinsCollected}</span>
        </div>
      </div>
    </>
  );
}
