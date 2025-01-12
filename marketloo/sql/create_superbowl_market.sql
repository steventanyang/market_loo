-- First, create the market
WITH market AS (
    INSERT INTO public.markets (title, description, closes_at, status)
    VALUES (
        'Who will win Super Bowl LVIII?',
        'This market will resolve when a team wins Super Bowl LVIII (58) in February 2024.',
        '2024-02-11 23:30:00+00',
        'open'
    ) 
    RETURNING id
),
-- Create outcomes for Ravens
ravens_yes AS (
    INSERT INTO public.outcomes (market_id, name, initial_price, current_price, is_winner)
    SELECT id, 'Yes', 0.35, 0.35, NULL FROM market
    RETURNING outcome_id, market_id
),
ravens_no AS (
    INSERT INTO public.outcomes (market_id, name, initial_price, current_price, is_winner)
    SELECT id, 'No', 0.65, 0.65, NULL FROM market
    RETURNING outcome_id, market_id
),
-- Create outcomes for Chiefs
chiefs_yes AS (
    INSERT INTO public.outcomes (market_id, name, initial_price, current_price, is_winner)
    SELECT id, 'Yes', 0.33, 0.33, NULL FROM market
    RETURNING outcome_id, market_id
),
chiefs_no AS (
    INSERT INTO public.outcomes (market_id, name, initial_price, current_price, is_winner)
    SELECT id, 'No', 0.67, 0.67, NULL FROM market
    RETURNING outcome_id, market_id
),
-- Create outcomes for Lions
lions_yes AS (
    INSERT INTO public.outcomes (market_id, name, initial_price, current_price, is_winner)
    SELECT id, 'Yes', 0.32, 0.32, NULL FROM market
    RETURNING outcome_id, market_id
),
lions_no AS (
    INSERT INTO public.outcomes (market_id, name, initial_price, current_price, is_winner)
    SELECT id, 'No', 0.68, 0.68, NULL FROM market
    RETURNING outcome_id, market_id
),
-- Create the Ravens option
ravens_option AS (
    INSERT INTO public.options (market_id, name, yes_outcome_id, no_outcome_id)
    SELECT 
        ravens_yes.market_id,
        'Ravens Win',
        ravens_yes.outcome_id,
        ravens_no.outcome_id
    FROM ravens_yes, ravens_no
),
-- Create the Chiefs option
chiefs_option AS (
    INSERT INTO public.options (market_id, name, yes_outcome_id, no_outcome_id)
    SELECT 
        chiefs_yes.market_id,
        'Chiefs Win',
        chiefs_yes.outcome_id,
        chiefs_no.outcome_id
    FROM chiefs_yes, chiefs_no
)
-- Create the Lions option
INSERT INTO public.options (market_id, name, yes_outcome_id, no_outcome_id)
SELECT 
    lions_yes.market_id,
    'Lions Win',
    lions_yes.outcome_id,
    lions_no.outcome_id
FROM lions_yes, lions_no; 