export type { Sale, SaleFormValues, SaleItem } from "../../types/database"
import type { Unit } from "../../constants/units"

export type SaleItemFormValues = {
  product_id: string
  quantity: number
  unit: Unit
  unit_price: number
}
