CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS app_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL DEFAULT gen_random_uuid(),
  business_name VARCHAR(120) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'owner',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE app_user
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS signup_request (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name VARCHAR(120) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  approval_token TEXT UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ NULL,
  approved_by_email VARCHAR(120) NULL
);

CREATE TABLE IF NOT EXISTS product (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  sku VARCHAR(60) NOT NULL,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(80) NOT NULL,
  batch_no VARCHAR(60) NOT NULL,
  composition VARCHAR(80) DEFAULT '',
  mrp NUMERIC(12,2) NOT NULL CHECK (mrp > 0),
  sale_price NUMERIC(12,2) NOT NULL CHECK (sale_price > 0),
  stock_qty INT NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  reorder_level INT NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, sku)
);

CREATE TABLE IF NOT EXISTS customer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  name VARCHAR(120) NOT NULL,
  mobile VARCHAR(15) NOT NULL,
  village VARCHAR(120) NOT NULL,
  credit_due NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  bill_no BIGSERIAL UNIQUE,
  customer_id UUID NULL REFERENCES customer(id) ON DELETE SET NULL,
  payment_mode VARCHAR(20) NOT NULL,
  gross_total NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_total NUMERIC(12,2) NOT NULL,
  notes TEXT DEFAULT '',
  created_by VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sale(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
  qty INT NOT NULL CHECK (qty > 0),
  unit_price NUMERIC(12,2) NOT NULL,
  line_total NUMERIC(12,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_business ON product(business_id);
CREATE INDEX IF NOT EXISTS idx_customer_business ON customer(business_id);
CREATE INDEX IF NOT EXISTS idx_sale_business_date ON sale(business_id, created_at);
CREATE INDEX IF NOT EXISTS idx_signup_status ON signup_request(status);
