# Features

## Authentication

Users sign in with Supabase email/password auth. This is a private app, so
account creation is handled outside the public UI. App pages are protected until
a valid session is available, and the layout includes a mobile-friendly
signed-in account area with sign out.

## Dashboard

Shows today's sales, purchases, expenses, and net profit, plus all-time investment,
recovered sales, expenses, and profit totals. The dashboard also lists daily
records for investment, total daily expense, recovered sales, and profit.

Profit = Recovered Sales - Investment - Expenses

## Products

Create, edit, delete, and list product names.

## Product Prices

Create, edit, delete, and list one suggested selling price per product for sale entry.

## Suppliers

Create, edit, delete, and list supplier contact details.

## Expenses

Create, edit, delete, and list expenses by date, category, and amount.

## Purchases

Create purchases with multiple items. Each item subtotal is `quantity * unit_cost`; the purchase total is the sum of item subtotals.

## Sales

Create sales with multiple items. Each item subtotal is `quantity * unit_price`; the sale total is the sum of item subtotals.

## Sales Report

View sales grouped by day with daily totals, record counts, and paid, partial,
and unpaid amount summaries. Selecting a day shows the item-level products sold,
quantities, units, unit prices, subtotals, and sale details for that date.
