import { RefreshCcw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Button } from "../../../components/ui/button"
import { formatCurrency, formatDate } from "../../../lib/formatters"
import { getErrorMessage } from "../../../lib/utils"
import { getDashboardSummary } from "../services/dashboard-service"
import type { DashboardSummary, DashboardTopProduct } from "../types"

const emptySummary: DashboardSummary = {
  salesToday: 0,
  purchasesToday: 0,
  expensesToday: 0,
  netProfitToday: 0,
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
