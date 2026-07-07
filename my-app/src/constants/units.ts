export const UNITS = [
  "kg",
  "piece",
  "bundle",
  "tale",
  "sack",
  "crate",
  "tray",
  "pack",
  "liter",
] as const

export type Unit = (typeof UNITS)[number]
