import { query } from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";

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

export async function updateCustomer(businessId, customerId, payload) {
  const result = await query(
    `UPDATE customer
     SET name = $3,
         mobile = $4,
         village = $5,
         credit_due = $6
     WHERE id = $1 AND business_id = $2
     RETURNING id, name, mobile, village, credit_due, created_at`,
    [customerId, businessId, payload.name, payload.mobile, payload.village, payload.creditDue]
  );

  if (result.rowCount === 0) {
    throw new ApiError(404, "Customer not found");
  }

  return result.rows[0];
}

export async function deleteCustomer(businessId, customerId) {
  const result = await query(
    `DELETE FROM customer
     WHERE id = $1 AND business_id = $2
     RETURNING id`,
    [customerId, businessId]
  );

  if (result.rowCount === 0) {
    throw new ApiError(404, "Customer not found");
  }

  return { id: customerId };
}
