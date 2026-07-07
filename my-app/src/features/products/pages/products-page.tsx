import { CrudPage } from "../../../components/common/crud-page"
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../services/products-service"
import type { ProductFormValues, ProductWithSalesUsage } from "../types"

const initialValues: ProductFormValues = {
  name: "",
}

function normalizeProductName(name: string) {
  return name.trim().replace(/\s+/g, " ")
}

function normalizeForComparison(name: string) {
  return normalizeProductName(name).toLocaleLowerCase()
}

function singularizeWord(word: string) {
  if (word.endsWith("ies") && word.length > 3) {
    return `${word.slice(0, -3)}y`
  }

  if (word.endsWith("es") && word.length > 2) {
    return word.slice(0, -2)
  }

  if (word.endsWith("s") && word.length > 1) {
    return word.slice(0, -1)
  }

  return word
}

function getProductTokens(name: string) {
  return normalizeForComparison(name)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(singularizeWord)
}

function getEditDistance(firstValue: string, secondValue: string) {
  const first = singularizeWord(firstValue)
  const second = singularizeWord(secondValue)
  const distances = Array.from({ length: first.length + 1 }, (_, index) => [index])

  for (let column = 1; column <= second.length; column += 1) {
    distances[0][column] = column
  }

  for (let row = 1; row <= first.length; row += 1) {
    for (let column = 1; column <= second.length; column += 1) {
      const substitutionCost = first[row - 1] === second[column - 1] ? 0 : 1

      distances[row][column] = Math.min(
        distances[row - 1][column] + 1,
        distances[row][column - 1] + 1,
        distances[row - 1][column - 1] + substitutionCost,
      )
    }
  }

  return distances[first.length][second.length]
}

function productNamesAreSimilar(firstName: string, secondName: string) {
  const first = normalizeForComparison(firstName)
  const second = normalizeForComparison(secondName)

  if (!first || !second || first === second) {
    return false
  }

  if (singularizeWord(first) === singularizeWord(second)) {
    return true
  }

  if (first.includes(second) || second.includes(first)) {
    return true
  }

  const firstTokens = getProductTokens(first)
  const secondTokens = getProductTokens(second)
  const sharedToken = firstTokens.some((token) => token.length > 2 && secondTokens.includes(token))

  if (sharedToken) {
    return true
  }

  return getEditDistance(first, second) <= 2
}

export function ProductsPage() {
  return (
    <CrudPage<ProductWithSalesUsage, ProductFormValues>
      title="Products"
      description="Maintain the vegetable and item names used by purchases, prices, and sales."
      createLabel="Add Product"
      emptyMessage="No products yet. Add your first vegetable or item."
      initialValues={initialValues}
      fields={[{ name: "name", label: "Product name", required: true }]}
      columns={[
        { key: "name", label: "Name" },
        { key: "sale_items_count", label: "Sales Items" },
        { key: "created_at", label: "Created", format: "date" },
      ]}
      getRecords={getProducts}
      createRecord={createProduct}
      updateRecord={updateProduct}
      deleteRecord={deleteProduct}
      validateCreate={(values, products) => {
        const normalizedName = normalizeForComparison(values.name)
        const exactMatch = products.find(
          (product) => normalizeForComparison(product.name) === normalizedName,
        )

        return exactMatch ? `A product named "${exactMatch.name}" already exists.` : null
      }}
      getCreateConfirmation={(values, products) => {
        const similarProducts = products.filter((product) =>
          productNamesAreSimilar(values.name, product.name),
        )

        return similarProducts.length > 0
          ? {
              title: "Similar Products Found",
              message:
                "Review these existing products before adding a new one with a similar name.",
              records: similarProducts,
              confirmLabel: "Add Product",
            }
          : null
      }}
    />
  )
}
