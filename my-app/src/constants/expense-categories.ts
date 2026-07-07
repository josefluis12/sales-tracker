export const EXPENSE_CATEGORIES = [
  "rent",
  "fuel",
  "salary",
  "utilities",
  "maintenance",
  "inventory",
  "other",
] as const

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]
