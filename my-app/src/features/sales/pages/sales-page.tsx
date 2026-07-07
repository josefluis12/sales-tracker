import { Link } from "react-router-dom"
import { BarChart3 } from "lucide-react"
import { TransactionPage } from "../../../components/common/transaction-page"
import type { TransactionCreateItem, TransactionCreateValues } from "../../../components/common/transaction-page"
import { Button } from "../../../components/ui/button"
import { getActiveProductPrices } from "../../product-prices/services/product-prices-service"
import { createSaleWithItems, deleteSale, getSales } from "../services/sales-service"
import type { Sale, SaleCreateValues, SaleItemFormValues } from "../types"

function saveSale(values: TransactionCreateValues, items: TransactionCreateItem[]) {
  return createSaleWithItems(values as SaleCreateValues, items as SaleItemFormValues[])
}

export function SalesPage() {
  return (
    <TransactionPage<Sale>
      kind="sale"
      title="Sales"
      description="Record sales and line item prices exactly as charged at the time of sale."
      getRecords={getSales}
      createRecord={saveSale}
      deleteRecord={deleteSale}
      getPriceSuggestions={getActiveProductPrices}
      headerActions={
        <Button asChild variant="outline" type="button">
          <Link to="/sales-report">
            <BarChart3 size={16} aria-hidden="true" />
            Sales Report
          </Link>
        </Button>
      }
    />
  )
}
