CREATE TABLE IF NOT EXISTS portal_accounts (
    id BIGSERIAL PRIMARY KEY,
    account_type TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    company_id BIGINT REFERENCES companies(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT portal_accounts_account_type_check CHECK (account_type IN ('personal', 'business'))
);

CREATE TABLE IF NOT EXISTS portal_sessions (
    token TEXT PRIMARY KEY,
    account_id BIGINT NOT NULL REFERENCES portal_accounts(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_portal_sessions_account_id ON portal_sessions(account_id);
CREATE INDEX IF NOT EXISTS idx_portal_sessions_expires_at ON portal_sessions(expires_at);
