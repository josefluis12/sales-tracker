import { TransactionPage } from "../../../components/common/transaction-page"
import type { TransactionCreateItem, TransactionCreateValues } from "../../../components/common/transaction-page"
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
      hideRecordsOnMobile
    />
  )
}
