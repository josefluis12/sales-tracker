import { supabase } from "../../../lib/supabase"
import type { SaleFormValues, SaleItemFormValues } from "../types"

export async function getSales() {
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .order("sale_date", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function createSaleWithItems(values: SaleFormValues, items: SaleItemFormValues[]) {
  const saleItems = items.map((item) => ({
    ...item,
    subtotal: item.quantity * item.unit_price,
  }))
  const totalAmount = saleItems.reduce((sum, item) => sum + item.subtotal, 0)

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({ ...values, total_amount: totalAmount })
    .select()
    .single()

  if (saleError) {
    throw new Error(saleError.message)
  }

  const { error: itemsError } = await supabase.from("sale_items").insert(
    saleItems.map((item) => ({
      ...item,
      sale_id: sale.id,
    })),
  )

  if (itemsError) {
    throw new Error(itemsError.message)
  }

  return sale
}

export async function deleteSale(id: string) {
  const { error } = await supabase.from("sales").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }
}
