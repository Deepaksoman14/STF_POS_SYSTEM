import { query } from "../../db/index.js";
import env from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";

const ALLOWED_ROLES = ["admin", "owner", "viewer"];

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export async function listUsers() {
  const result = await query(
    `SELECT id, business_name, business_profile_id, business_id, full_name, email, role, is_active, created_at
     FROM app_user
     ORDER BY created_at DESC`
  );

  return result.rows;
}

export async function listBusinesses() {
  const result = await query(
    `SELECT business_id, business_name, business_profile_id, MIN(created_at) AS created_at
     FROM app_user
     GROUP BY business_id, business_name, business_profile_id
     ORDER BY business_name`
  );

  return result.rows;
}

export async function updateUserAccess(userId, payload, actor) {
  const { role, isActive } = payload;

  if (role && !ALLOWED_ROLES.includes(role)) {
    throw new ApiError(400, "Invalid role");
  }

  const targetResult = await query(
    `SELECT id, email, role, is_active
     FROM app_user
     WHERE id = $1`,
    [userId]
  );

  if (targetResult.rowCount === 0) {
    throw new ApiError(404, "User not found");
  }

  const target = targetResult.rows[0];
  const targetEmail = normalizeEmail(target.email);
  const adminEmail = normalizeEmail(env.ADMIN_EMAIL);

  if (targetEmail === adminEmail) {
    if (role && role !== "admin") {
      throw new ApiError(400, "Configured admin account role cannot be changed");
    }

    if (isActive === false) {
      throw new ApiError(400, "Configured admin account cannot be disabled");
    }
  }

  if (actor?.userId === userId && isActive === false) {
    throw new ApiError(400, "You cannot disable your own account");
  }

  const nextRole = role || target.role;
  const nextIsActive = typeof isActive === "boolean" ? isActive : target.is_active;

  const updateResult = await query(
    `UPDATE app_user
     SET role = $2, is_active = $3
     WHERE id = $1
     RETURNING id, business_name, business_profile_id, business_id, full_name, email, role, is_active, created_at`,
    [userId, nextRole, nextIsActive]
  );

  return updateResult.rows[0];
}
