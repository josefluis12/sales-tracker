import { supabase } from "../../../lib/supabase"
import { todayIsoDate } from "../../../lib/utils"
import type { DashboardSummary } from "../types"

function sumAmounts(rows: { total_amount?: number; amount?: number }[]) {
  return rows.reduce((sum, row) => sum + (row.total_amount ?? row.amount ?? 0), 0)
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const today = todayIsoDate()
  const [sales, purchases, expenses] = await Promise.all([
    supabase.from("sales").select("total_amount").eq("sale_date", today),
    supabase.from("purchases").select("total_amount").eq("purchase_date", today),
    supabase.from("expenses").select("amount").eq("expense_date", today),
  ])

  if (sales.error) {
    throw new Error(sales.error.message)
  }

  if (purchases.error) {
    throw new Error(purchases.error.message)
  }

  if (expenses.error) {
    throw new Error(expenses.error.message)
  }

  const salesToday = sumAmounts(sales.data)
  const purchasesToday = sumAmounts(purchases.data)
  const expensesToday = sumAmounts(expenses.data)

  return {
    salesToday,
    purchasesToday,
    expensesToday,
    netProfitToday: salesToday - purchasesToday - expensesToday,
  }
}
