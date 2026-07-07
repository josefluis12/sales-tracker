import type { Product } from "../../types/database"

export type { Product, ProductFormValues } from "../../types/database"

export type ProductWithSalesUsage = Product & {
  sale_items_count: number
}
