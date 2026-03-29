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
  business_profile_id VARCHAR(40) NOT NULL DEFAULT 'fertilizer',
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(120) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(30) NOT NULL DEFAULT 'owner',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE print_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key VARCHAR(60) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description VARCHAR(240) NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE business_setting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL UNIQUE,
  print_template_key VARCHAR(60) NOT NULL DEFAULT 'classic_invoice',
  bill_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE signup_request (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name VARCHAR(120) NOT NULL,
  business_profile_id VARCHAR(40) NOT NULL DEFAULT 'fertilizer',
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
  name VARCHAR(150) NOT NULL,
  category VARCHAR(80) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_variant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  business_id UUID NOT NULL,
  sku VARCHAR(60) NOT NULL,
  unit_type VARCHAR(12) NOT NULL DEFAULT 'pcs',
  unit_size NUMERIC(12,2) NOT NULL DEFAULT 1,
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (cost_price >= 0),
  sale_price NUMERIC(12,2) NOT NULL CHECK (sale_price > 0),
  stock_qty INT NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  reorder_level INT NOT NULL DEFAULT 0 CHECK (reorder_level >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, sku)
);

CREATE TABLE inventory_location (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  code VARCHAR(40) NOT NULL,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (business_id, code)
);

CREATE TABLE inventory_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  variant_id UUID NOT NULL REFERENCES product_variant(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES inventory_location(id) ON DELETE CASCADE,
  qty INT NOT NULL DEFAULT 0 CHECK (qty >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (variant_id, location_id)
);

CREATE TABLE customer (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  name VARCHAR(120) NOT NULL,
  address VARCHAR(200) NOT NULL DEFAULT '',
  mobile VARCHAR(20) NOT NULL DEFAULT '',
  email VARCHAR(120) NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sale (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  bill_no BIGSERIAL UNIQUE,
  order_type VARCHAR(20) NOT NULL DEFAULT 'retail',
  customer_id UUID NULL REFERENCES customer(id) ON DELETE SET NULL,
  payment_mode VARCHAR(20) NOT NULL,
  gross_total NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_total NUMERIC(12,2) NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  wholesale_tin_no VARCHAR(120) NOT NULL DEFAULT '',
  wholesale_fl_pl_sl_no VARCHAR(120) NOT NULL DEFAULT '',
  source_location_code VARCHAR(40) NOT NULL DEFAULT 'main_store',
  created_by VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sale_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sale(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
  product_variant_id UUID NOT NULL REFERENCES product_variant(id) ON DELETE RESTRICT,
  qty INT NOT NULL CHECK (qty > 0),
  selling_price NUMERIC(12,2) NOT NULL,
  selling_price_total NUMERIC(12,2) NOT NULL,
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost_price_total NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE purchase_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  purchase_no BIGSERIAL UNIQUE,
  supplier_name VARCHAR(120) NOT NULL DEFAULT '',
  payment_mode VARCHAR(20) NOT NULL,
  gross_total NUMERIC(12,2) NOT NULL,
  discount NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_total NUMERIC(12,2) NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  receive_location_code VARCHAR(40) NOT NULL DEFAULT 'godown',
  created_by VARCHAR(120) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE purchase_order_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES purchase_order(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
  product_variant_id UUID NOT NULL REFERENCES product_variant(id) ON DELETE RESTRICT,
  qty INT NOT NULL CHECK (qty > 0),
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost_price_total NUMERIC(12,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_product_business ON product(business_id);
CREATE INDEX idx_variant_business ON product_variant(business_id);
CREATE INDEX idx_inventory_stock_variant ON inventory_stock(variant_id);
CREATE INDEX idx_inventory_location_business ON inventory_location(business_id);
CREATE INDEX idx_customer_business ON customer(business_id);
CREATE INDEX idx_sale_business_date ON sale(business_id, created_at);
CREATE INDEX idx_purchase_order_business_date ON purchase_order(business_id, created_at);
CREATE INDEX idx_signup_status ON signup_request(status);
CREATE INDEX idx_business_setting_business ON business_setting(business_id);

