export type { Purchase, PurchaseFormValues, PurchaseItem } from "../../types/database"
import type { Unit } from "../../constants/units"

export type PurchaseItemFormValues = {
  product_id: string
  quantity: number
  unit: Unit
  unit_cost: number
}
