import type { FormEvent, ReactNode } from "react"
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
import type { Product, ProductPrice, Purchase, Sale, Supplier } from "../../types/database"
import { Button } from "../ui/button"

type ItemDraft = {
  product_id: string
  quantity: string
  unit: Unit
  price: string
  subtotal: string
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
      amount_paid: number
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
  subtotal?: number
}

type TransactionPageProps<TRecord extends TransactionRecord> = {
  kind: "purchase" | "sale"
  title: string
  description: string
  getRecords: () => Promise<TRecord[]>
  createRecord: (values: TransactionCreateValues, items: TransactionCreateItem[]) => Promise<TRecord>
  deleteRecord: (id: string) => Promise<void>
  getPriceSuggestions?: () => Promise<ProductPrice[]>
  headerActions?: ReactNode
}

const blankItem: ItemDraft = {
  product_id: "",
  quantity: "1",
  unit: "kg",
  price: "",
  subtotal: "",
}

function parseAmount(value: string) {
  return Number(value || 0)
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}

function roundQuantity(value: number) {
  return Math.round(value * 100) / 100
}

function formatInputNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

function getItemSubtotal(item: ItemDraft) {
  return item.subtotal
    ? parseAmount(item.subtotal)
    : parseAmount(item.quantity) * parseAmount(item.price)
}

function getSelectedProductName(products: Product[], productId: string) {
  return products.find((product) => product.id === productId)?.name ?? "Selected product"
}

