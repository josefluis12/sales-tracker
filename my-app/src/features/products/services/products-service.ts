import { supabase } from "../../../lib/supabase"
import type { Product, ProductFormValues, ProductWithSalesUsage } from "../types"

function normalizeProductName(name: string) {
  return name.trim().replace(/\s+/g, " ")
}

function namesMatch(firstName: string, secondName: string) {
  return firstName.localeCompare(secondName, undefined, { sensitivity: "accent" }) === 0
}

async function ensureUniqueProductName(name: string, ignoredProductId?: Product["id"]) {
  const normalizedName = normalizeProductName(name)
  const { data, error } = await supabase.from("products").select("id,name")

  if (error) {
    throw new Error(error.message)
  }

  const existingProduct = data.find(
    (product) =>
      product.id !== ignoredProductId &&
      namesMatch(normalizeProductName(product.name), normalizedName),
  )

  if (existingProduct) {
    throw new Error(`A product named "${existingProduct.name}" already exists.`)
  }

  return normalizedName
}

function withNoSalesUsage(product: Product): ProductWithSalesUsage {
  return {
    ...product,
    sale_items_count: 0,
  }
}

export async function getProducts(): Promise<ProductWithSalesUsage[]> {
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true })

  if (productsError) {
    throw new Error(productsError.message)
  }

  const { data: saleItems, error: saleItemsError } = await supabase
    .from("sale_items")
    .select("product_id")

  if (saleItemsError) {
    throw new Error(saleItemsError.message)
  }

  const saleItemsCountByProductId = saleItems.reduce<Record<string, number>>((counts, item) => {
    counts[item.product_id] = (counts[item.product_id] ?? 0) + 1
    return counts
  }, {})

  return products.map((product) => ({
    ...product,
    sale_items_count: saleItemsCountByProductId[product.id] ?? 0,
  }))
}

export async function createProduct(values: ProductFormValues): Promise<ProductWithSalesUsage> {
  const name = await ensureUniqueProductName(values.name)
  const { data, error } = await supabase.from("products").insert({ name }).select().single()

  if (error) {
    throw new Error(error.message)
  }

  return withNoSalesUsage(data)
}

export async function updateProduct(
  id: string,
  values: Partial<ProductFormValues>,
): Promise<ProductWithSalesUsage> {
  const nextValues =
    values.name === undefined
      ? values
      : {
          ...values,
          name: await ensureUniqueProductName(values.name, id),
        }

  const { data, error } = await supabase
    .from("products")
    .update(nextValues)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return withNoSalesUsage(data)
}

export async function deleteProduct(id: Product["id"]) {
  const { error } = await supabase.from("products").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }
}
