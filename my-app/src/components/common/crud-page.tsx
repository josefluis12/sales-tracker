import { Edit2, Plus, RefreshCcw, Trash2, X } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "../ui/button"
import { formatCurrency, formatDate, formatLabel } from "../../lib/formatters"
import { getErrorMessage } from "../../lib/utils"

export type CrudRecord = {
  id: string
  created_at?: string
} & Record<string, string | number | boolean | null | undefined>

export type FieldConfig<TRecord extends CrudRecord> = {
  name: keyof TRecord & string
  label: string
  type?: "text" | "number" | "date" | "select" | "textarea" | "checkbox"
  required?: boolean
  options?: readonly string[] | { value: string; label: string }[]
}

export type ColumnConfig<TRecord extends CrudRecord> = {
  key: keyof TRecord & string
  label: string
  format?: "currency" | "date" | "boolean" | "label"
}

type CrudPageProps<TRecord extends CrudRecord, TValues extends Record<string, unknown>> = {
  title: string
  description: string
  createLabel: string
  fields: FieldConfig<TRecord>[]
  columns: ColumnConfig<TRecord>[]
  emptyMessage: string
  initialValues: TValues
  getRecords: () => Promise<TRecord[]>
  createRecord: (values: TValues) => Promise<TRecord>
  updateRecord: (id: string, values: Partial<TValues>) => Promise<TRecord>
  deleteRecord: (id: string) => Promise<void>
  validateCreate?: (values: TValues, records: TRecord[]) => string | null
  getCreateConfirmation?: (
    values: TValues,
    records: TRecord[],
  ) => {
    title: string
    message: string
    records: TRecord[]
    confirmLabel?: string
  } | null
}

function createFormValues<TValues extends Record<string, unknown>>(values: TValues) {
  return { ...values } as Record<string, unknown>
}

function normalizeValue(value: unknown, type: FieldConfig<CrudRecord>["type"]) {
  if (type === "number") {
    return Number(value || 0)
  }

  if (type === "checkbox") {
    return Boolean(value)
  }

  return String(value ?? "")
}

function formatCell<TRecord extends CrudRecord>(record: TRecord, column: ColumnConfig<TRecord>) {
  const value = record[column.key]

  if (value === null || value === undefined || value === "") {
    return "-"
  }

  if (column.format === "currency" && typeof value === "number") {
    return formatCurrency(value)
  }

  if (column.format === "date" && typeof value === "string") {
    return formatDate(value)
  }

  if (column.format === "boolean" && typeof value === "boolean") {
    return value ? "Active" : "Inactive"
  }

  if (column.format === "label" && typeof value === "string") {
    return formatLabel(value)
  }

  return String(value)
}

