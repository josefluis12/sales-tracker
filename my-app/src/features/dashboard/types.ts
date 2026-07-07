export type DashboardTopProduct = {
  productId: string
  productName: string
  unit: string
  quantitySold: number
  timesBought: number
  revenue: number
  estimatedProfit: number
}

export type DashboardDailySales = {
  date: string
  salesCount: number
  totalSales: number
}

export type DashboardSummary = {
  salesToday: number
  purchasesToday: number
  expensesToday: number
  netProfitToday: number
  dailySales: DashboardDailySales[]
  topByQuantity: DashboardTopProduct[]
  frequentlyBought: DashboardTopProduct[]
  mostProfitable: DashboardTopProduct[]
}
