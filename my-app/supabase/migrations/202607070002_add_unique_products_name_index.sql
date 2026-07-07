create unique index if not exists products_normalized_name_unique
  on public.products (lower(regexp_replace(trim(name), '\s+', ' ', 'g')));

notify pgrst, 'reload schema';
