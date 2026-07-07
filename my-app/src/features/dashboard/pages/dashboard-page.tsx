import { RefreshCcw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Button } from "../../../components/ui/button"
import { formatCurrency, formatDate } from "../../../lib/formatters"
import { getErrorMessage } from "../../../lib/utils"
import { getDashboardSummary } from "../services/dashboard-service"
import type { DashboardSummary } from "../types"

const emptySummary: DashboardSummary = {
  salesToday: 0,
  purchasesToday: 0,
  expensesToday: 0,
  netProfitToday: 0,
}

const cards = [
  { key: "salesToday", label: "Sales Today" },
  { key: "purchasesToday", label: "Purchases Today" },
  { key: "expensesToday", label: "Expenses Today" },
  { key: "netProfitToday", label: "Net Profit Today" },
] as const

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
            Daily totals for {formatDate(new Date())}. Net profit is sales minus purchases and
            expenses.
          </p>
        </div>
        <Button variant="outline" type="button" onClick={() => void loadSummary()}>
          <RefreshCcw size={16} aria-hidden="true" />
          Refresh
        </Button>
      </header>

      {error ? <div className="state error">{error}</div> : null}

      <section className="summary-grid" aria-label="Today summary">
        {cards.map((card) => (
          <article className="summary-card" key={card.key}>
            <p className="summary-label">{card.label}</p>
            <p className="summary-value">
              {loading ? "Loading..." : formatCurrency(summary[card.key])}
            </p>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">V1 Focus</h2>
        </div>
        <div className="panel-body">
          <p className="page-description">
            This version tracks reliable records for products, prices, suppliers, purchases, sales,
            and expenses. Inventory deduction, unit conversion, role-based access, charts, and
            advanced accounting are intentionally left out.
          </p>
        </div>
      </section>
    </>
  )
}
