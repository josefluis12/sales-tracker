import type { FormEvent } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Plus, RefreshCcw, Trash2 } from "lucide-react"
import { PAYMENT_METHODS } from "../../constants/payment-methods"
import type { PaymentMethod } from "../../constants/payment-methods"
import { PAYMENT_STATUS } from "../../constants/payment-status"
import type { PaymentStatus } from "../../constants/payment-status"
import { UNITS } from "../../constants/units"
import type { Unit } from "../../constants/units"
import { formatCurrency, formatDate, formatLabel } from "../../lib/formatters"
import { getErrorMessage, todayIsoDate } from "../../lib/utils"
import { getProducts } from "../../features/products/services/products-service"
import { getSuppliers } from "../../features/suppliers/services/suppliers-service"
import type { Product, Purchase, Sale, Supplier } from "../../types/database"
import { Button } from "../ui/button"

type ItemDraft = {
  product_id: string
  quantity: number
  unit: Unit
  price: number
}

type TransactionRecord = Purchase | Sale
export type TransactionCreateValues =
  | {
      supplier_id: string | null
      purchase_date: string
      payment_status: PaymentStatus
      payment_method: PaymentMethod
    }
  | {
      sale_date: string
      customer_name: string | null
      payment_status: PaymentStatus
      payment_method: PaymentMethod
      notes: string | null
    }

export type TransactionCreateItem = {
  product_id: string
  quantity: number
  unit: Unit
  unit_cost?: number
  unit_price?: number
}

type TransactionPageProps<TRecord extends TransactionRecord> = {
  kind: "purchase" | "sale"
  title: string
  description: string
  getRecords: () => Promise<TRecord[]>
  createRecord: (values: TransactionCreateValues, items: TransactionCreateItem[]) => Promise<TRecord>
  deleteRecord: (id: string) => Promise<void>
}

const blankItem: ItemDraft = {
  product_id: "",
  quantity: 1,
  unit: "kg",
  price: 0,
}

