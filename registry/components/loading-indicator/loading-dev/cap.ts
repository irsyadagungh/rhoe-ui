export type Cap = "flat" | "round";

export const DEFAULT_CAP: Cap = "round";

export interface CapProps {
  cap?: Cap;
}

export function linecap(cap: Cap = DEFAULT_CAP): "butt" | "round" {
  return cap === "flat" ? "butt" : "round";
}
