import { CrudPage } from "../../../components/common/crud-page"
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../services/products-service"
import type { Product, ProductFormValues } from "../types"

const initialValues: ProductFormValues = {
  name: "",
}

export function ProductsPage() {
  return (
    <CrudPage<Product, ProductFormValues>
      title="Products"
      description="Maintain the vegetable and item names used by purchases, prices, and sales."
      createLabel="Add Product"
      emptyMessage="No products yet. Add your first vegetable or item."
      initialValues={initialValues}
      fields={[{ name: "name", label: "Product name", required: true }]}
      columns={[
        { key: "name", label: "Name" },
        { key: "created_at", label: "Created", format: "date" },
      ]}
      getRecords={getProducts}
      createRecord={createProduct}
      updateRecord={updateProduct}
      deleteRecord={deleteProduct}
    />
  )
}
