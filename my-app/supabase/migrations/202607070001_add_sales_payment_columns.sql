alter table public.sales
  add column if not exists payment_status text not null default 'paid',
  add column if not exists payment_method text not null default 'cash';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sales_payment_status_check'
  ) then
    alter table public.sales
      add constraint sales_payment_status_check
      check (payment_status in ('paid', 'partial', 'unpaid'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'sales_payment_method_check'
  ) then
    alter table public.sales
      add constraint sales_payment_method_check
      check (payment_method in ('cash', 'gcash', 'bank_transfer', 'other'));
  end if;
end $$;

notify pgrst, 'reload schema';
