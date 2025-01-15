-- Create table for recent high-resolution price data (5-minute intervals)
CREATE TABLE public.recent_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    outcome_id UUID NOT NULL REFERENCES outcomes(outcome_id) ON DELETE CASCADE,
    price NUMERIC NOT NULL CHECK (price >= 0 AND price <= 100),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Add indexes for efficient querying
    CONSTRAINT recent_price_valid_time CHECK (
        timestamp >= NOW() - INTERVAL '1 hour'
    )
);

-- Create table for archived price history (hourly and 6-hour intervals)
CREATE TABLE public.archived_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    market_id UUID NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
    outcome_id UUID NOT NULL REFERENCES outcomes(outcome_id) ON DELETE CASCADE,
    price NUMERIC NOT NULL CHECK (price >= 0 AND price <= 100),
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    interval_type TEXT NOT NULL CHECK (interval_type IN ('1h', '6h')),
    
    -- Add indexes for efficient querying
    CONSTRAINT archived_price_unique_timestamp UNIQUE (market_id, outcome_id, timestamp, interval_type)
);

-- Create indexes for better query performance
CREATE INDEX idx_recent_price_market_time ON public.recent_price_history(market_id, timestamp);
CREATE INDEX idx_recent_price_outcome_time ON public.recent_price_history(outcome_id, timestamp);
CREATE INDEX idx_archived_price_market_time ON public.archived_price_history(market_id, timestamp);
CREATE INDEX idx_archived_price_outcome_time ON public.archived_price_history(outcome_id, timestamp);

-- Create a function to clean up old data from recent_price_history
CREATE OR REPLACE FUNCTION cleanup_recent_price_history()
RETURNS void AS $$
BEGIN
    DELETE FROM recent_price_history
    WHERE timestamp < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql;

-- Create a function to archive hourly data
CREATE OR REPLACE FUNCTION archive_hourly_price_data()
RETURNS void AS $$
BEGIN
    -- Insert hourly snapshots into archived_price_history
    INSERT INTO archived_price_history (market_id, outcome_id, price, timestamp, interval_type)
    SELECT 
        market_id,
        outcome_id,
        AVG(price),  -- Take average price for the hour
        date_trunc('hour', timestamp),  -- Group by hour
        '1h'
    FROM recent_price_history
    WHERE timestamp < NOW() - INTERVAL '1 hour'
    GROUP BY 
        market_id,
        outcome_id,
        date_trunc('hour', timestamp)
    ON CONFLICT (market_id, outcome_id, timestamp, interval_type) DO UPDATE
    SET price = EXCLUDED.price;
END;
$$ LANGUAGE plpgsql;

-- Create a function to consolidate hourly data into 6-hour intervals
CREATE OR REPLACE FUNCTION consolidate_price_history()
RETURNS void AS $$
BEGIN
    -- Convert hourly data older than 24 hours into 6-hour intervals
    INSERT INTO archived_price_history (market_id, outcome_id, price, timestamp, interval_type)
    SELECT 
        market_id,
        outcome_id,
        AVG(price),
        date_trunc('hour', timestamp) + 
            INTERVAL '6 hours' * (EXTRACT(HOUR FROM timestamp)::INTEGER / 6),
        '6h'
    FROM archived_price_history
    WHERE 
        interval_type = '1h'
        AND timestamp < NOW() - INTERVAL '24 hours'
    GROUP BY 
        market_id,
        outcome_id,
        date_trunc('hour', timestamp) + 
            INTERVAL '6 hours' * (EXTRACT(HOUR FROM timestamp)::INTEGER / 6)
    ON CONFLICT (market_id, outcome_id, timestamp, interval_type) DO UPDATE
    SET price = EXCLUDED.price;

    -- Delete the old hourly data that we've consolidated
    DELETE FROM archived_price_history
    WHERE 
        interval_type = '1h'
        AND timestamp < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql; 