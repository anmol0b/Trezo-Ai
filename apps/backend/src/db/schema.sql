-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── Invoices table ──────────────────────────────────────────────────────────
-- Stores every parsed invoice with its embedding for RAG similarity search
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_pda    TEXT,                          -- onchain proposal pubkey (null until confirmed)
  vendor          TEXT NOT NULL,
  amount          NUMERIC(18, 6) NOT NULL,
  currency        CHAR(3) NOT NULL DEFAULT 'USD',
  amount_usdc     NUMERIC(18, 6) NOT NULL,
  due_date        DATE,
  category        TEXT NOT NULL,
  description     TEXT,
  invoice_number  TEXT,
  metadata_uri    TEXT,                          -- IPFS URI of full invoice JSON
  confidence      NUMERIC(3, 2),                 -- AI parse confidence 0-1
  flags           TEXT[] DEFAULT '{}',           -- anomaly flags from RAG
  embedding       vector(128),                   -- pgvector embedding for similarity search
  company_id      TEXT NOT NULL DEFAULT 'trezo-demo',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Audit events cache ───────────────────────────────────────────────────────
-- Caches onchain audit events from Helius WebSocket indexer
CREATE TABLE IF NOT EXISTS audit_events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signature           TEXT UNIQUE NOT NULL,
  event_type          TEXT NOT NULL,             -- StealthPayment, PayoutExecuted, etc.
  ephemeral_pubkey    TEXT,
  encrypted_note      TEXT,
  amount              NUMERIC(18, 6),
  slot                BIGINT,
  company_id          TEXT NOT NULL DEFAULT 'trezo-demo',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Vendor history ───────────────────────────────────────────────────────────
-- Aggregated vendor stats for RAG anomaly detection
CREATE TABLE IF NOT EXISTS vendor_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor          TEXT NOT NULL,
  company_id      TEXT NOT NULL DEFAULT 'trezo-demo',
  invoice_count   INT NOT NULL DEFAULT 0,
  total_amount    NUMERIC(18, 6) NOT NULL DEFAULT 0,
  average_amount  NUMERIC(18, 6) NOT NULL DEFAULT 0,
  last_seen_at    TIMESTAMPTZ,
  categories      TEXT[] DEFAULT '{}',
  UNIQUE(vendor, company_id)
);

-- ─── Fiat conversions log ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fiat_conversions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dodo_id           TEXT UNIQUE,
  onchain_signature TEXT,
  amount_usdc       NUMERIC(18, 6) NOT NULL,
  target_currency   CHAR(3) NOT NULL,
  target_amount     NUMERIC(18, 6),
  exchange_rate     NUMERIC(10, 6),
  status            TEXT NOT NULL DEFAULT 'pending',
  company_id        TEXT NOT NULL DEFAULT 'trezo-demo',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_invoices_vendor
  ON invoices(vendor, company_id);

CREATE INDEX IF NOT EXISTS idx_invoices_category
  ON invoices(category);

CREATE INDEX IF NOT EXISTS idx_invoices_embedding
  ON invoices USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

CREATE INDEX IF NOT EXISTS idx_audit_events_company
  ON audit_events(company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vendor_history_company
  ON vendor_history(company_id, vendor);

-- ─── Auto-update updated_at ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();