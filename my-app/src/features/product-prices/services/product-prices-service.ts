import { supabase } from "../../../lib/supabase"
import type { Product } from "../../../types/database"
import type { ProductPrice, ProductPriceFormValues } from "../types"

export type ProductPriceWithProductName = ProductPrice & {
  product_name?: string
}

async function ensureProductPriceIsUnique(productId: string, currentId?: string) {
  let query = supabase
    .from("product_prices")
    .select("id")
    .eq("product_id", productId)
    .limit(1)

  if (currentId) {
    query = query.neq("id", currentId)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(error.message)
  }

  if (data.length > 0) {
    throw new Error("This product already has a suggested price.")
  }
}

export async function getProductPrices() {
  const { data, error } = await supabase
    .from("product_prices")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return attachProductNames(data)
}

export async function getActiveProductPrices() {
  const { data, error } = await supabase
    .from("product_prices")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return attachProductNames(data)
}

async function attachProductNames(prices: ProductPrice[]): Promise<ProductPriceWithProductName[]> {
  const productIds = Array.from(new Set(prices.map((price) => price.product_id)))

  if (productIds.length === 0) {
    return prices
  }

  const { data, error } = await supabase
    .from("products")
    .select("id, name")
    .in("id", productIds)

  if (error) {
    throw new Error(error.message)
  }

  const productNameById = new Map((data as Pick<Product, "id" | "name">[]).map((product) => [
    product.id,
    product.name,
  ]))

  return prices.map((price) => ({
    ...price,
    product_name: productNameById.get(price.product_id) ?? "Unknown product",
  }))
}

export async function createProductPrice(values: ProductPriceFormValues) {
  await ensureProductPriceIsUnique(values.product_id)

  const { data, error } = await supabase.from("product_prices").insert(values).select().single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function updateProductPrice(id: string, values: Partial<ProductPriceFormValues>) {
  if (values.product_id) {
    await ensureProductPriceIsUnique(values.product_id, id)
  }

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
