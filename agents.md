# AGENTS.md

## Project

Vegetable Business Tracker

A Vite + React + TypeScript + Supabase app for tracking products, product prices, purchases, sales, expenses, suppliers, and dashboard reports for a vegetable business.

---

## Tech Stack

* Vite
* React
* TypeScript
* Supabase
* Tailwind CSS
* shadcn/ui, if installed
* React Router, if routing is needed
* date-fns, if date formatting is needed

---

## Folder Structure

Use this structure:

```txt
src/
  app/
    App.tsx
    routes.tsx

  components/
    common/
    forms/
    layout/
    tables/
    ui/

  features/
    products/
      components/
      hooks/
      pages/
      services/
      types.ts

    product-prices/
      components/
      hooks/
      pages/
      services/
      types.ts

    suppliers/
      components/
      hooks/
      pages/
      services/
      types.ts

    purchases/
      components/
      hooks/
      pages/
      services/
      types.ts

    sales/
      components/
      hooks/
      pages/
      services/
      types.ts

    expenses/
      components/
      hooks/
      pages/
      services/
      types.ts

    dashboard/
      components/
      hooks/
      pages/
      services/
      types.ts

  lib/
    supabase.ts
    utils.ts
    formatters.ts

  types/
    database.ts
    common.ts

  constants/
    units.ts
    expense-categories.ts
    payment-status.ts
    payment-methods.ts
```

---

## Naming Conventions

### Files and Folders

Use kebab-case for folders and most files.

```txt
product-prices/
create-product-form.tsx
sales-table.tsx
use-sales.ts
sales-service.ts
```

### React Components

Use PascalCase for component names.

```tsx
CreateProductForm
SalesTable
DashboardSummaryCards
```

### Hooks

Use camelCase and prefix with `use`.

```ts
useProducts
useSales
useExpenses
useSuppliers
```

### Services

Use feature-based service files.

```txt
products-service.ts
sales-service.ts
purchases-service.ts
```

Functions should be clear and action-based:

```ts
getProducts()
createProduct()
updateProduct()
deleteProduct()
getSalesWithItems()
createSaleWithItems()
```

### Types

Use PascalCase for TypeScript types.

```ts
Product
ProductPrice
Sale
SaleItem
Purchase
PurchaseItem
Expense
Supplier
```

For form values:

```ts
ProductFormValues
SaleFormValues
PurchaseFormValues
ExpenseFormValues
```

---

## Database Tables

The app uses these Supabase tables:

```txt
products
product_prices
suppliers
purchases
purchase_items
sales
sale_items
expenses
```

Always use the exact database table names above.

---

## Business Rules

* `products` stores the item name only.
* `product_prices` stores suggested selling prices by unit.
* `sale_items.unit_price` stores the actual price used during the sale.
* `purchase_items.unit_cost` stores the actual buying cost.
* Product prices may change, but old sale records must keep their original unit price.
* Purchases and sales may use different units.
* V1 does not need unit conversion.
* V1 is for record tracking, not precise inventory tracking.
* Do not implement inventory deduction unless explicitly requested.

---

## Units

Use string values for units.

Recommended units:

```ts
kg
piece
bundle
sack
crate
tray
pack
```

Store units in constants:

```ts
// src/constants/units.ts
export const UNITS = [
  "kg",
  "piece",
  "bundle",
  "sack",
  "crate",
  "tray",
  "pack",
] as const
```

---

## Expense Categories

Default expense categories:

```ts
rent
fuel
salary
utilities
maintenance
inventory
other
```

Store in:

```txt
src/constants/expense-categories.ts
```

---

## Payment Status

Use:

```ts
paid
partial
unpaid
```

Store in:

```txt
src/constants/payment-status.ts
```

---

## Coding Rules

* Use TypeScript strictly.
* Avoid `any` unless absolutely necessary.
* Keep components small and focused.
* Put Supabase queries inside feature `services/` folders.
* Put reusable UI in `components/common/` or `components/ui/`.
* Put page-specific components inside the feature folder.
* Keep business logic out of JSX when possible.
* Use clear error handling for Supabase queries.
* Use loading and empty states for tables.
* Format currency as Philippine peso.
* Format dates consistently.

---

## Currency Formatting

Use this helper:

```ts
export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value)
}
```

Place it in:

```txt
src/lib/formatters.ts
```

---

## Date Formatting

Use a consistent format:

```txt
MMM dd, yyyy
```

Example:

```ts
Jul 07, 2026
```

---

## Page Requirements

Create these pages:

```txt
DashboardPage
ProductsPage
ProductPricesPage
SuppliersPage
PurchasesPage
SalesPage
ExpensesPage
```

Each page should have:

* Title
* Main action button
* Table/list view
* Create form
* Edit action where applicable
* Delete or deactivate action where applicable
* Loading state
* Empty state
* Error state

---

## Feature Order

Build the app in this order:

1. Supabase client setup
2. Shared types
3. Layout and navigation
4. Products CRUD
5. Product Prices CRUD
6. Suppliers CRUD
7. Expenses CRUD
8. Purchases with purchase items
9. Sales with sale items
10. Dashboard summaries
11. Reports

---

## UI Guidelines

* Use a clean admin dashboard layout.
* Use a sidebar for desktop navigation.
* Use responsive layout for mobile.
* Use tables for records.
* Use forms or modals for create/edit actions.
* Make totals clearly visible.
* Use Philippine peso formatting.
* Keep the interface simple and business-friendly.

---

## Supabase Guidelines

Create one Supabase client:

```txt
src/lib/supabase.ts
```

Do not create multiple Supabase clients.

All Supabase calls should be placed in service files, for example:

```txt
src/features/products/services/products-service.ts
src/features/sales/services/sales-service.ts
```

Avoid direct Supabase queries inside page components unless it is a very small temporary implementation.

---

## Sales Logic

When creating a sale:

1. Create a row in `sales`.
2. Create multiple rows in `sale_items`.
3. Each `sale_item.subtotal` should be:

```txt
quantity * unit_price
```

4. `sales.total_amount` should be the sum of all sale item subtotals.

---

## Purchases Logic

When creating a purchase:

1. Create a row in `purchases`.
2. Create multiple rows in `purchase_items`.
3. Each `purchase_item.subtotal` should be:

```txt
quantity * unit_cost
```

4. `purchases.total_amount` should be the sum of all purchase item subtotals.

---

## Dashboard Logic

Dashboard should show:

```txt
Sales Today
Purchases Today
Expenses Today
Net Profit Today
```

Formula:

```txt
Net Profit = Sales - Purchases - Expenses
```

---

## Documentation Requirements

Create or update these files:

```txt
README.md
DATABASE.md
FEATURES.md
SETUP.md
```

`README.md` should explain the app.

`DATABASE.md` should document tables, relationships, and business rules.

`FEATURES.md` should document each feature.

`SETUP.md` should document local setup and Supabase environment variables.

---

## Important Notes

Keep the first version simple.

Do not add inventory stock deduction, unit conversion, role-based access, analytics charts, or advanced accounting unless explicitly requested.

The goal of V1 is reliable record tracking for a vegetable business.
