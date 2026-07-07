import { supabase } from "../../../lib/supabase"
import type { PurchaseFormValues, PurchaseItemFormValues } from "../types"

export async function getPurchases() {
  const { data, error } = await supabase
    .from("purchases")
    .select("*")
    .order("purchase_date", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function createPurchaseWithItems(
  values: PurchaseFormValues,
  items: PurchaseItemFormValues[],
) {
  const purchaseItems = items.map((item) => ({
    ...item,
    subtotal: item.quantity * item.unit_cost,
  }))
  const totalAmount = purchaseItems.reduce((sum, item) => sum + item.subtotal, 0)

  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .insert({ ...values, total_amount: totalAmount })
    .select()
    .single()

  if (purchaseError) {
    throw new Error(purchaseError.message)
  }

  const { error: itemsError } = await supabase.from("purchase_items").insert(
    purchaseItems.map((item) => ({
      ...item,
      purchase_id: purchase.id,
    })),
  )

  if (itemsError) {
    throw new Error(itemsError.message)
  }

  return purchase
}

export async function deletePurchase(id: string) {
  const { error } = await supabase.from("purchases").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }
}
