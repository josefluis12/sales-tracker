export const PAYMENT_METHODS = ["cash", "gcash", "bank_transfer", "other"] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]
