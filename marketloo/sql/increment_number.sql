create or replace function increment_number(
  row_id uuid,
  column_name text,
  increment_amount numeric
)
returns void
language plpgsql
as $$
begin
  execute format(
    'update users set %I = COALESCE(%I, 0) + $1 where id = $2',
    column_name,
    column_name
  )
  using increment_amount, row_id;
end;
$$; 