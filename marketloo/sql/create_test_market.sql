-- Create a test market
WITH new_market AS (
  INSERT INTO markets (title, description, closes_at, status)
  VALUES (
    'Test Market',
    'This is a test market for price history',
    NOW() + INTERVAL '7 days',
    'open'
  )
  RETURNING id
)
-- Create two outcomes for the market
INSERT INTO outcomes (market_id, name, current_price)
SELECT 
  new_market.id,
  name,
  initial_price
FROM 
  new_market,
  (VALUES 
    ('Yes', 50),
    ('No', 50)
  ) AS outcomes(name, initial_price); 