export function TransactionPage<TRecord extends TransactionRecord>({
  kind,
  title,
  description,
  getRecords,
  createRecord,
  deleteRecord,
}: TransactionPageProps<TRecord>) {
  const [records, setRecords] = useState<TRecord[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [items, setItems] = useState<ItemDraft[]>([{ ...blankItem }])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string>>({
    date: todayIsoDate(),
    supplier_id: "",
    customer_name: "",
    payment_status: "paid",
    payment_method: "cash",
    notes: "",
  })

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    [items],
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [nextRecords, nextProducts, nextSuppliers] = await Promise.all([
        getRecords(),
        getProducts(),
        kind === "purchase" ? getSuppliers() : Promise.resolve([]),
      ])
      setRecords(nextRecords)
      setProducts(nextProducts)
      setSuppliers(nextSuppliers)
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }, [getRecords, kind])

  useEffect(() => {
    void Promise.resolve().then(loadData)
  }, [loadData])

  function setItem(index: number, key: keyof ItemDraft, value: string) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [key]:
                key === "quantity" || key === "price"
                  ? Number(value || 0)
                  : key === "unit"
                    ? (value as Unit)
                    : value,
            }
          : item,
      ),
    )
  }

  function removeItem(index: number) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const cleanItems = items.filter((item) => item.product_id && item.quantity > 0)

      if (cleanItems.length === 0) {
        throw new Error("Add at least one item.")
      }

      const baseValues =
        kind === "purchase"
          ? {
              supplier_id: formValues.supplier_id || null,
              purchase_date: formValues.date,
              payment_status: formValues.payment_status as PaymentStatus,
              payment_method: formValues.payment_method as PaymentMethod,
            }
          : {
              sale_date: formValues.date,
              customer_name: formValues.customer_name || null,
              payment_status: formValues.payment_status as PaymentStatus,
              payment_method: formValues.payment_method as PaymentMethod,
              notes: formValues.notes || null,
            }

      const mappedItems = cleanItems.map((item) =>
        kind === "purchase"
          ? {
              product_id: item.product_id,
              quantity: item.quantity,
              unit: item.unit,
              unit_cost: item.price,
            }
          : {
              product_id: item.product_id,
              quantity: item.quantity,
              unit: item.unit,
              unit_price: item.price,
            },
      )

      await createRecord(baseValues, mappedItems)
      setItems([{ ...blankItem }])
      setFormValues((current) => ({
        ...current,
        date: todayIsoDate(),
        supplier_id: "",
        customer_name: "",
        notes: "",
      }))
      await loadData()
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(`Delete this ${kind}?`)) {
      return
    }

    try {
      await deleteRecord(id)
      await loadData()
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-description">{description}</p>
        </div>
        <Button variant="outline" type="button" onClick={() => void loadData()}>
          <RefreshCcw size={16} aria-hidden="true" />
          Refresh
        </Button>
      </header>

      <div className="content-grid">
        <section className="panel">
          <div className="panel-header">
            <h2 className="panel-title">New {kind}</h2>
          </div>
          <div className="panel-body">
            <form className="form-grid" onSubmit={(event) => void handleSubmit(event)}>
              <div className="field">
                <label htmlFor={`${kind}-date`}>Date</label>
                <input
                  className="input"
                  id={`${kind}-date`}
                  required
                  type="date"
                  value={formValues.date}
                  onChange={(event) =>
                    setFormValues((current) => ({ ...current, date: event.target.value }))
                  }
                />
              </div>

              {kind === "purchase" ? (
                <div className="field">
                  <label htmlFor="supplier">Supplier</label>
                  <select
                    className="select"
                    id="supplier"
                    value={formValues.supplier_id}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        supplier_id: event.target.value,
                      }))
                    }
                  >
                    <option value="">No supplier selected</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="field">
                  <label htmlFor="customer">Customer</label>
                  <input
                    className="input"
                    id="customer"
                    value={formValues.customer_name}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        customer_name: event.target.value,
                      }))
                    }
                  />
                </div>
              )}

              <div className="field">
                <label htmlFor="payment-status">Payment status</label>
                <select
                  className="select"
                  id="payment-status"
                  required
                  value={formValues.payment_status}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      payment_status: event.target.value,
                    }))
                  }
                >
                  {PAYMENT_STATUS.map((status) => (
                    <option key={status} value={status}>
                      {formatLabel(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="payment-method">Payment method</label>
                <select
                  className="select"
                  id="payment-method"
                  required
                  value={formValues.payment_method}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      payment_method: event.target.value,
                    }))
                  }
                >
                  {PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {formatLabel(method)}
                    </option>
                  ))}
                </select>
              </div>

              {kind === "sale" ? (
                <div className="field">
                  <label htmlFor={`${kind}-notes`}>Notes</label>
                  <textarea
                    className="textarea"
                    id={`${kind}-notes`}
                    value={formValues.notes}
                    onChange={(event) =>
                      setFormValues((current) => ({ ...current, notes: event.target.value }))
                    }
                  />
                </div>
              ) : null}

              <div className="field">
                <label>Items</label>
                <div className="form-grid">
                  {items.map((item, index) => (
                    <div className="item-row" key={`${item.product_id}-${index}`}>
                      <select
                        className="select"
                        required
                        value={item.product_id}
                        onChange={(event) => setItem(index, "product_id", event.target.value)}
                      >
                        <option value="">Product</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                      <input
                        className="input"
                        min="0"
                        step="0.01"
                        type="number"
                        value={item.quantity}
                        onChange={(event) => setItem(index, "quantity", event.target.value)}
                      />
                      <select
                        className="select"
                        value={item.unit}
                        onChange={(event) => setItem(index, "unit", event.target.value)}
                      >
                        {UNITS.map((unit) => (
                          <option key={unit} value={unit}>
                            {formatLabel(unit)}
                          </option>
                        ))}
                      </select>
                      <input
                        className="input"
                        min="0"
                        step="0.01"
                        type="number"
                        value={item.price}
                        onChange={(event) => setItem(index, "price", event.target.value)}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        disabled={items.length === 1}
                        type="button"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => setItems((current) => [...current, { ...blankItem }])}
                >
                  <Plus size={16} aria-hidden="true" />
                  Add item
                </Button>
              </div>

              <div className="total-strip">
                <span>Total</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>

              <Button type="submit" disabled={saving}>
                <Plus size={16} aria-hidden="true" />
                {saving ? "Saving" : `Save ${kind}`}
              </Button>
            </form>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Records</h2>
          </div>
          {error ? <div className="state error">{error}</div> : null}
          {loading ? (
            <div className="state">Loading records...</div>
          ) : records.length === 0 ? (
            <div className="state">No {kind}s recorded yet.</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Method</th>
                    {kind === "sale" ? <th>Notes</th> : null}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => {
                    const date =
                      "purchase_date" in record ? record.purchase_date : record.sale_date

                    return (
                      <tr key={record.id}>
                        <td data-label="Date">{formatDate(date)}</td>
                        <td data-label="Total">{formatCurrency(record.total_amount)}</td>
                        <td data-label="Status">{formatLabel(record.payment_status)}</td>
                        <td data-label="Method">
                          {"payment_method" in record ? formatLabel(record.payment_method) : "-"}
                        </td>
                        {kind === "sale" && "notes" in record ? (
                          <td data-label="Notes">{record.notes || "-"}</td>
                        ) : null}
                        <td data-label="Actions">
                          <Button
                            variant="destructive"
                            size="icon"
                            type="button"
                            onClick={() => void handleDelete(record.id)}
                          >
                            <Trash2 size={15} aria-hidden="true" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </>
  )
}
