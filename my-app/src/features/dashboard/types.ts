export type DashboardDailyRecord = {
  date: string
  investment: number
  totalDailyExpense: number
  recovered: number
  profit: number
}

export type DashboardSummary = {
  salesToday: number
  purchasesToday: number
  expensesToday: number
  netProfitToday: number
  totalInvestment: number
  totalRecovered: number
  totalExpenses: number
  totalProfit: number
  dailyRecords: DashboardDailyRecord[]
}
