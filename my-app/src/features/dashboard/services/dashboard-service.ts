import { supabase } from "../../../lib/supabase"
import { todayIsoDate } from "../../../lib/utils"
import type { DashboardSummary, DashboardTopProduct } from "../types"

type ProductSalesTotals = {
  productId: string
  productName: string
  unit: string
  quantitySold: number
  timesBought: number
  revenue: number
}

type ProductCostTotals = {
  totalCost: number
  quantity: number
}

const topProductLimit = 5

function sumAmounts(rows: { total_amount?: number | null; amount?: number | null }[]) {
  return rows.reduce((sum, row) => sum + (row.total_amount ?? row.amount ?? 0), 0)
}

function getProductUnitKey(productId: string, unit: string) {
  return `${productId}:${unit}`
}

function sortAndLimitTopProducts(
  products: DashboardTopProduct[],
  key: keyof Pick<
    DashboardTopProduct,
    "quantitySold" | "timesBought" | "estimatedProfit"
  >,
) {
  return [...products]
    .sort((first, second) => {
      const valueDifference = second[key] - first[key]

      if (valueDifference !== 0) {
        return valueDifference
      }

      return second.revenue - first.revenue
    })
    .slice(0, topProductLimit)
}

function createTopProductLists(
  products: { id: string; name: string }[],
  saleItems: {
    sale_id: string
    product_id: string
    quantity: number
    unit: string
    subtotal: number
  }[],
  purchaseItems: {
    product_id: string
    quantity: number
    unit: string
    subtotal: number
  }[],
  todaySaleIds: Set<string>,
) {
  const productNames = new Map(products.map((product) => [product.id, product.name]))
  const salesByProductUnit = new Map<string, ProductSalesTotals>()
  const costsByProductUnit = new Map<string, ProductCostTotals>()

  saleItems.forEach((item) => {
    if (!todaySaleIds.has(item.sale_id)) {
      return
    }

    const key = getProductUnitKey(item.product_id, item.unit)
    const existing = salesByProductUnit.get(key) ?? {
      productId: item.product_id,
      productName: productNames.get(item.product_id) ?? "Unknown product",
      unit: item.unit,
      quantitySold: 0,
      timesBought: 0,
      revenue: 0,
    }

    existing.quantitySold += item.quantity
    existing.timesBought += 1
    existing.revenue += item.subtotal
    salesByProductUnit.set(key, existing)
  })

  purchaseItems.forEach((item) => {
    const key = getProductUnitKey(item.product_id, item.unit)
    const existing = costsByProductUnit.get(key) ?? {
      totalCost: 0,
      quantity: 0,
    }

    existing.totalCost += item.subtotal
    existing.quantity += item.quantity
    costsByProductUnit.set(key, existing)
  })

  const topProducts = Array.from(salesByProductUnit.entries()).map<DashboardTopProduct>(
    ([key, item]) => {
      const costTotals = costsByProductUnit.get(key)
      const averageUnitCost =
        costTotals && costTotals.quantity > 0 ? costTotals.totalCost / costTotals.quantity : 0

      return {
        ...item,
        estimatedProfit: item.revenue - item.quantitySold * averageUnitCost,
      }
    },
  )

  return {
    topByQuantity: sortAndLimitTopProducts(topProducts, "quantitySold"),
    frequentlyBought: sortAndLimitTopProducts(topProducts, "timesBought"),
    mostProfitable: sortAndLimitTopProducts(topProducts, "estimatedProfit"),
  }
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const today = todayIsoDate()
  const [sales, purchases, expenses, products, saleItems, purchaseItems] = await Promise.all([
    supabase.from("sales").select("id,sale_date,total_amount").order("sale_date", {
      ascending: false,
    }),
    supabase.from("purchases").select("purchase_date,total_amount").order("purchase_date", {
      ascending: false,
    }),
    supabase.from("expenses").select("expense_date,amount").order("expense_date", {
      ascending: false,
    }),
    supabase.from("products").select("id,name"),
    supabase.from("sale_items").select("sale_id,product_id,quantity,unit,subtotal"),
    supabase.from("purchase_items").select("product_id,quantity,unit,subtotal"),
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

  if (products.error) {
    throw new Error(products.error.message)
  }

  if (saleItems.error) {
    throw new Error(saleItems.error.message)
  }

  if (purchaseItems.error) {
    throw new Error(purchaseItems.error.message)
  }

  const todaySales = sales.data.filter((sale) => sale.sale_date === today)
  const todaySaleIds = new Set(todaySales.map((sale) => sale.id))
  const salesToday = sumAmounts(todaySales)
  const purchasesToday = sumAmounts(
    purchases.data.filter((purchase) => purchase.purchase_date === today),
  )
  const expensesToday = sumAmounts(
    expenses.data.filter((expense) => expense.expense_date === today),
  )
  const topProductLists = createTopProductLists(
    products.data,
    saleItems.data,
    purchaseItems.data,
    todaySaleIds,
  )

  return {
    salesToday,
    purchasesToday,
    expensesToday,
    netProfitToday: salesToday - purchasesToday - expensesToday,
    ...topProductLists,
  }
}
