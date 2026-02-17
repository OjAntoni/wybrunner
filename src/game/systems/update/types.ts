import type { Vec } from "../../model/types";

export type UpdateGameStateDeps = {
  getInputDir: () => Vec;
  touchEnabled: boolean;
};
