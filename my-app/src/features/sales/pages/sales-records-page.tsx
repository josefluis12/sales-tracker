import { Link } from "react-router-dom"
import { BarChart3, Plus } from "lucide-react"
import { TransactionPage } from "../../../components/common/transaction-page"
import type {
  TransactionCreateItem,
  TransactionCreateValues,
} from "../../../components/common/transaction-page"
import { Button } from "../../../components/ui/button"
import { getActiveProductPrices } from "../../product-prices/services/product-prices-service"
import { createSaleWithItems, deleteSale, getSales } from "../services/sales-service"
import type { Sale, SaleCreateValues, SaleItemFormValues } from "../types"

function saveSale(values: TransactionCreateValues, items: TransactionCreateItem[]) {
  return createSaleWithItems(values as SaleCreateValues, items as SaleItemFormValues[])
}

export function SalesRecordsPage() {
  return (
    <TransactionPage<Sale>
      kind="sale"
      title="Sales Records"
      description="Review previous sales, payment status, paid amounts, balances, and notes."
      getRecords={getSales}
      createRecord={saveSale}
      deleteRecord={deleteSale}
      getPriceSuggestions={getActiveProductPrices}
      view="records"
      headerActions={
        <>
          <Button asChild variant="outline" type="button">
            <Link to="/sales">
              <Plus size={16} aria-hidden="true" />
              New Sale
            </Link>
          </Button>
          <Button asChild variant="outline" type="button">
            <Link to="/sales-report">
              <BarChart3 size={16} aria-hidden="true" />
              Sales Report
            </Link>
          </Button>
        </>
      }
    />
  )
}
