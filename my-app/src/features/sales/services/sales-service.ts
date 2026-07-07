import { supabase } from "../../../lib/supabase"
import type {
  DailySalesReportGroup,
  DailySalesReportSale,
  SaleCreateValues,
  SaleItemFormValues,
} from "../types"

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}

function clampAmount(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getSaleAmountPaid(values: SaleCreateValues, totalAmount: number) {
  if (values.payment_status === "paid") {
    return totalAmount
  }

  if (values.payment_status === "unpaid") {
    return 0
  }

  return roundCurrency(clampAmount(values.amount_paid ?? 0, 0, totalAmount))
}

export async function getSales() {
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .order("sale_date", { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getDailySalesReport(): Promise<DailySalesReportGroup[]> {
  const [sales, saleItems, products] = await Promise.all([
    getSales(),
    supabase
      .from("sale_items")
      .select("id,sale_id,product_id,quantity,unit,unit_price,subtotal"),
    supabase.from("products").select("id,name"),
  ])

  if (saleItems.error) {
    throw new Error(saleItems.error.message)
  }

  if (products.error) {
    throw new Error(products.error.message)
  }

  const salesById = new Map(sales.map((sale) => [sale.id, sale]))
  const productNames = new Map(products.data.map((product) => [product.id, product.name]))
  const groupsByDate = new Map<string, DailySalesReportGroup>()
  const reportSalesById = new Map<string, DailySalesReportSale>()

  sales.forEach((sale) => {
    const existing = groupsByDate.get(sale.sale_date) ?? {
      date: sale.sale_date,
      saleCount: 0,
      itemCount: 0,
      totalAmount: 0,
      paidAmount: 0,
      partialAmount: 0,
      unpaidAmount: 0,
      sales: [],
      items: [],
    }

    existing.saleCount += 1
    existing.totalAmount += sale.total_amount
    const amountPaid = sale.amount_paid ?? (sale.payment_status === "paid" ? sale.total_amount : 0)
    const balanceDue = roundCurrency(Math.max(sale.total_amount - amountPaid, 0))
    const reportSale = {
      id: sale.id,
      saleDate: sale.sale_date,
      customerName: sale.customer_name,
      totalAmount: sale.total_amount,
      amountPaid,
      balanceDue,
      paymentStatus: sale.payment_status,
      paymentMethod: sale.payment_method,
      notes: sale.notes,
      items: [],
    }

    existing.sales.push(reportSale)
    reportSalesById.set(sale.id, reportSale)

    existing.paidAmount += amountPaid

    if (sale.payment_status === "partial") {
      existing.partialAmount += balanceDue
    }

    if (sale.payment_status === "unpaid") {
      existing.unpaidAmount += balanceDue
    }

    groupsByDate.set(sale.sale_date, existing)
  })

  saleItems.data.forEach((item) => {
    const sale = salesById.get(item.sale_id)

    if (!sale) {
      return
    }

    const group = groupsByDate.get(sale.sale_date)

    if (!group) {
      return
    }

    const reportItem = {
      id: item.id,
      saleId: sale.id,
      productName: productNames.get(item.product_id) ?? "Unknown product",
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unit_price,
      subtotal: item.subtotal,
    }

    group.itemCount += 1
    group.items.push(reportItem)
    reportSalesById.get(sale.id)?.items.push(reportItem)
  })

  return Array.from(groupsByDate.values()).sort((first, second) =>
    second.date.localeCompare(first.date),
  )
}

export async function createSaleWithItems(values: SaleCreateValues, items: SaleItemFormValues[]) {
  const saleItems = items.map((item) => {
    const subtotal = roundCurrency(item.subtotal ?? item.quantity * item.unit_price)
    const unitPrice = item.quantity > 0 ? subtotal / item.quantity : item.unit_price

    return {
      ...item,
      unit_price: unitPrice,
      subtotal,
    }
  })
  const totalAmount = roundCurrency(saleItems.reduce((sum, item) => sum + item.subtotal, 0))
  const amountPaid = getSaleAmountPaid(values, totalAmount)

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({ ...values, amount_paid: amountPaid, total_amount: totalAmount })
    .select()
    .single()

  if (saleError) {
    throw new Error(saleError.message)
  }

  const { error: itemsError } = await supabase.from("sale_items").insert(
    saleItems.map((item) => ({
      ...item,
      sale_id: sale.id,
    })),
  )

  if (itemsError) {
    throw new Error(itemsError.message)
  }

  return sale
}

export async function deleteSale(id: string) {
  const { error } = await supabase.from("sales").delete().eq("id", id)

  if (error) {
    throw new Error(error.message)
  }
}
