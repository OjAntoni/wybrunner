type GameUiValue = string | number;

const uiSelectors: Record<string, string> = {
  coins: ".coins-count",
  artifacts: ".artifacts-count",
  spikesCount: ".spikes-count",
  bombsCount: ".bombs-count",
};

export function updateGameUi(key: string, value: GameUiValue): void {
  const selector = uiSelectors[key];
  if (!selector) return;
  
  const elements = document.querySelectorAll<HTMLElement>(selector);
  const text = String(value);
  elements.forEach((el) => {
    if (el.textContent !== text) {
      el.textContent = text;
    }
  });
}

export function updateCoinsDom(count: number): void {
  updateGameUi("coins", count);
}

export function updateArtifactsDom(collected: number, target: number): void {
  updateGameUi("artifacts", `${collected}/${target}`);
}

export function updateHeartsDom(hearts: number, maxHearts: number): void {
  // Update data-hearts attribute on containers
  const containers = document.querySelectorAll<HTMLElement>(".hud-hearts");
  containers.forEach((el) => {
    el.setAttribute("data-hearts", String(hearts));
  });
  
  // Update extra hearts display
  const extraHearts = Math.max(0, hearts - maxHearts);
  const extraElements = document.querySelectorAll<HTMLElement>(".hud-hearts-extra");
  extraElements.forEach((el) => {
    el.setAttribute("data-extra-hearts", String(extraHearts));
    const text = extraHearts > 0 ? `+${extraHearts}` : "\u00A0";
    if (el.textContent !== text) {
      el.textContent = text;
    }
  });
}

export function updateSpikesDom(count: number): void {
  // Update data attribute on inventory slots container
  const containers = document.querySelectorAll<HTMLElement>(".inventory-slots[data-item-type=\"spikes\"]");
  containers.forEach((el) => {
    el.setAttribute("data-count", String(count));
  });
  
  // Update touch layer count
  updateGameUi("spikesCount", `x${count}`);
  
  // Update individual slots
  const slots = document.querySelectorAll<HTMLElement>(".inventory-slot[data-item-type=\"spike\"]");
  slots.forEach((slot) => {
    const index = parseInt(slot.getAttribute("data-index") || "0", 10);
    const isFilled = index < count;
    slot.setAttribute("data-filled", String(isFilled));
    
    // Show/hide cost badge on first slot when out of stock
    const costBadge = slot.querySelector<HTMLElement>(".inventory-slot-cost");
    if (costBadge && index === 0) {
      costBadge.style.display = count <= 0 ? "flex" : "none";
    }
  });
}

export function updateBombsDom(count: number): void {
  // Update data attribute on inventory slots container
  const containers = document.querySelectorAll<HTMLElement>(".inventory-slots[data-item-type=\"bombs\"]");
  containers.forEach((el) => {
    el.setAttribute("data-count", String(count));
  });
  
  // Update touch layer count
  updateGameUi("bombsCount", `x${count}`);
  
  // Update individual slots
  const slots = document.querySelectorAll<HTMLElement>(".inventory-slot[data-item-type=\"bomb\"]");
  slots.forEach((slot) => {
    const index = parseInt(slot.getAttribute("data-index") || "0", 10);
    const isFilled = index < count;
    slot.setAttribute("data-filled", String(isFilled));
    
    // Show/hide cost badge on first slot when out of stock
    const costBadge = slot.querySelector<HTMLElement>(".inventory-slot-cost");
    if (costBadge && index === 0) {
      costBadge.style.display = count <= 0 ? "flex" : "none";
    }
  });
}
