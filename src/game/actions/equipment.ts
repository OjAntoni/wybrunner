import {
  BOMB_PURCHASE_COINS,
  BOMB_RADIUS_TILES,
  NOT_ENOUGH_MONEY_POPUP_MS,
  SPIKE_PURCHASE_COINS,
} from "../config/constants";
import type { GameState } from "../model/types";
import { cellKey, inBounds } from "../utils/grid";
import { blowUp, keysInBlast } from "../world/bombs";

function showNotEnoughMoneyPopup(state: GameState, now: number) {
  state.playerPopup = {
    text: "Not enough money",
    startMs: now,
    endMs: now + NOT_ENOUGH_MONEY_POPUP_MS,
  };
}

function spendCoins(
  state: GameState,
  amount: number,
  onCoinsCollectedChange: (next: number) => void
) {
  state.coinsCollected -= amount;
  onCoinsCollectedChange(state.coinsCollected);
}

export function placeSpike(
  state: GameState,
  onSpikesLeftChange: (next: number) => void,
  onCoinsCollectedChange: (next: number) => void,
  now: number
) {
  if (state.status !== "playing") return;
  const payWithCoins = state.spikesLeft <= 0;
  if (payWithCoins && state.coinsCollected < SPIKE_PURCHASE_COINS) {
    showNotEnoughMoneyPopup(state, now);
    return;
  }
  const cell = {
    x: Math.floor(state.player.x),
    y: Math.floor(state.player.y),
  };
  if (!inBounds(cell.x, cell.y)) return;
  const key = cellKey(cell.x, cell.y);
  if (state.grid[cell.y][cell.x] === 1) return;
  if (state.items.has(key)) return;
  if (state.spikes.has(key)) return;
  state.spikes.add(key);
  if (payWithCoins) {
    spendCoins(state, SPIKE_PURCHASE_COINS, onCoinsCollectedChange);
  } else {
    state.spikesLeft -= 1;
    onSpikesLeftChange(state.spikesLeft);
  }
}

export function placeBomb(
  state: GameState,
  onBombsLeftChange: (next: number) => void,
  onCoinsCollectedChange: (next: number) => void,
  now: number
) {
  if (state.status !== "playing") return;
  const payWithCoins = state.bombsLeft <= 0;
  if (payWithCoins && state.coinsCollected < BOMB_PURCHASE_COINS) {
    showNotEnoughMoneyPopup(state, now);
    return;
  }
  const cell = {
    x: Math.floor(state.player.x),
    y: Math.floor(state.player.y),
  };
  if (!inBounds(cell.x, cell.y)) return;
  if (state.grid[cell.y][cell.x] === 1) return;
  blowUp(state.grid, cell.x, cell.y);
  // If a bomb breaks the wall containing an arrow thrower, it is destroyed.
  state.arrowThrowers = state.arrowThrowers.filter((t) => state.grid[t.y][t.x] === 1);
  // Bombs also destroy traps inside the blast.
  const blast = keysInBlast(cell.x, cell.y);
  const blastSet = new Set(blast);
  for (const k of blast) {
    state.traps.delete(k);
    state.undergroundTrapsHidden.delete(k);
    state.undergroundTrapsRevealed.delete(k);
    state.undergroundTrapRevealMs.delete(k);
  }
  state.arrows = state.arrows.filter((a) => {
    const ax = Math.floor(a.pos.x);
    const ay = Math.floor(a.pos.y);
    if (!inBounds(ax, ay)) return false;
    return state.grid[ay][ax] === 0;
  });
  state.helpers = state.helpers.filter((h) => {
    const hx = Math.floor(h.pos.x);
    const hy = Math.floor(h.pos.y);
    return !blastSet.has(cellKey(hx, hy));
  });
  state.hunters = state.hunters.filter((hunter) => {
    const hx = Math.floor(hunter.pos.x);
    const hy = Math.floor(hunter.pos.y);
    return !blastSet.has(cellKey(hx, hy));
  });
  state.turrets = state.turrets.filter((turret) => {
    const tx = Math.floor(turret.pos.x);
    const ty = Math.floor(turret.pos.y);
    return !blastSet.has(cellKey(tx, ty));
  });
  state.explosions.push({
    x: cell.x + 0.5,
    y: cell.y + 0.5,
    start: now,
  });
  state.monsters = state.monsters.filter((monster) => {
    const monsterCell = {
      x: Math.floor(monster.pos.x),
      y: Math.floor(monster.pos.y),
    };
    const inBlast =
      (monsterCell.x - cell.x) * (monsterCell.x - cell.x) +
        (monsterCell.y - cell.y) * (monsterCell.y - cell.y) <=
      BOMB_RADIUS_TILES * BOMB_RADIUS_TILES;
    if (!inBlast) return true;
    if (monster.bombKillable) return false;
    monster.stunUntil = Math.max(monster.stunUntil, now + 3000);
    return true;
  });
  if (payWithCoins) {
    spendCoins(state, BOMB_PURCHASE_COINS, onCoinsCollectedChange);
  } else {
    state.bombsLeft -= 1;
    onBombsLeftChange(state.bombsLeft);
  }
}
