import { supabase } from "../../../lib/supabase"
import type { ExpenseFormValues } from "../types"

export async function getExpenses() {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("expense_date", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function createExpense(values: ExpenseFormValues) {
  const { data, error } = await supabase.from("expenses").insert(values).select().single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function updateExpense(id: string, values: Partial<ExpenseFormValues>) {
  const { data, error } = await supabase
    .from("expenses")
    .update(values)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from("expenses").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }
}
