import { useEffect, useState } from "react"
import { CrudPage } from "../../../components/common/crud-page"
import { UNITS } from "../../../constants/units"
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

export function ProductPricesPage() {
  const [productOptions, setProductOptions] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    void getProducts().then((products) => {
      setProductOptions(products.map((product) => ({ value: product.id, label: product.name })))
    })
  }, [])

  return (
    <CrudPage<ProductPriceWithProductName, ProductPriceFormValues>
      title="Product Prices"
      description="Store one suggested selling price per product for sales, without changing old sale item prices."
      createLabel="Add Price"
      emptyMessage="No suggested prices yet."
      initialValues={initialValues}
      fields={[
        {
          name: "product_id",
          label: "Product",
          type: "select",
          required: true,
          options: productOptions,
        },
        { name: "unit", label: "Unit", type: "select", required: true, options: UNITS },
        { name: "selling_price", label: "Suggested price", type: "number", required: true },
        { name: "is_active", label: "Active", type: "checkbox" },
      ]}
      columns={[
        { key: "product_name", label: "Product" },
        { key: "unit", label: "Unit", format: "label" },
        { key: "selling_price", label: "Suggested Price", format: "currency" },
        { key: "is_active", label: "Status", format: "boolean" },
        { key: "created_at", label: "Created", format: "date" },
      ]}
      getRecords={getProductPrices}
      createRecord={createProductPrice}
      updateRecord={updateProductPrice}
      deleteRecord={deleteProductPrice}
    />
  )
}
