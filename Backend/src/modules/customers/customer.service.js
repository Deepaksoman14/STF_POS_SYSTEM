import { query } from "../../db/index.js";
import { ApiError } from "../../utils/ApiError.js";

export async function listCustomers(businessId) {
  const result = await query(
    `SELECT id, name, address, mobile, email, created_at
     FROM customer
     WHERE business_id = $1
     ORDER BY created_at DESC`,
    [businessId]
  );

  return result.rows;
}

export async function createCustomer(businessId, payload) {
  const result = await query(
    `INSERT INTO customer (business_id, name, address, mobile, email)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, address, mobile, email, created_at`,
    [businessId, payload.name, payload.address, payload.mobile, payload.email]
  );

  return result.rows[0];
}

export async function updateCustomer(businessId, customerId, payload) {
  const result = await query(
    `UPDATE customer
     SET name = $3,
         address = $4,
         mobile = $5,
         email = $6
     WHERE id = $1 AND business_id = $2
     RETURNING id, name, address, mobile, email, created_at`,
    [customerId, businessId, payload.name, payload.address, payload.mobile, payload.email]
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
