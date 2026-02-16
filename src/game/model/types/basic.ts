export type Vec = { x: number; y: number };
export type Cell = 0 | 1;

export type GameStatus = "playing" | "win" | "lose";
export type LoseReason = "caught" | "trap" | "helper" | "arrow";
export type UIScreen = "menu" | "controls" | "bestiary" | "game";

export type RGB = { r: number; g: number; b: number };
