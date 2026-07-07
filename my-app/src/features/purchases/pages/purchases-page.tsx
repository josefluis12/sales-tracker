import { TransactionPage } from "../../../components/common/transaction-page"
import {
  createPurchaseWithItems,
  deletePurchase,
  getPurchases,
} from "../services/purchases-service"
import type { TransactionCreateItem, TransactionCreateValues } from "../../../components/common/transaction-page"
import type { Purchase, PurchaseFormValues, PurchaseItemFormValues } from "../types"

function savePurchase(values: TransactionCreateValues, items: TransactionCreateItem[]) {
  return createPurchaseWithItems(
    values as PurchaseFormValues,
    items as PurchaseItemFormValues[],
  )
}

export function PurchasesPage() {
  return (
    <TransactionPage<Purchase>
      kind="purchase"
      title="Purchases"
      description="Record buying costs and purchase line items. V1 keeps records without inventory deduction."
      getRecords={getPurchases}
      createRecord={savePurchase}
      deleteRecord={deletePurchase}
    />
  )
}
