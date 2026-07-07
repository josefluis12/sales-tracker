import { CrudPage } from "../../../components/common/crud-page"
import {
  createSupplier,
  deleteSupplier,
  getSuppliers,
  updateSupplier,
} from "../services/suppliers-service"
import type { Supplier, SupplierFormValues } from "../types"

const initialValues: SupplierFormValues = {
  name: "",
  contact_number: "",
  contact_person: "",
  address: "",
  is_active: true,
}

export function SuppliersPage() {
  return (
    <CrudPage<Supplier, SupplierFormValues>
      title="Suppliers"
      description="Track vendors and supplier contact details for purchases."
      createLabel="Add Supplier"
      emptyMessage="No suppliers yet."
      initialValues={initialValues}
      fields={[
        { name: "name", label: "Supplier name", required: true },
        { name: "contact_person", label: "Contact person" },
        { name: "contact_number", label: "Contact number" },
        { name: "address", label: "Address", type: "textarea" },
        { name: "is_active", label: "Active", type: "checkbox" },
      ]}
      columns={[
        { key: "name", label: "Name" },
        { key: "contact_person", label: "Contact" },
        { key: "contact_number", label: "Contact Number" },
        { key: "is_active", label: "Status", format: "boolean" },
      ]}
      getRecords={getSuppliers}
      createRecord={createSupplier}
      updateRecord={updateSupplier}
      deleteRecord={deleteSupplier}
    />
  )
}
