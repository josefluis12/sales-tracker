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
  totalInvestment: 0,
  totalRecovered: 0,
  totalExpenses: 0,
  totalProfit: 0,
  dailyRecords: [],
}

const todayCards = [
  { key: "salesToday", label: "Sales Today" },
  { key: "purchasesToday", label: "Purchases Today" },
  { key: "expensesToday", label: "Expenses Today" },
  { key: "netProfitToday", label: "Net Profit Today" },
] as const

const totalCards = [
  { key: "totalInvestment", label: "Total Investment" },
  { key: "totalRecovered", label: "Total Recovered" },
  { key: "totalExpenses", label: "Total Expenses" },
  { key: "totalProfit", label: "Profit" },
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

      <section className="summary-grid" aria-label="Business totals">
        {totalCards.map((card) => (
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
          <h2 className="panel-title">Daily Records</h2>
        </div>
        {loading ? (
          <div className="state">Loading daily records...</div>
        ) : summary.dailyRecords.length === 0 ? (
          <div className="state">No daily records yet.</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Investment</th>
                  <th scope="col">Total Daily Expense</th>
                  <th scope="col">Recovered</th>
                  <th scope="col">Profit</th>
                </tr>
              </thead>
              <tbody>
                {summary.dailyRecords.map((record) => (
                  <tr key={record.date}>
                    <td data-label="Date">{formatDate(record.date)}</td>
                    <td data-label="Investment">{formatCurrency(record.investment)}</td>
                    <td data-label="Total Daily Expense">
                      {formatCurrency(record.totalDailyExpense)}
                    </td>
                    <td data-label="Recovered">{formatCurrency(record.recovered)}</td>
                    <td data-label="Profit">{formatCurrency(record.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
