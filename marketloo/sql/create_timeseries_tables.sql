-- Create tables for time series data
CREATE TABLE IF NOT EXISTS public.recent_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    outcome_id UUID NOT NULL REFERENCES outcomes(outcome_id) ON DELETE CASCADE,
    price NUMERIC NOT NULL CHECK (price > 0),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.archived_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    outcome_id UUID NOT NULL REFERENCES outcomes(outcome_id) ON DELETE CASCADE,
    price NUMERIC NOT NULL CHECK (price > 0),
    timestamp TIMESTAMPTZ NOT NULL,
    interval_type TEXT NOT NULL CHECK (interval_type IN ('1h', '6h')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_recent_price_market_outcome 
ON public.recent_price_history (market_id, outcome_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_archived_price_market_outcome 
ON public.archived_price_history (market_id, outcome_id, timestamp DESC);

-- Create function to capture price snapshots (called every 5 minutes)
CREATE OR REPLACE FUNCTION capture_price_snapshot()
RETURNS void AS $$
BEGIN
    INSERT INTO recent_price_history (market_id, outcome_id, price)
    SELECT 
        market_id,
        outcome_id,
        current_price
    FROM outcomes
    WHERE current_price IS NOT NULL;

    -- Delete data older than 1 hour
    DELETE FROM recent_price_history
    WHERE timestamp < (now() - interval '1 hour');
END;
$$ LANGUAGE plpgsql;

-- Create function to archive hourly data (called every hour)
CREATE OR REPLACE FUNCTION archive_hourly_data()
RETURNS void AS $$
BEGIN
    -- Insert hourly snapshots
    INSERT INTO archived_price_history (market_id, outcome_id, price, timestamp, interval_type)
    SELECT 
        market_id,
        outcome_id,
        AVG(price), -- Use average price for the hour
        date_trunc('hour', timestamp),
        '1h'
    FROM recent_price_history
    WHERE timestamp >= (now() - interval '1 hour')
    GROUP BY market_id, outcome_id, date_trunc('hour', timestamp);

    -- Create 6-hour snapshots from hourly data older than 24 hours
    INSERT INTO archived_price_history (market_id, outcome_id, price, timestamp, interval_type)
    SELECT 
        market_id,
        outcome_id,
        AVG(price),
        date_trunc('hour', timestamp) + 
            interval '6 hours' * (extract(hour from timestamp)::integer / 6),
        '6h'
    FROM archived_price_history
    WHERE 
        interval_type = '1h'
        AND timestamp < (now() - interval '24 hours')
        AND timestamp >= (now() - interval '30 hours')
    GROUP BY 
        market_id, 
        outcome_id,
        date_trunc('hour', timestamp) + 
            interval '6 hours' * (extract(hour from timestamp)::integer / 6);

    -- Delete consolidated hourly data
    DELETE FROM archived_price_history
    WHERE 
        interval_type = '1h'
        AND timestamp < (now() - interval '24 hours');
END;
$$ LANGUAGE plpgsql;

-- Create function to clean up old data (called daily)
CREATE OR REPLACE FUNCTION cleanup_old_price_data()
RETURNS void AS $$
BEGIN
    -- Keep only last 30 days of 6-hour data
    DELETE FROM archived_price_history
    WHERE 
        interval_type = '6h'
        AND timestamp < (now() - interval '30 days');
END;
$$ LANGUAGE plpgsql; 