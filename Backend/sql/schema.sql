CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables (safe order for FK dependencies)
DROP TABLE IF EXISTS sale_item CASCADE;
DROP TABLE IF EXISTS sale CASCADE;
DROP TABLE IF EXISTS product CASCADE;
DROP TABLE IF EXISTS customer CASCADE;
DROP TABLE IF EXISTS signup_request CASCADE;
DROP TABLE IF EXISTS app_user CASCADE;

CREATE TABLE app_user (
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

CREATE TABLE signup_request (
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

CREATE TABLE product (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  sku VARCHAR(60) NOT NULL,
  name VARCHAR(150) NOT NULL,
  category VARCHAR(80) NOT NULL,
  batch_no VARCHAR(60) NOT NULL,
  composition VARCHAR(80) NOT NULL DEFAULT '',
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  sale_price NUMERIC(12,2) NOT NULL CHECK (sale_price > 0),
  stock_qty INT NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  reorder_level INT NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, sku)
);

CREATE TABLE customer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  name VARCHAR(120) NOT NULL,
  mobile VARCHAR(15) NOT NULL,
  village VARCHAR(120) NOT NULL,
  credit_due NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sale (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  bill_no BIGSERIAL UNIQUE,
  customer_id UUID NULL REFERENCES customer(id) ON DELETE SET NULL,
  payment_mode VARCHAR(20) NOT NULL,
  gross_total NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_total NUMERIC(12,2) NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_by VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sale_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sale(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
  qty INT NOT NULL CHECK (qty > 0),
  selling_price NUMERIC(12,2) NOT NULL,
  selling_price_total NUMERIC(12,2) NOT NULL,
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost_price_total NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_product_business ON product(business_id);
CREATE INDEX idx_customer_business ON customer(business_id);
CREATE INDEX idx_sale_business_date ON sale(business_id, created_at);
CREATE INDEX idx_signup_status ON signup_request(status);
