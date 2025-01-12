-- First, create the market
WITH market AS (
    INSERT INTO public.markets (title, description, closes_at, status)
    VALUES (
        'Will Trump win the 2024 Presidential Election?',
        'This market will resolve to YES if Donald Trump wins the 2024 US Presidential Election.',
        '2024-11-07 00:00:00+00',
        'open'
    ) 
    RETURNING id
),
-- Create the Yes outcome
yes_outcome AS (
    INSERT INTO public.outcomes (market_id, name, initial_price, current_price, is_winner)
    SELECT 
        id,
        'Yes',
        0.5,
        0.5,
        NULL
    FROM market
    RETURNING outcome_id, market_id
),
-- Create the No outcome
no_outcome AS (
    INSERT INTO public.outcomes (market_id, name, initial_price, current_price, is_winner)
    SELECT 
        id,
        'No',
        0.5,
        0.5,
        NULL
    FROM market
    RETURNING outcome_id, market_id
)
-- Create the option linking yes/no outcomes
INSERT INTO public.options (market_id, name, yes_outcome_id, no_outcome_id)
SELECT 
    yes_outcome.market_id,
    'Trump Wins',
    yes_outcome.outcome_id,
    no_outcome.outcome_id
FROM yes_outcome, no_outcome; 