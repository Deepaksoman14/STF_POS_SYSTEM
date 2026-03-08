import { query } from "../../db/index.js";

export async function listCustomers(businessId) {
  const result = await query(
    `SELECT id, name, mobile, village, credit_due, created_at
     FROM customer
     WHERE business_id = $1
     ORDER BY created_at DESC`,
    [businessId]
  );

  return result.rows;
}

export async function createCustomer(businessId, payload) {
  const result = await query(
    `INSERT INTO customer (business_id, name, mobile, village, credit_due)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, mobile, village, credit_due, created_at`,
    [businessId, payload.name, payload.mobile, payload.village, payload.creditDue]
  );

  return result.rows[0];
}