export function TransactionPage<TRecord extends TransactionRecord>({
  kind,
  title,
  description,
  getRecords,
  createRecord,
  deleteRecord,
  getPriceSuggestions,
  headerActions,
}: TransactionPageProps<TRecord>) {
  const [records, setRecords] = useState<TRecord[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [priceSuggestions, setPriceSuggestions] = useState<ProductPrice[]>([])
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
    amount_paid: "",
    notes: "",
  })

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + getItemSubtotal(item), 0),
    [items],
  )

  const itemPriceLabel = kind === "purchase" ? "Unit cost" : "Unit price"
  const amountPaid = formValues.payment_status === "paid" ? totalAmount : parseAmount(formValues.amount_paid)
  const balanceDue =
    kind === "sale"
      ? roundCurrency(Math.max(totalAmount - amountPaid, 0))
      : 0

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [nextRecords, nextProducts, nextSuppliers, nextPriceSuggestions] = await Promise.all([
        getRecords(),
        getProducts(),
        kind === "purchase" ? getSuppliers() : Promise.resolve([]),
        getPriceSuggestions ? getPriceSuggestions() : Promise.resolve([]),
      ])
      setRecords(nextRecords)
      setProducts(nextProducts)
      setSuppliers(nextSuppliers)
      setPriceSuggestions(nextPriceSuggestions)
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }, [getPriceSuggestions, getRecords, kind])

  useEffect(() => {
    void Promise.resolve().then(loadData)
  }, [loadData])

  function setItem(index: number, key: keyof ItemDraft, value: string) {
    setItems((current) =>
      current.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item
        }

        if (kind === "sale" && key === "product_id") {
          const suggestionForCurrentUnit = priceSuggestions.find(
            (priceSuggestion) =>
              priceSuggestion.product_id === value && priceSuggestion.unit === item.unit,
          )
          const firstProductSuggestion = priceSuggestions.find(
            (priceSuggestion) => priceSuggestion.product_id === value,
          )
          const suggestion = suggestionForCurrentUnit ?? firstProductSuggestion

          return {
            ...item,
            product_id: value,
            unit: suggestion?.unit ?? item.unit,
            price:
              suggestion?.selling_price === undefined
                ? item.price
                : String(suggestion.selling_price),
          }
        }

        if (kind === "sale" && key === "unit") {
          const unit = value as Unit
          const suggestion = priceSuggestions.find(
            (priceSuggestion) =>
              priceSuggestion.product_id === item.product_id && priceSuggestion.unit === unit,
          )

          return {
            ...item,
            unit,
            price:
              suggestion?.selling_price === undefined
                ? item.price
                : String(suggestion.selling_price),
          }
        }

        if (kind === "sale" && key === "subtotal" && item.unit === "kg") {
          const unitPrice = parseAmount(item.price)
          const quantity = unitPrice > 0 ? roundQuantity(parseAmount(value) / unitPrice) : 0

          return {
            ...item,
            subtotal: value,
            quantity: quantity > 0 ? formatInputNumber(quantity) : item.quantity,
          }
        }

        return {
          ...item,
          [key]:
            key === "quantity" || key === "price"
              ? value
              : key === "unit"
                ? (value as Unit)
                : value,
        }
      }),
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
      const cleanItems = items.filter(
        (item) => item.product_id && parseAmount(item.quantity) > 0,
      )

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
              amount_paid:
                formValues.payment_status === "partial"
                  ? roundCurrency(Math.min(parseAmount(formValues.amount_paid), totalAmount))
                  : formValues.payment_status === "paid"
                    ? roundCurrency(totalAmount)
                    : 0,
              payment_status: formValues.payment_status as PaymentStatus,
              payment_method: formValues.payment_method as PaymentMethod,
              notes: formValues.notes || null,
            }

      const mappedItems = cleanItems.map((item) => {
        const quantity = roundQuantity(parseAmount(item.quantity))

        return kind === "purchase"
          ? {
              product_id: item.product_id,
              quantity,
              unit: item.unit,
              unit_cost: parseAmount(item.price),
            }
          : {
              product_id: item.product_id,
              quantity,
              unit: item.unit,
              unit_price: quantity > 0 ? getItemSubtotal(item) / quantity : parseAmount(item.price),
              subtotal: roundCurrency(getItemSubtotal(item)),
            }
      })

      await createRecord(baseValues, mappedItems)
      setItems([{ ...blankItem }])
      setFormValues((current) => ({
        ...current,
        date: todayIsoDate(),
        supplier_id: "",
        customer_name: "",
        amount_paid: "",
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
        <div className="page-header-actions">
          {headerActions}
          <Button variant="outline" type="button" onClick={() => void loadData()}>
            <RefreshCcw size={16} aria-hidden="true" />
            Refresh
          </Button>
        </div>
      </header>

      <div className="content-grid transaction-grid">
        <section className="panel">
          <div className="panel-header">
            <h2 className="panel-title">New {kind}</h2>
          </div>
          <div className="panel-body">
            <form className="form-grid" onSubmit={(event) => void handleSubmit(event)}>
              <div className={kind === "sale" ? "field sale-secondary-field" : "field"}>
                <label htmlFor={`${kind}-date`}>Date</label>
                <input
                  className="input"
                  id={`${kind}-date`}
                  required={kind !== "sale"}
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
                <div className="field sale-secondary-field">
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

              <div className={kind === "sale" ? "field sale-secondary-field" : "field"}>
                <label htmlFor="payment-status">Payment status</label>
                <select
                  className="select"
                  id="payment-status"
                  required={kind !== "sale"}
                  value={formValues.payment_status}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      payment_status: event.target.value,
                      amount_paid: event.target.value === "partial" ? current.amount_paid : "",
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

              {kind === "sale" && formValues.payment_status === "partial" ? (
                <div className="field sale-secondary-field">
                  <label htmlFor="amount-paid">Amount paid</label>
                  <input
                    className="input"
                    id="amount-paid"
                    min="0"
                    step="0.01"
                    type="number"
                    value={formValues.amount_paid}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        amount_paid: event.target.value,
                      }))
                    }
                  />
                </div>
              ) : null}

              <div className={kind === "sale" ? "field sale-secondary-field" : "field"}>
                <label htmlFor="payment-method">Payment method</label>
                <select
                  className="select"
                  id="payment-method"
                  required={kind !== "sale"}
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
                <div className="field sale-secondary-field">
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

              {kind === "sale" ? (
                <details className="sale-mobile-details">
                  <summary>Sale details</summary>
                  <div className="sale-mobile-details-body">
                    <div className="field">
                      <label htmlFor="sale-mobile-date">Date</label>
                      <input
                        className="input"
                        id="sale-mobile-date"
                        type="date"
                        value={formValues.date}
                        onChange={(event) =>
                          setFormValues((current) => ({ ...current, date: event.target.value }))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="sale-mobile-customer">Customer</label>
                      <input
                        className="input"
                        id="sale-mobile-customer"
                        value={formValues.customer_name}
                        onChange={(event) =>
                          setFormValues((current) => ({
                            ...current,
                            customer_name: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="sale-mobile-payment-status">Payment status</label>
                      <select
                        className="select"
                        id="sale-mobile-payment-status"
                        value={formValues.payment_status}
                        onChange={(event) =>
                          setFormValues((current) => ({
                            ...current,
                            payment_status: event.target.value,
                            amount_paid: event.target.value === "partial" ? current.amount_paid : "",
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
                    {formValues.payment_status === "partial" ? (
                      <div className="field">
                        <label htmlFor="sale-mobile-amount-paid">Amount paid</label>
                        <input
                          className="input"
                          id="sale-mobile-amount-paid"
                          min="0"
                          step="0.01"
                          type="number"
                          value={formValues.amount_paid}
                          onChange={(event) =>
                            setFormValues((current) => ({
                              ...current,
                              amount_paid: event.target.value,
                            }))
                          }
                        />
                      </div>
                    ) : null}
                    <div className="field">
                      <label htmlFor="sale-mobile-payment-method">Payment method</label>
                      <select
                        className="select"
                        id="sale-mobile-payment-method"
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
                    <div className="field">
                      <label htmlFor="sale-mobile-notes">Notes</label>
                      <textarea
                        className="textarea"
                        id="sale-mobile-notes"
                        value={formValues.notes}
                        onChange={(event) =>
                          setFormValues((current) => ({ ...current, notes: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                </details>
              ) : null}

              <div className="field">
                <label>Items</label>
                <div className="form-grid">
                  {items.map((item, index) => (
                    <div
                      className={kind === "sale" ? "item-row sale-mobile-item-row" : "item-row"}
                      key={`${item.product_id}-${index}`}
                    >
                      {kind === "sale" ? (
                        <div className="sale-mobile-product-step">
                          <p className="sale-mobile-step-label">
                            {item.product_id
                              ? getSelectedProductName(products, item.product_id)
                              : "Select product"}
                          </p>
                          <div className="sale-mobile-product-grid">
                            {products.map((product) => (
                              <button
                                className={
                                  item.product_id === product.id
                                    ? "sale-mobile-product-option sale-mobile-product-option-active"
                                    : "sale-mobile-product-option"
                                }
                                key={product.id}
                                type="button"
                                onClick={() => setItem(index, "product_id", product.id)}
                              >
                                {product.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      <div
                        className={
                          kind === "sale" ? "field sale-desktop-product-field" : "field"
                        }
                      >
                        <label htmlFor={`${kind}-item-${index}-product`}>Product</label>
                        <select
                          className="select"
                          id={`${kind}-item-${index}-product`}
                          required={kind !== "sale"}
                          value={item.product_id}
                          onChange={(event) => setItem(index, "product_id", event.target.value)}
                        >
                          <option value="">Select product</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div
                        className={
                          kind === "sale" && !item.product_id
                            ? "field sale-mobile-item-detail sale-mobile-hidden"
                            : "field sale-mobile-item-detail"
                        }
                      >
                        <label htmlFor={`${kind}-item-${index}-quantity`}>Quantity</label>
                        <input
                          className="input"
                          id={`${kind}-item-${index}-quantity`}
                          min="0"
                          step="0.01"
                          type="number"
                          value={item.quantity}
                          onChange={(event) => setItem(index, "quantity", event.target.value)}
                          onBlur={(event) => {
                            const value = event.target.value

                            if (value) {
                              setItem(
                                index,
                                "quantity",
                                formatInputNumber(roundQuantity(parseAmount(value))),
                              )
                            }
                          }}
                        />
                      </div>
                      <div
                        className={
                          kind === "sale" && !item.product_id
                            ? "field sale-mobile-item-detail sale-mobile-hidden"
                            : "field sale-mobile-item-detail"
                        }
                      >
                        <label htmlFor={`${kind}-item-${index}-unit`}>Unit</label>
                        <select
                          className="select"
                          id={`${kind}-item-${index}-unit`}
                          value={item.unit}
                          onChange={(event) => setItem(index, "unit", event.target.value)}
                        >
                          {UNITS.map((unit) => (
                            <option key={unit} value={unit}>
                              {formatLabel(unit)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div
                        className={
                          kind === "sale" && !item.product_id
                            ? "field sale-mobile-item-detail sale-mobile-hidden"
                            : "field sale-mobile-item-detail"
                        }
                      >
                        <label htmlFor={`${kind}-item-${index}-price`}>{itemPriceLabel}</label>
                        <input
                          className="input"
                          id={`${kind}-item-${index}-price`}
                          min="0"
                          step="0.01"
                          type="number"
                          value={item.price}
                          onChange={(event) => setItem(index, "price", event.target.value)}
                        />
                      </div>
                      {kind === "sale" ? (
                        <div
                          className={
                            !item.product_id
                              ? "field sale-mobile-item-detail sale-mobile-hidden"
                              : "field sale-mobile-item-detail"
                          }
                        >
                          <label htmlFor={`${kind}-item-${index}-subtotal`}>Subtotal</label>
                          <input
                            className="input"
                            id={`${kind}-item-${index}-subtotal`}
                            min="0"
                            step="0.01"
                            type="number"
                            value={item.subtotal}
                            placeholder={String(roundCurrency(getItemSubtotal(item)))}
                            onChange={(event) =>
                              setItem(index, "subtotal", event.target.value)
                            }
                          />
                        </div>
                      ) : null}
                      <Button
                        variant="outline"
                        size="icon"
                        aria-label="Remove item"
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
              {kind === "sale" && formValues.payment_status !== "paid" ? (
                <div className="total-strip">
                  <span>Unpaid balance</span>
                  <span>
                    {formatCurrency(formValues.payment_status === "unpaid" ? totalAmount : balanceDue)}
                  </span>
                </div>
              ) : null}

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
                    {kind === "sale" ? <th>Paid</th> : null}
                    {kind === "sale" ? <th>Balance</th> : null}
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
                        {kind === "sale" && "amount_paid" in record ? (
                          <td data-label="Paid">{formatCurrency(record.amount_paid)}</td>
                        ) : null}
                        {kind === "sale" && "amount_paid" in record ? (
                          <td data-label="Balance">
                            {formatCurrency(
                              Math.max(record.total_amount - record.amount_paid, 0),
                            )}
                          </td>
                        ) : null}
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
