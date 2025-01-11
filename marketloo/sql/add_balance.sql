create or replace function add_to_balance(user_id uuid, amount float8)
returns void as $$
begin
  update users
  set balance_of_poo = balance_of_poo + amount
  where id = user_id;
end;
$$ language plpgsql;