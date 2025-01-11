-- Start a transaction
begin;

-- Delete positions for user
delete from positions where user_id = 'your-user-id-here';

-- Delete trades where user is buyer or seller
delete from trades 
where buyer_order_id in (select id from orders where user_id = 'your-user-id-here')
or seller_order_id in (select id from orders where user_id = 'your-user-id-here');

-- Delete orders for user
delete from orders where user_id = 'your-user-id-here';

-- Reset balance to 10000
update users 
set balance_of_poo = 10000 
where id = 'your-user-id-here';

-- Commit the transaction
commit;