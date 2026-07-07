import { supabase } from "../../../lib/supabase"
import type { Product, ProductFormValues } from "../types"

export async function getProducts() {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function createProduct(values: ProductFormValues) {
  const { data, error } = await supabase.from("products").insert(values).select().single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function updateProduct(id: string, values: Partial<ProductFormValues>) {
  const { data, error } = await supabase
    .from("products")
    .update(values)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function deleteProduct(id: Product["id"]) {
  const { error } = await supabase.from("products").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }
}
