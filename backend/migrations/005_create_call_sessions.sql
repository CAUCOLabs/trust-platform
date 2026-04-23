CREATE TABLE IF NOT EXISTS call_sessions (
    id BIGSERIAL PRIMARY KEY,
    phone_number TEXT NOT NULL,
    company_id BIGINT NULL REFERENCES companies(id) ON DELETE SET NULL,
    verified_number_id BIGINT NULL REFERENCES verified_numbers(id) ON DELETE SET NULL,
    call_reason_id BIGINT NULL REFERENCES call_reasons(id) ON DELETE SET NULL,
    risk_level TEXT NOT NULL DEFAULT 'medium',
    trust_score INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
