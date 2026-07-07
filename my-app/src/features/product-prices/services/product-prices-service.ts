import { supabase } from "../../../lib/supabase"
import type { ProductPriceFormValues } from "../types"

export async function getProductPrices() {
  const { data, error } = await supabase
    .from("product_prices")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function createProductPrice(values: ProductPriceFormValues) {
  const { data, error } = await supabase.from("product_prices").insert(values).select().single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function updateProductPrice(id: string, values: Partial<ProductPriceFormValues>) {
  const { data, error } = await supabase
    .from("product_prices")
    .update(values)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function deleteProductPrice(id: string) {
  const { error } = await supabase.from("product_prices").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }
}
