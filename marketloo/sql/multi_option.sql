-- First, create the market
INSERT INTO markets (title, description, closes_at, status)
VALUES (
  'Who will win Super Bowl LVIII?',
  'Predict which team will win the 2024 Super Bowl. Only one team can win.',
  '2024-02-11 23:30:00+00',
  'open'
)
RETURNING id;

-- Then create the outcomes for each team
WITH market_id AS (
  SELECT id FROM markets 
  WHERE title = 'Who will win Super Bowl LVIII?'
)
INSERT INTO outcomes (market_id, name, option, initial_price, current_price)
SELECT 
  market_id.id,
  name,
  team,
  CASE 
    WHEN name = 'Yes' THEN 0.33
    ELSE 0.67
  END as initial_price,
  CASE 
    WHEN name = 'Yes' THEN 0.33
    ELSE 0.67
  END as current_price
FROM market_id
CROSS JOIN (
  VALUES 
    ('Chiefs'),
    ('Ravens'),
    ('Lions')
) as teams(team)
CROSS JOIN (
  VALUES ('Yes'), ('No')
) as outcomes(name);