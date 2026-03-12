import { pool } from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";

export async function createSale(businessId, payload) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let grossTotal = 0;

    for (const line of payload.items) {
      const productRes = await client.query(
        "SELECT id, sale_price, stock_qty, cost_price FROM product WHERE id = $1 AND business_id = $2 FOR UPDATE",
        [line.productId, businessId]
      );

      if (productRes.rowCount === 0) {
        throw new ApiError(404, `Product not found: ${line.productId}`);
      }

      const product = productRes.rows[0];
      if (product.stock_qty < line.qty) {
        throw new ApiError(400, `Insufficient stock for product: ${line.productId}`);
      }

      grossTotal += Number(product.sale_price) * line.qty;
    }

    const saleRes = await client.query(
      `INSERT INTO sale (business_id, customer_id, payment_mode, gross_total, discount, net_total, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, bill_no, created_at, net_total`,
      [
        businessId,
        payload.customerId,
        payload.paymentMode,
        grossTotal,
        payload.discount,
        grossTotal - payload.discount,
        payload.notes,
        payload.createdBy
      ]
    );

    const sale = saleRes.rows[0];

    for (const line of payload.items) {
      const productRes = await client.query(
        "SELECT sale_price, stock_qty, cost_price FROM product WHERE id = $1 AND business_id = $2 FOR UPDATE",
        [line.productId, businessId]
      );
      const product = productRes.rows[0];
      const sellingPrice = Number(product.sale_price);
      const costPrice = Number(product.cost_price || 0);

      await client.query(
        `INSERT INTO sale_item (sale_id, product_id, qty, selling_price, selling_price_total, cost_price, cost_price_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [sale.id, line.productId, line.qty, sellingPrice, sellingPrice * line.qty, costPrice, costPrice * line.qty]
      );

      await client.query(
        "UPDATE product SET stock_qty = stock_qty - $1 WHERE id = $2",
        [line.qty, line.productId]
      );
    }

    await client.query("COMMIT");

    return sale;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function listSales(businessId) {
  const result = await pool.query(
    `SELECT s.id, s.bill_no, s.payment_mode, s.net_total, s.created_at,
            c.name AS customer_name
     FROM sale s
     LEFT JOIN customer c ON c.id = s.customer_id
     WHERE s.business_id = $1
     ORDER BY s.created_at DESC
     LIMIT 100`,
    [businessId]
  );

  return result.rows;
}
