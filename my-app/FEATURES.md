# Features

## Authentication

Users sign in or create an account with Supabase email/password auth. App pages
are protected until a valid session is available, and the layout includes a
mobile-friendly signed-in account area with sign out.

## Dashboard

Shows today's sales, purchases, expenses, and net profit.

Net Profit = Sales - Purchases - Expenses

## Products

Create, edit, delete, and list product names.

## Product Prices

Create, edit, delete, and list suggested selling prices by product and unit.

## Suppliers

Create, edit, delete, and list supplier contact details.

## Expenses

Create, edit, delete, and list expenses by date, category, and amount.

## Purchases

Create purchases with multiple items. Each item subtotal is `quantity * unit_cost`; the purchase total is the sum of item subtotals.

## Sales

Create sales with multiple items. Each item subtotal is `quantity * unit_price`; the sale total is the sum of item subtotals.
