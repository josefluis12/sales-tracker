export const PAYMENT_STATUS = ["paid", "partial", "unpaid"] as const

export type PaymentStatus = (typeof PAYMENT_STATUS)[number]
