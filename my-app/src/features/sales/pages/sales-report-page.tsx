import { useCallback, useEffect, useMemo, useState } from "react"
import { ChevronRight, Download, FileText, RefreshCcw } from "lucide-react"
import { Button } from "../../../components/ui/button"
import { formatCurrency, formatDate, formatLabel } from "../../../lib/formatters"
import { getErrorMessage } from "../../../lib/utils"
import { getDailySalesReport } from "../services/sales-service"
import type { DailySalesReportGroup } from "../types"

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function buildSalesReportHtml(group: DailySalesReportGroup) {
  const saleRows = group.sales
    .flatMap((sale) =>
      sale.items.map(
        (item) => `
          <tr>
            <td>${escapeHtml(sale.customerName || "Walk-in customer")}</td>
            <td>${escapeHtml(formatLabel(sale.paymentStatus))}</td>
            <td>${escapeHtml(formatLabel(sale.paymentMethod))}</td>
            <td class="number">${formatCurrency(sale.amountPaid)}</td>
            <td class="number">${formatCurrency(sale.balanceDue)}</td>
            <td>${escapeHtml(item.productName)}</td>
            <td class="number">${item.quantity.toLocaleString("en-PH")}</td>
            <td>${escapeHtml(formatLabel(item.unit))}</td>
            <td class="number">${formatCurrency(item.unitPrice)}</td>
            <td class="number">${formatCurrency(item.subtotal)}</td>
            <td>${escapeHtml(sale.notes ?? "")}</td>
          </tr>
        `,
      ),
    )
    .join("")

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Sales Report - ${escapeHtml(formatDate(group.date))}</title>
        <style>
          body { color: #172018; font-family: Arial, sans-serif; margin: 28px; }
          h1 { font-size: 24px; margin: 0 0 6px; }
          p { margin: 0 0 18px; }
          .summary { display: grid; gap: 10px; grid-template-columns: repeat(4, 1fr); margin-bottom: 18px; }
          .summary div { border: 1px solid #d7ded5; padding: 10px; }
          .label { color: #5d6b5e; display: block; font-size: 12px; font-weight: 700; margin-bottom: 6px; text-transform: uppercase; }
          .value { font-size: 16px; font-weight: 700; }
          table { border-collapse: collapse; font-size: 12px; width: 100%; }
          th, td { border: 1px solid #d7ded5; padding: 8px; text-align: left; vertical-align: top; }
          th { background: #eef3ed; font-size: 11px; text-transform: uppercase; }
          .number { text-align: right; }
          @media print { body { margin: 18px; } }
        </style>
      </head>
      <body>
        <h1>Sales Report</h1>
        <p>${escapeHtml(formatDate(group.date))}</p>
        <section class="summary">
          <div><span class="label">Total Sales</span><span class="value">${formatCurrency(group.totalAmount)}</span></div>
          <div><span class="label">Records</span><span class="value">${group.saleCount.toLocaleString("en-PH")}</span></div>
          <div><span class="label">Items Sold</span><span class="value">${group.itemCount.toLocaleString("en-PH")}</span></div>
          <div><span class="label">Open Amount</span><span class="value">${formatCurrency(group.partialAmount + group.unpaidAmount)}</span></div>
        </section>
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Product</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Unit Price</th>
              <th>Subtotal</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${saleRows || '<tr><td colspan="11">No items found for this day.</td></tr>'}
          </tbody>
        </table>
      </body>
    </html>
  `
}

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function getSalesReportFilename(group: DailySalesReportGroup, extension: string) {
  return `sales-report-${group.date}.${extension}`
}

export function SalesReportPage() {
  const [groups, setGroups] = useState<DailySalesReportGroup[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reportTotals = useMemo(
    () =>
      groups.reduce(
        (totals, group) => ({
          saleCount: totals.saleCount + group.saleCount,
          totalAmount: totals.totalAmount + group.totalAmount,
          paidAmount: totals.paidAmount + group.paidAmount,
          partialAmount: totals.partialAmount + group.partialAmount,
          unpaidAmount: totals.unpaidAmount + group.unpaidAmount,
        }),
        {
          saleCount: 0,
          totalAmount: 0,
          paidAmount: 0,
          partialAmount: 0,
          unpaidAmount: 0,
        },
      ),
    [groups],
  )

  const loadReport = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      setGroups(await getDailySalesReport())
    } catch (reportError) {
      setError(getErrorMessage(reportError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadReport)
  }, [loadReport])

  const selectedGroup = useMemo(
    () => groups.find((group) => group.date === selectedDate) ?? null,
    [groups, selectedDate],
  )

  function handleDownloadExcel() {
    if (!selectedGroup) {
      return
    }

    downloadBlob(
      buildSalesReportHtml(selectedGroup),
      getSalesReportFilename(selectedGroup, "xls"),
      "application/vnd.ms-excel;charset=utf-8",
    )
  }

  function handlePrintPdf() {
    if (!selectedGroup) {
      return
    }

    const printWindow = window.open("", "_blank", "noopener,noreferrer")

    if (!printWindow) {
      setError("Unable to open the print window. Please allow pop-ups and try again.")
      return
    }

    printWindow.document.write(buildSalesReportHtml(selectedGroup))
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Sales Report</h1>
          <p className="page-description">
            Select a day to review the products sold, quantities, units, prices, and subtotals.
          </p>
        </div>
        <Button variant="outline" type="button" onClick={() => void loadReport()}>
          <RefreshCcw size={16} aria-hidden="true" />
          Refresh
        </Button>
      </header>

      {error ? <div className="state error">{error}</div> : null}

      <section className="summary-grid" aria-label="Sales report totals">
        <article className="summary-card">
          <p className="summary-label">Total Sales</p>
          <p className="summary-value">
            {loading ? "Loading..." : formatCurrency(reportTotals.totalAmount)}
          </p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Records</p>
          <p className="summary-value">
            {loading ? "Loading..." : reportTotals.saleCount.toLocaleString("en-PH")}
          </p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Paid</p>
          <p className="summary-value">
            {loading ? "Loading..." : formatCurrency(reportTotals.paidAmount)}
          </p>
        </article>
        <article className="summary-card">
          <p className="summary-label">Open Amount</p>
          <p className="summary-value">
            {loading
              ? "Loading..."
              : formatCurrency(reportTotals.partialAmount + reportTotals.unpaidAmount)}
          </p>
        </article>
      </section>

      <div className="sales-report-grid">
        <section className="panel">
        <div className="panel-header">
          <h2 className="panel-title">Days</h2>
        </div>
        {loading ? (
          <div className="state">Loading sales report...</div>
        ) : groups.length === 0 ? (
          <div className="state">No sales recorded yet.</div>
        ) : (
          <div className="sales-report-list">
            {groups.map((group) => (
              <button
                className={
                  selectedDate === group.date
                    ? "sales-report-day sales-report-day-active"
                    : "sales-report-day"
                }
                key={group.date}
                type="button"
                onClick={() => setSelectedDate(group.date)}
              >
                <div className="sales-report-day-header">
                  <div>
                    <h3>{formatDate(group.date)}</h3>
                    <p>
                      {group.saleCount.toLocaleString("en-PH")} sales,{" "}
                      {group.itemCount.toLocaleString("en-PH")} items
                    </p>
                  </div>
                  <div className="sales-report-day-total">
                    <strong>{formatCurrency(group.totalAmount)}</strong>
                    <ChevronRight aria-hidden="true" />
                  </div>
                </div>

                <div className="sales-report-metrics" aria-label={`${formatDate(group.date)} totals`}>
                  <span>Paid {formatCurrency(group.paidAmount)}</span>
                  <span>Partial {formatCurrency(group.partialAmount)}</span>
                  <span>Unpaid {formatCurrency(group.unpaidAmount)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2 className="panel-title">
              {selectedGroup ? `${formatDate(selectedGroup.date)} Items` : "Sold Items"}
            </h2>
            <div className="row-actions">
              <Button
                disabled={!selectedGroup || loading}
                size="sm"
                type="button"
                variant="outline"
                onClick={handleDownloadExcel}
              >
                <Download size={16} aria-hidden="true" />
                Excel
              </Button>
              <Button
                disabled={!selectedGroup || loading}
                size="sm"
                type="button"
                variant="outline"
                onClick={handlePrintPdf}
              >
                <FileText size={16} aria-hidden="true" />
                PDF
              </Button>
            </div>
          </div>
          {loading ? (
            <div className="state">Loading sold items...</div>
          ) : !selectedGroup ? (
            <div className="state">Select a day to view the items sold.</div>
          ) : selectedGroup.items.length === 0 ? (
            <div className="state">No items found for this day.</div>
          ) : (
            <>
              <div className="sales-report-detail-summary">
                <span>{selectedGroup.itemCount.toLocaleString("en-PH")} items sold</span>
                <strong>{formatCurrency(selectedGroup.totalAmount)}</strong>
              </div>
              <div className="sales-report-list">
                {selectedGroup.sales.map((sale) => (
                  <article className="sales-report-sale" key={sale.id}>
                    <div className="sales-report-sale-header">
                      <div>
                        <h3>{sale.customerName || "Walk-in customer"}</h3>
                        <p>
                          {sale.items.length.toLocaleString("en-PH")} items ·{" "}
                          {formatLabel(sale.paymentStatus)} · {formatLabel(sale.paymentMethod)}
                        </p>
                        {sale.balanceDue > 0 ? (
                          <p>
                            Paid {formatCurrency(sale.amountPaid)} · Balance{" "}
                            {formatCurrency(sale.balanceDue)}
                          </p>
                        ) : null}
                      </div>
                      <strong>{formatCurrency(sale.totalAmount)}</strong>
                    </div>
                    {sale.notes ? <p className="sales-report-sale-notes">{sale.notes}</p> : null}
                    {sale.items.length === 0 ? (
                      <div className="state">No items found for this sale.</div>
                    ) : (
                      <div className="table-wrap">
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th scope="col">Product</th>
                              <th scope="col">Quantity</th>
                              <th scope="col">Unit</th>
                              <th scope="col">Unit Price</th>
                              <th scope="col">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sale.items.map((item) => (
                              <tr key={item.id}>
                                <td data-label="Product">{item.productName}</td>
                                <td data-label="Quantity">
                                  {item.quantity.toLocaleString("en-PH")}
                                </td>
                                <td data-label="Unit">{formatLabel(item.unit)}</td>
                                <td data-label="Unit Price">{formatCurrency(item.unitPrice)}</td>
                                <td data-label="Subtotal">{formatCurrency(item.subtotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </>
  )
}
