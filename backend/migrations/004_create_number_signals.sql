CREATE TABLE IF NOT EXISTS number_signals (
    id BIGSERIAL PRIMARY KEY,
    verified_number_id BIGINT NOT NULL UNIQUE REFERENCES verified_numbers(id) ON DELETE CASCADE,
    spam_reports INTEGER NOT NULL DEFAULT 0,
    lookup_count INTEGER NOT NULL DEFAULT 0,
    last_seen_at TIMESTAMPTZ NULL,
    trust_score INTEGER NOT NULL DEFAULT 100,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);