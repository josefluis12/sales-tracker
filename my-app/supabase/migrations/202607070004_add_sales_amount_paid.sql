alter table public.sales
  add column if not exists amount_paid numeric(12, 2) not null default 0;

update public.sales
set amount_paid = total_amount
where payment_status = 'paid'
  and amount_paid = 0;

update public.sales
set amount_paid = 0
where payment_status = 'unpaid';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sales_amount_paid_non_negative_check'
  ) then
    alter table public.sales
      add constraint sales_amount_paid_non_negative_check
      check (amount_paid >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'sales_amount_paid_not_over_total_check'
  ) then
    alter table public.sales
      add constraint sales_amount_paid_not_over_total_check
      check (amount_paid <= total_amount);
  end if;
end $$;

notify pgrst, 'reload schema';
