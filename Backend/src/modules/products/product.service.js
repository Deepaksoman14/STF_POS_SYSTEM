import { query } from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";

const productSelect = "id, sku, name, category, batch_no, composition, cost_price, sale_price, stock_qty, reorder_level, created_at";

export async function listProducts(businessId) {
  const result = await query(
    `SELECT ${productSelect}
     FROM product
     WHERE business_id = $1 AND is_active = true
     ORDER BY created_at DESC`,
    [businessId]
  );

  return result.rows;
}

export async function listArchivedProducts(businessId) {
  const result = await query(
    `SELECT ${productSelect}
     FROM product
     WHERE business_id = $1 AND is_active = false
     ORDER BY created_at DESC`,
    [businessId]
  );

  return result.rows;
}

export async function createProduct(businessId, payload) {
  const result = await query(
    `INSERT INTO product (business_id, sku, name, category, batch_no, composition, cost_price, sale_price, stock_qty, reorder_level, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
     RETURNING ${productSelect}`,
    [
      businessId,
      payload.sku,
      payload.name,
      payload.category,
      payload.batchNo,
      payload.composition,
      payload.costPrice,
      payload.salePrice,
      payload.stockQty,
      payload.reorderLevel
    ]
  );

  return result.rows[0];
}

export async function updateProduct(businessId, productId, payload) {
  const result = await query(
    `UPDATE product
     SET sku = $3,
         name = $4,
         category = $5,
         batch_no = $6,
         composition = $7,
         cost_price = $8,
         sale_price = $9,
         stock_qty = $10,
         reorder_level = $11
     WHERE id = $1 AND business_id = $2 AND is_active = true
     RETURNING ${productSelect}`,
    [
      productId,
      businessId,
      payload.sku,
      payload.name,
      payload.category,
      payload.batchNo,
      payload.composition,
      payload.costPrice,
      payload.salePrice,
      payload.stockQty,
      payload.reorderLevel
    ]
  );

  if (result.rowCount === 0) {
    throw new ApiError(404, "Product not found");
  }

  return result.rows[0];
}

export async function deleteProduct(businessId, productId) {
  const result = await query(
    `UPDATE product
     SET is_active = false
     WHERE id = $1 AND business_id = $2 AND is_active = true
     RETURNING id`,
    [productId, businessId]
  );

  if (result.rowCount === 0) {
    throw new ApiError(404, "Product not found");
  }

  return { id: productId, archived: true };
}

export async function restoreProduct(businessId, productId) {
  try {
    const result = await query(
      `UPDATE product
       SET is_active = true
       WHERE id = $1 AND business_id = $2 AND is_active = false
       RETURNING ${productSelect}`,
      [productId, businessId]
    );

    if (result.rowCount === 0) {
      throw new ApiError(404, "Archived product not found");
    }

    return result.rows[0];
  } catch (error) {
    if (error?.code === "23505") {
      throw new ApiError(409, "Cannot restore product due to duplicate SKU");
    }
    throw error;
  }
}
