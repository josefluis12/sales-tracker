import { supabase } from "../../../lib/supabase"
import type { SupplierFormValues } from "../types"

export async function getSuppliers() {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function createSupplier(values: SupplierFormValues) {
  const { data, error } = await supabase.from("suppliers").insert(values).select().single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function updateSupplier(id: string, values: Partial<SupplierFormValues>) {
  const { data, error } = await supabase
    .from("suppliers")
    .update(values)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function deleteSupplier(id: string) {
  const { error } = await supabase.from("suppliers").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }
}