export function CrudPage<TRecord extends CrudRecord, TValues extends Record<string, unknown>>({
  title,
  description,
  createLabel,
  fields,
  columns,
  emptyMessage,
  initialValues,
  getRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  validateCreate,
  getCreateConfirmation,
}: CrudPageProps<TRecord, TValues>) {
  const [records, setRecords] = useState<TRecord[]>([])
  const [formValues, setFormValues] = useState(() => createFormValues(initialValues))
  const [editingRecord, setEditingRecord] = useState<TRecord | null>(null)
  const [pendingCreateConfirmation, setPendingCreateConfirmation] = useState<{
    values: TValues
    title: string
    message: string
    records: TRecord[]
    confirmLabel?: string
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const formTitle = useMemo(
    () => (editingRecord ? `Edit ${title}` : createLabel),
    [createLabel, editingRecord, title],
  )

  const loadRecords = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      setRecords(await getRecords())
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setLoading(false)
    }
  }, [getRecords])

  useEffect(() => {
    void Promise.resolve().then(loadRecords)
  }, [loadRecords])

  function updateFormValue(field: FieldConfig<TRecord>, value: string | boolean) {
    setFormValues((current) => ({
      ...current,
      [field.name]: normalizeValue(value, field.type),
    }))
  }

  function resetForm() {
    setEditingRecord(null)
    setFormValues(createFormValues(initialValues))
    setPendingCreateConfirmation(null)
  }

  function startEdit(record: TRecord) {
    setEditingRecord(record)
    const nextValues = createFormValues(initialValues)

    fields.forEach((field) => {
      nextValues[field.name] = record[field.name] ?? initialValues[field.name]
    })

    setFormValues(nextValues)
  }

  async function saveCreate(values: TValues) {
    setSaving(true)
    setError(null)

    try {
      await createRecord(values)
      resetForm()
      await loadRecords()
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setSaving(false)
    }
  }

  async function saveUpdate(id: string, values: Partial<TValues>) {
    setSaving(true)
    setError(null)

    try {
      await updateRecord(id, values)
      resetForm()
      await loadRecords()
    } catch (saveError) {
      setError(getErrorMessage(saveError))
    } finally {
      setSaving(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (editingRecord) {
      await saveUpdate(editingRecord.id, formValues as Partial<TValues>)
      return
    }

    const submittedValues = { ...formValues } as TValues
    const validationError = validateCreate?.(submittedValues, records)

    if (validationError) {
      setError(validationError)
      return
    }

    const confirmation = getCreateConfirmation?.(submittedValues, records)

    if (confirmation && confirmation.records.length > 0) {
      setPendingCreateConfirmation({
        values: submittedValues,
        ...confirmation,
      })
      return
    }

    await saveCreate(submittedValues)
  }

  async function confirmPendingCreate() {
    if (!pendingCreateConfirmation) {
      return
    }

    const { values } = pendingCreateConfirmation
    setPendingCreateConfirmation(null)
    await saveCreate(values)
  }

  async function handleDelete(record: TRecord) {
    const confirmed = window.confirm(`Delete this ${title.toLowerCase()} record?`)

    if (!confirmed) {
      return
    }

    setError(null)

    try {
      await deleteRecord(record.id)
      await loadRecords()
    } catch (deleteError) {
      setError(getErrorMessage(deleteError))
    }
  }

  return (
    <>
      {pendingCreateConfirmation ? (
        <div className="dialog-backdrop" role="presentation">
          <div
            aria-labelledby="create-confirmation-title"
            aria-modal="true"
            className="dialog-panel"
            role="dialog"
          >
            <div className="dialog-header">
              <h2 className="dialog-title" id="create-confirmation-title">
                {pendingCreateConfirmation.title}
              </h2>
              <Button
                variant="outline"
                size="icon"
                type="button"
                onClick={() => setPendingCreateConfirmation(null)}
              >
                <X size={16} aria-hidden="true" />
                <span className="sr-only">Cancel</span>
              </Button>
            </div>
            <p className="dialog-description">{pendingCreateConfirmation.message}</p>
            <div className="similar-list">
              {pendingCreateConfirmation.records.map((record) => (
                <div className="similar-list-item" key={record.id}>
                  {String(record.name ?? record.id)}
                </div>
              ))}
            </div>
            <div className="dialog-actions">
              <Button
                variant="outline"
                type="button"
                onClick={() => setPendingCreateConfirmation(null)}
              >
                Cancel
              </Button>
              <Button type="button" disabled={saving} onClick={() => void confirmPendingCreate()}>
                {saving ? "Saving" : pendingCreateConfirmation.confirmLabel ?? "Add Anyway"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <header className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-description">{description}</p>
        </div>
        <Button variant="outline" type="button" onClick={() => void loadRecords()}>
          <RefreshCcw size={16} aria-hidden="true" />
          Refresh
        </Button>
      </header>

      <div className="content-grid">
        <section className="panel" aria-labelledby={`${title}-form`}>
          <div className="panel-header">
            <h2 className="panel-title" id={`${title}-form`}>
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
              {fields.map((field) => {
                const value = formValues[field.name]

                return (
                  <div className="field" key={field.name}>
                    <label htmlFor={field.name}>{field.label}</label>
                    {field.type === "select" ? (
                      <select
                        className="select"
                        id={field.name}
                        required={field.required}
                        value={String(value ?? "")}
                        onChange={(event) => updateFormValue(field, event.target.value)}
                      >
                        <option value="">Select {field.label.toLowerCase()}</option>
                        {field.options?.map((option) => {
                          const optionValue = typeof option === "string" ? option : option.value
                          const optionLabel =
                            typeof option === "string" ? formatLabel(option) : option.label

                          return (
                            <option key={optionValue} value={optionValue}>
                              {optionLabel}
                            </option>
                          )
                        })}
                      </select>
                    ) : field.type === "textarea" ? (
                      <textarea
                        className="textarea"
                        id={field.name}
                        required={field.required}
                        value={String(value ?? "")}
                        onChange={(event) => updateFormValue(field, event.target.value)}
                      />
                    ) : field.type === "checkbox" ? (
                      <input
                        id={field.name}
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(event) => updateFormValue(field, event.target.checked)}
                      />
                    ) : (
                      <input
                        className="input"
                        id={field.name}
                        min={field.type === "number" ? "0" : undefined}
                        step={field.type === "number" ? "0.01" : undefined}
                        required={field.required}
                        type={field.type ?? "text"}
                        value={String(value ?? "")}
                        onChange={(event) => updateFormValue(field, event.target.value)}
                      />
                    )}
                  </div>
                )
              })}
              <Button type="submit" disabled={saving}>
                <Plus size={16} aria-hidden="true" />
                {saving ? "Saving" : editingRecord ? "Save Changes" : createLabel}
              </Button>
            </form>
          </div>
        </section>

        <section className="panel" aria-labelledby={`${title}-table`}>
          <div className="panel-header">
            <h2 className="panel-title" id={`${title}-table`}>
              Records
            </h2>
          </div>
          {error ? <div className="state error">{error}</div> : null}
          {loading ? (
            <div className="state">Loading records...</div>
          ) : records.length === 0 ? (
            <div className="state">{emptyMessage}</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      {columns.map((column) => (
                        <td data-label={column.label} key={column.key}>
                          {formatCell(record, column)}
                        </td>
                      ))}
                      <td data-label="Actions">
                        <div className="row-actions">
                          <Button
                            variant="outline"
                            size="icon"
                            type="button"
                            onClick={() => startEdit(record)}
                          >
                            <Edit2 size={15} aria-hidden="true" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            type="button"
                            onClick={() => void handleDelete(record)}
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
          )}
        </section>
      </div>
    </>
  )
}
