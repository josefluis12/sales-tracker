do $$
declare
  constraint_record record;
  index_record record;
begin
  for constraint_record in
    select constraint_name
    from (
      select
        con.conname as constraint_name,
        array_agg(att.attname order by cols.ordinality) as column_names
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace nsp on nsp.oid = rel.relnamespace
      join unnest(con.conkey) with ordinality as cols(attnum, ordinality) on true
      join pg_attribute att on att.attrelid = rel.oid and att.attnum = cols.attnum
      where nsp.nspname = 'public'
        and rel.relname = 'product_prices'
        and con.contype = 'u'
      group by con.conname
    ) unique_constraints
    where column_names = array['product_id']::name[]
  loop
    execute format(
      'alter table public.product_prices drop constraint if exists %I',
      constraint_record.constraint_name
    );
  end loop;

  for index_record in
    select indexname
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'product_prices'
      and indexdef ilike 'create unique index%'
      and indexdef ilike '%(product_id)%'
  loop
    execute format('drop index if exists public.%I', index_record.indexname);
  end loop;
end $$;

drop index if exists public.product_prices_product_id_key;
drop index if exists public.product_prices_product_id_unique;

create unique index if not exists product_prices_product_unit_unique
  on public.product_prices (product_id, unit);

notify pgrst, 'reload schema';
