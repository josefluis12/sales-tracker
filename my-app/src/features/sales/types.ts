export type { Sale, SaleFormValues, SaleItem } from "../../types/database"
import type { Sale, SaleFormValues } from "../../types/database"
import type { Unit } from "../../constants/units"

export type SaleItemFormValues = {
  product_id: string
  quantity: number
  unit: Unit
  unit_price: number
  subtotal?: number
}

export type SaleCreateValues = SaleFormValues

export type DailySalesReportItem = {
  id: string
  saleId: string
  productName: string
  quantity: number
  unit: Unit
  unitPrice: number
  subtotal: number
}

export type DailySalesReportSale = {
  id: string
  saleDate: string
  customerName: string | null
  totalAmount: number
  amountPaid: number
  balanceDue: number
  paymentStatus: Sale["payment_status"]
  paymentMethod: Sale["payment_method"]
  notes: string | null
  items: DailySalesReportItem[]
}

export type DailySalesReportGroup = {
  date: string
  saleCount: number
  itemCount: number
  totalAmount: number
  paidAmount: number
  partialAmount: number
  unpaidAmount: number
  sales: DailySalesReportSale[]
  items: DailySalesReportItem[]
}
