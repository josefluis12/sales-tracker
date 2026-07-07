export const UNITS = [
  "kg",
  "piece",
  "bundle",
  "sack",
  "crate",
  "tray",
  "pack",
] as const

export type Unit = (typeof UNITS)[number]
