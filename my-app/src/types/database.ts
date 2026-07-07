import type { ExpenseCategory } from "../constants/expense-categories"
import type { PaymentMethod } from "../constants/payment-methods"
import type { PaymentStatus } from "../constants/payment-status"
import type { Unit } from "../constants/units"

type RowBase = {
  id: string
  created_at: string
}

type TimestampedRow = RowBase & {
  updated_at?: string | null
}

export type Product = RowBase & {
  name: string
}

export type ProductPrice = TimestampedRow & {
  product_id: string
  unit: Unit
  selling_price: number
  is_active: boolean | null
}

export type Supplier = TimestampedRow & {
  name: string
  contact_number: string | null
  contact_person: string | null
  address: string | null
  is_active: boolean | null
}

export type Expense = TimestampedRow & {
  expense_date: string
  category: ExpenseCategory
  amount: number
}

export type Purchase = TimestampedRow & {
  supplier_id: string | null
  purchase_date: string
  total_amount: number
  payment_status: PaymentStatus
  payment_method: PaymentMethod
}

export type PurchaseItem = RowBase & {
  purchase_id: string
  product_id: string
  quantity: number
  unit: Unit
  unit_cost: number
  subtotal: number
}

export type Sale = RowBase & {
  sale_date: string
  customer_name: string | null
  total_amount: number
  amount_paid: number
  payment_status: PaymentStatus
  payment_method: PaymentMethod
  notes: string | null
}

export type SaleItem = RowBase & {
  sale_id: string
  product_id: string
  quantity: number
  unit: Unit
  unit_price: number
  subtotal: number
}

export type ProductFormValues = Pick<Product, "name">
export type ProductPriceFormValues = Pick<
  ProductPrice,
  "product_id" | "unit" | "selling_price" | "is_active"
>
export type SupplierFormValues = Pick<
  Supplier,
  "name" | "contact_number" | "contact_person" | "address" | "is_active"
>
export type ExpenseFormValues = Pick<
  Expense,
  "expense_date" | "category" | "amount"
>
export type PurchaseFormValues = Pick<
  Purchase,
  "supplier_id" | "purchase_date" | "payment_status" | "payment_method"
>
export type SaleFormValues = Pick<
  Sale,
  "sale_date" | "customer_name" | "amount_paid" | "payment_status" | "payment_method" | "notes"
>

type TableDefinition<Row, Insert, Update> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export type Database = {
  public: {
    Tables: {
      products: TableDefinition<Product, ProductFormValues, Partial<ProductFormValues>>
      product_prices: TableDefinition<
        ProductPrice,
        ProductPriceFormValues,
        Partial<ProductPriceFormValues>
      >
      suppliers: TableDefinition<Supplier, SupplierFormValues, Partial<SupplierFormValues>>
      expenses: TableDefinition<Expense, ExpenseFormValues, Partial<ExpenseFormValues>>
      purchases: TableDefinition<
        Purchase,
        PurchaseFormValues & { total_amount: number },
        Partial<PurchaseFormValues & { total_amount: number }>
      >
      purchase_items: TableDefinition<
        PurchaseItem,
        Omit<PurchaseItem, "id" | "created_at">,
        Partial<Omit<PurchaseItem, "id" | "created_at">>
      >
      sales: TableDefinition<
        Sale,
        SaleFormValues & { total_amount: number },
        Partial<SaleFormValues & { total_amount: number }>
      >
      sale_items: TableDefinition<
        SaleItem,
        Omit<SaleItem, "id" | "created_at">,
        Partial<Omit<SaleItem, "id" | "created_at">>
      >
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
