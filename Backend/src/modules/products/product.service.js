import { query } from "../../db/index.js";

export async function listProducts(businessId) {
  const result = await query(
    `SELECT id, sku, name, category, batch_no, composition, mrp, sale_price, stock_qty, reorder_level, created_at
     FROM product
     WHERE business_id = $1
     ORDER BY created_at DESC`,
    [businessId]
  );

  return result.rows;
}

export async function createProduct(businessId, payload) {
  const result = await query(
    `INSERT INTO product (business_id, sku, name, category, batch_no, composition, mrp, sale_price, stock_qty, reorder_level)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, sku, name, category, batch_no, composition, mrp, sale_price, stock_qty, reorder_level, created_at`,
    [
      businessId,
      payload.sku,
      payload.name,
      payload.category,
      payload.batchNo,
      payload.composition,
      payload.mrp,
      payload.salePrice,
      payload.stockQty,
      payload.reorderLevel
    ]
  );

  return result.rows[0];
}