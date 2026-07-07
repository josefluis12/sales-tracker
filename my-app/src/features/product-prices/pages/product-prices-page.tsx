import { Edit2, Plus, RefreshCcw, Trash2, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "../../../components/ui/button"
import { UNITS } from "../../../constants/units"
import type { Unit } from "../../../constants/units"
import { formatCurrency, formatDate, formatLabel } from "../../../lib/formatters"
import { getErrorMessage } from "../../../lib/utils"
import { getProducts } from "../../products/services/products-service"
import {
  createProductPrice,
  deleteProductPrice,
  getProductPrices,
  type ProductPriceWithProductName,
  updateProductPrice,
} from "../services/product-prices-service"
import type { ProductPriceFormValues } from "../types"

const initialValues: ProductPriceFormValues = {
  product_id: "",
  unit: "kg",
  selling_price: 0,
  is_active: true,
}

type ProductOption = {
  value: string
  label: string
}

type ProductPriceGroup = {
  productId: string
  productName: string
  prices: ProductPriceWithProductName[]
}

function getNextUnusedUnit(records: ProductPriceWithProductName[], productId: string): Unit {
  const usedUnits = new Set(
    records.filter((price) => price.product_id === productId).map((price) => price.unit),
  )

  return UNITS.find((unit) => !usedUnits.has(unit)) ?? "kg"
}

function groupProductPrices(records: ProductPriceWithProductName[]) {
  const groupsByProductId = new Map<string, ProductPriceGroup>()

  records.forEach((price) => {
    const group = groupsByProductId.get(price.product_id)

    if (group) {
      group.prices.push(price)
      return
    }

    groupsByProductId.set(price.product_id, {
      productId: price.product_id,
      productName: price.product_name ?? "Unknown product",
      prices: [price],
    })
  })

  return Array.from(groupsByProductId.values()).map((group) => ({
    ...group,
    prices: group.prices.toSorted((first, second) => first.unit.localeCompare(second.unit)),
  }))
}

export function ProductPricesPage() {
  const [records, setRecords] = useState<ProductPriceWithProductName[]>([])
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [formValues, setFormValues] = useState<ProductPriceFormValues>(initialValues)
  const [editingRecord, setEditingRecord] = useState<ProductPriceWithProductName | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const groups = useMemo(() => groupProductPrices(records), [records])
  const formTitle = editingRecord ? "Edit Unit Price" : "Add Price"

  const loadRecords = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const [prices, products] = await Promise.all([getProductPrices(), getProducts()])
      setRecords(prices)
      setProductOptions(products.map((product) => ({ value: product.id, label: product.name })))
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRecords()
  }, [loadRecords])

  function resetForm() {
    setEditingRecord(null)
    setFormValues(initialValues)
  }

  function startEdit(record: ProductPriceWithProductName) {
    setEditingRecord(record)
    setFormValues({
      product_id: record.product_id,
      unit: record.unit,
      selling_price: record.selling_price,
      is_active: record.is_active ?? true,
    })
  }

  function startAddUnit(productId: string) {
    setEditingRecord(null)
    setFormValues({
      product_id: productId,
      unit: getNextUnusedUnit(records, productId),
      selling_price: 0,
      is_active: true,
    })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (editingRecord) {
        await updateProductPrice(editingRecord.id, formValues)
      } else {
        await createProductPrice(formValues)
      }

      resetForm()
      await loadRecords()
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(record: ProductPriceWithProductName) {
    const confirmed = window.confirm(
      `Delete ${record.product_name ?? "this product"} / ${formatLabel(record.unit)} price?`,
    )

    if (!confirmed) {
      return
    }

    setError(null)

    try {
      await deleteProductPrice(record.id)
      await loadRecords()
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    }
  }

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Product Prices</h1>
          <p className="page-description">
            Store suggested selling prices grouped by product, with a separate row for each unit.
          </p>
        </div>
        <Button variant="outline" type="button" onClick={() => void loadRecords()}>
          <RefreshCcw size={16} aria-hidden="true" />
          Refresh
        </Button>
      </header>

      <div className="content-grid">
        <section className="panel" aria-labelledby="product-prices-form">
          <div className="panel-header">
            <h2 className="panel-title" id="product-prices-form">
              {formTitle}
            </h2>
            {editingRecord ? (
              <Button variant="outline" size="icon" type="button" onClick={resetForm}>
                <X size={16} aria-hidden="true" />
                <span className="sr-only">Cancel edit</span>
              </Button>
            ) : null}
          </div>
          <div className="panel-body">
            <form className="form-grid" onSubmit={(event) => void handleSubmit(event)}>
              <div className="field">
                <label htmlFor="product-price-product">Product</label>
                <select
                  className="select"
                  id="product-price-product"
                  required
                  value={formValues.product_id}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      product_id: event.target.value,
                      unit: event.target.value
                        ? getNextUnusedUnit(records, event.target.value)
                        : current.unit,
                    }))
                  }
                >
                  <option value="">Select product</option>
                  {productOptions.map((product) => (
                    <option key={product.value} value={product.value}>
                      {product.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="product-price-unit">Unit</label>
                <select
                  className="select"
                  id="product-price-unit"
                  required
                  value={formValues.unit}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      unit: event.target.value as Unit,
                    }))
                  }
                >
                  {UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {formatLabel(unit)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="product-price-selling-price">Suggested price</label>
                <input
                  className="input"
                  id="product-price-selling-price"
                  min="0"
                  required
                  step="0.01"
                  type="number"
                  value={formValues.selling_price}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      selling_price: Number(event.target.value || 0),
                    }))
                  }
                />
              </div>

              <div className="field">
                <label htmlFor="product-price-active">Active</label>
                <input
                  id="product-price-active"
                  type="checkbox"
                  checked={Boolean(formValues.is_active)}
                  onChange={(event) =>
                    setFormValues((current) => ({
                      ...current,
                      is_active: event.target.checked,
                    }))
                  }
                />
              </div>

              <Button type="submit" disabled={saving}>
                <Plus size={16} aria-hidden="true" />
                {saving ? "Saving" : editingRecord ? "Save Changes" : "Add Price"}
              </Button>
            </form>
          </div>
        </section>

        <section className="panel" aria-labelledby="product-prices-list">
          <div className="panel-header">
            <h2 className="panel-title" id="product-prices-list">
              Products
            </h2>
          </div>
          {error ? <div className="state error">{error}</div> : null}
          {loading ? (
            <div className="state">Loading product prices...</div>
          ) : groups.length === 0 ? (
            <div className="state">No suggested prices yet.</div>
          ) : (
            <div className="product-price-groups">
              {groups.map((group) => (
                <section
                  className="product-price-group"
                  key={group.productId}
                  aria-labelledby={`product-price-group-${group.productId}`}
                >
                  <div className="product-price-group-header">
                    <div>
                      <h3 id={`product-price-group-${group.productId}`}>{group.productName}</h3>
                      <p>{group.prices.length} unit price rows</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      type="button"
                      onClick={() => startAddUnit(group.productId)}
                    >
                      <Plus size={15} aria-hidden="true" />
                      Add Unit
                    </Button>
                  </div>

                  <div className="table-wrap">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Unit</th>
                          <th>Suggested Price</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {group.prices.map((price) => (
                          <tr key={price.id}>
                            <td data-label="Unit">{formatLabel(price.unit)}</td>
                            <td data-label="Suggested Price">
                              {formatCurrency(price.selling_price)}
                            </td>
                            <td data-label="Status">
                              {price.is_active === false ? "Inactive" : "Active"}
                            </td>
                            <td data-label="Created">{formatDate(price.created_at)}</td>
                            <td data-label="Actions">
                              <div className="row-actions">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  type="button"
                                  onClick={() => startEdit(price)}
                                >
                                  <Edit2 size={15} aria-hidden="true" />
                                  <span className="sr-only">Edit</span>
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  type="button"
                                  onClick={() => void handleDelete(price)}
                                >
                                  <Trash2 size={15} aria-hidden="true" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  )
}
