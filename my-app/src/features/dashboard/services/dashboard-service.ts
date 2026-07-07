import { supabase } from "../../../lib/supabase"
import { todayIsoDate } from "../../../lib/utils"
import type { DashboardDailyRecord, DashboardSummary } from "../types"

type DatedAmountRow = {
  date: string
  amount: number
}

type DailyTotals = {
  investment: number
  totalDailyExpense: number
  recovered: number
}

function sumAmounts(rows: { total_amount?: number | null; amount?: number | null }[]) {
  return rows.reduce((sum, row) => sum + (row.total_amount ?? row.amount ?? 0), 0)
}

function addAmountByDate(
  totalsByDate: Map<string, DailyTotals>,
  date: string,
  key: keyof DailyTotals,
  amount: number,
) {
  const totals = totalsByDate.get(date) ?? {
    investment: 0,
    totalDailyExpense: 0,
    recovered: 0,
  }

  totals[key] += amount
  totalsByDate.set(date, totals)
}

function createDailyRecords(
  sales: DatedAmountRow[],
  purchases: DatedAmountRow[],
  expenses: DatedAmountRow[],
) {
  const totalsByDate = new Map<string, DailyTotals>()

  sales.forEach((sale) => {
    addAmountByDate(totalsByDate, sale.date, "recovered", sale.amount)
  })

  purchases.forEach((purchase) => {
    addAmountByDate(totalsByDate, purchase.date, "investment", purchase.amount)
  })

  expenses.forEach((expense) => {
    addAmountByDate(totalsByDate, expense.date, "totalDailyExpense", expense.amount)
  })

  return Array.from(totalsByDate.entries())
    .map<DashboardDailyRecord>(([date, totals]) => ({
      date,
      ...totals,
      profit: totals.recovered - totals.investment - totals.totalDailyExpense,
    }))
    .sort((first, second) => second.date.localeCompare(first.date))
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const today = todayIsoDate()
  const [sales, purchases, expenses] = await Promise.all([
    supabase.from("sales").select("sale_date,total_amount").order("sale_date", {
      ascending: false,
    }),
    supabase.from("purchases").select("purchase_date,total_amount").order("purchase_date", {
      ascending: false,
    }),
    supabase.from("expenses").select("expense_date,amount").order("expense_date", {
      ascending: false,
    }),
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

  const saleRows = sales.data.map((sale) => ({
    date: sale.sale_date,
    amount: sale.total_amount,
  }))
  const purchaseRows = purchases.data.map((purchase) => ({
    date: purchase.purchase_date,
    amount: purchase.total_amount,
  }))
  const expenseRows = expenses.data.map((expense) => ({
    date: expense.expense_date,
    amount: expense.amount,
  }))

  const salesToday = sumAmounts(sales.data.filter((sale) => sale.sale_date === today))
  const purchasesToday = sumAmounts(
    purchases.data.filter((purchase) => purchase.purchase_date === today),
  )
  const expensesToday = sumAmounts(
    expenses.data.filter((expense) => expense.expense_date === today),
  )
  const totalRecovered = sumAmounts(sales.data)
  const totalInvestment = sumAmounts(purchases.data)
  const totalExpenses = sumAmounts(expenses.data)

  return {
    salesToday,
    purchasesToday,
    expensesToday,
    netProfitToday: salesToday - purchasesToday - expensesToday,
    totalInvestment,
    totalRecovered,
    totalExpenses,
    totalProfit: totalRecovered - totalInvestment - totalExpenses,
    dailyRecords: createDailyRecords(saleRows, purchaseRows, expenseRows),
  }
}
