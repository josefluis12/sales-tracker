import { Navigate, Route, Routes } from "react-router-dom"
import { DashboardPage } from "../features/dashboard/pages/dashboard-page"
import { ExpensesPage } from "../features/expenses/pages/expenses-page"
import { ProductPricesPage } from "../features/product-prices/pages/product-prices-page"
import { ProductsPage } from "../features/products/pages/products-page"
import { PurchasesPage } from "../features/purchases/pages/purchases-page"
import { SalesPage } from "../features/sales/pages/sales-page"
import { SalesRecordsPage } from "../features/sales/pages/sales-records-page"
import { SalesReportPage } from "../features/sales/pages/sales-report-page"
import { SuppliersPage } from "../features/suppliers/pages/suppliers-page"

export function AppRoutes() {
  return (
    <Routes>
      <Route index element={<DashboardPage />} />
      <Route path="products" element={<ProductsPage />} />
      <Route path="product-prices" element={<ProductPricesPage />} />
      <Route path="suppliers" element={<SuppliersPage />} />
      <Route path="purchases" element={<PurchasesPage />} />
      <Route path="sales" element={<SalesPage />} />
      <Route path="sales-records" element={<SalesRecordsPage />} />
      <Route path="sales-report" element={<SalesReportPage />} />
      <Route path="expenses" element={<ExpensesPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
