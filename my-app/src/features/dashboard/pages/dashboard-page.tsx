import { RefreshCcw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Button } from "../../../components/ui/button"
import { formatCurrency, formatDate } from "../../../lib/formatters"
import { getErrorMessage } from "../../../lib/utils"
import { getDashboardSummary } from "../services/dashboard-service"
import type { DashboardDailySales, DashboardSummary, DashboardTopProduct } from "../types"

const emptySummary: DashboardSummary = {
  salesToday: 0,
  purchasesToday: 0,
  expensesToday: 0,
  netProfitToday: 0,
  dailySales: [],
  topByQuantity: [],
  frequentlyBought: [],
  mostProfitable: [],
}

const todayCards = [
  { key: "salesToday", label: "Sales Today" },
  { key: "purchasesToday", label: "Purchases Today" },
  { key: "expensesToday", label: "Expenses Today" },
  { key: "netProfitToday", label: "Net Profit Today" },
] as const

type TopProductsTableProps = {
  title: string
  products: DashboardTopProduct[]
  loading: boolean
  valueLabel: string
  renderValue: (product: DashboardTopProduct) => string
}

function TopProductsTable({
  title,
  products,
  loading,
  valueLabel,
  renderValue,
}: TopProductsTableProps) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h3 className="panel-title">{title}</h3>
      </div>
      {loading ? (
        <div className="state">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="state">No sales items today.</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Unit</th>
                <th scope="col">{valueLabel}</th>
                <th scope="col">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={`${product.productId}-${product.unit}`}>
                  <td data-label="Product">{product.productName}</td>
                  <td data-label="Unit">{product.unit}</td>
                  <td data-label={valueLabel}>{renderValue(product)}</td>
                  <td data-label="Revenue">{formatCurrency(product.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

type MonthlySalesChartProps = {
  dailySales: DashboardDailySales[]
  loading: boolean
}

function MonthlySalesChart({ dailySales, loading }: MonthlySalesChartProps) {
  const maxSales = Math.max(...dailySales.map((day) => day.totalSales), 0)

  return (
    <section className="panel" aria-labelledby="monthly-sales-chart-title">
      <div className="panel-header">
        <h2 className="panel-title" id="monthly-sales-chart-title">
          Monthly Sales by Day
        </h2>
      </div>
      {loading ? (
        <div className="state">Loading monthly sales...</div>
      ) : dailySales.length === 0 ? (
        <div className="state">No sales days available.</div>
      ) : (
        <div className="monthly-sales-chart" aria-label="Bar chart of daily sales this month">
          {dailySales.map((day) => {
            const height = maxSales > 0 ? Math.max((day.totalSales / maxSales) * 100, 4) : 0
            const dayNumber = new Date(day.date).getDate()

            return (
              <div className="monthly-sales-bar-item" key={day.date}>
                <div className="monthly-sales-bar-track">
                  <div
                    className="monthly-sales-bar-fill"
                    style={{ height: `${height}%` }}
                    title={`${formatDate(day.date)}: ${formatCurrency(day.totalSales)}`}
                  />
                </div>
                <span>{dayNumber}</span>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

type DailySalesTableProps = {
  dailySales: DashboardDailySales[]
  loading: boolean
}

function DailySalesTable({ dailySales, loading }: DailySalesTableProps) {
  const daysWithSales = dailySales.filter((day) => day.salesCount > 0).toReversed()

  return (
    <section className="panel" aria-labelledby="daily-sales-table-title">
      <div className="panel-header">
        <h2 className="panel-title" id="daily-sales-table-title">
          Daily Sales
        </h2>
      </div>
      {loading ? (
        <div className="state">Loading daily sales...</div>
      ) : daysWithSales.length === 0 ? (
        <div className="state">No sales recorded this month.</div>
      ) : (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Sales</th>
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {daysWithSales.map((day) => (
                <tr key={day.date}>
                  <td data-label="Date">{formatDate(day.date)}</td>
                  <td data-label="Sales">{day.salesCount.toLocaleString("en-PH")}</td>
                  <td data-label="Total">{formatCurrency(day.totalSales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSummary = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      setSummary(await getDashboardSummary())
    } catch (summaryError) {
      setError(getErrorMessage(summaryError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadSummary)
  }, [loadSummary])

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-description">
            Daily totals for {formatDate(new Date())}. Profit is recovered sales minus investment
            and expenses.
          </p>
        </div>
        <Button variant="outline" type="button" onClick={() => void loadSummary()}>
          <RefreshCcw size={16} aria-hidden="true" />
          Refresh
        </Button>
      </header>

      {error ? <div className="state error">{error}</div> : null}

      <section className="summary-grid" aria-label="Today summary">
        {todayCards.map((card) => (
          <article className="summary-card" key={card.key}>
            <p className="summary-label">{card.label}</p>
            <p className="summary-value">
              {loading ? "Loading..." : formatCurrency(summary[card.key])}
            </p>
          </article>
        ))}
      </section>

      <div className="dashboard-sales-grid">
        <MonthlySalesChart dailySales={summary.dailySales} loading={loading} />
        <DailySalesTable dailySales={summary.dailySales} loading={loading} />
      </div>

      <section aria-labelledby="top-sellers-title">
        <div className="mb-3">
          <h2 className="panel-title" id="top-sellers-title">
            Today's Top Sellers
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 py-4 xl:grid-cols-3">
          <TopProductsTable
            title="Quantity Bought"
            products={summary.topByQuantity}
            loading={loading}
            valueLabel="Quantity"
            renderValue={(product) => product.quantitySold.toLocaleString("en-PH")}
          />
          <TopProductsTable
            title="Frequently Bought"
            products={summary.frequentlyBought}
            loading={loading}
            valueLabel="Times Bought"
            renderValue={(product) => product.timesBought.toLocaleString("en-PH")}
          />
          <TopProductsTable
            title="Most Profitable"
            products={summary.mostProfitable}
            loading={loading}
            valueLabel="Est. Profit"
            renderValue={(product) => formatCurrency(product.estimatedProfit)}
          />
        </div>
      </section>
    </>
  )
}
