INSERT INTO public.users (id, username, email, balance_of_poo)
SELECT 
  au.id,
  SPLIT_PART(au.email, '@', 1) as username, -- Takes everything before the @ symbol
  au.email,
  10000 as balance_of_poo
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL; 