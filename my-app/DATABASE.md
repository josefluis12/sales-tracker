# Database

The app expects these Supabase tables:

- `products`
- `product_prices`
- `suppliers`
- `purchases`
- `purchase_items`
- `sales`
- `sale_items`
- `expenses`

## Relationships

- `product_prices.product_id` references `products.id`.
- `purchase_items.purchase_id` references `purchases.id`.
- `purchase_items.product_id` references `products.id`.
- `purchases.supplier_id` references `suppliers.id`.
- `sale_items.sale_id` references `sales.id`.
- `sale_items.product_id` references `products.id`.

## Business Rules

- `products` stores item names only.
- `product_prices` stores suggested selling prices per product and unit for sale entry.
- `sale_items.unit_price` stores the actual price charged during the sale.
- `purchase_items.unit_cost` stores the actual buying cost.
- Product prices may change, but old sale records keep their original unit price.
- `sales.amount_paid` stores collected payment; unpaid balance is `total_amount - amount_paid`.
- `product_prices.product_id` and `unit` should be unique together so each product has one current suggested price per unit.
- Purchases and sales may use different units.
- V1 does not perform unit conversion or inventory deduction.

## Authentication and Access

The app uses Supabase Auth email/password accounts. Business tables should be
protected with Row Level Security policies that allow authenticated users to
read and write the records they are allowed to manage.

For a simple single-business V1, a basic authenticated policy per table can be
used while role-based access remains out of scope.

## Required Columns

All tables should have `id` and `created_at`.

Core record columns:

- `products`: `name`
- `product_prices`: `product_id`, `unit`, `selling_price`, `is_active`, `updated_at`
- `suppliers`: `name`, `contact_number`, `contact_person`, `address`, `is_active`, `updated_at`
- `expenses`: `expense_date`, `category`, `amount`, `updated_at`
- `purchases`: `supplier_id`, `purchase_date`, `total_amount`, `payment_status`, `payment_method`, `updated_at`
- `purchase_items`: `purchase_id`, `product_id`, `quantity`, `unit`, `unit_cost`, `subtotal`
- `sales`: `sale_date`, `customer_name`, `total_amount`, `amount_paid`, `payment_status`, `payment_method`, `notes`
- `sale_items`: `sale_id`, `product_id`, `quantity`, `unit`, `unit_price`, `subtotal`
