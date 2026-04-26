import pool from "../db/client.js";

export async function createPayment(
  bookingId,
  amount,
  currency,
  status,
  stripeChargeId,
  idempotencyKey,
) {
  const result = await pool.query(
    "INSERT INTO payments (booking_id, amount, currency, status, stripe_charge_id, idempotency_key) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
    [bookingId, amount, currency, status, stripeChargeId, idempotencyKey],
  );
  return result.rows[0];
}

export async function getPaymentById(id) {
  const result = await pool.query("SELECT * FROM payments WHERE id = $1", [id]);
  return result.rows[0];
}

export async function getPaymentByIdempotencyKey(idempotencyKey) {
  const result = await pool.query(
    "SELECT * FROM payments WHERE idempotency_key = $1",
    [idempotencyKey],
  );
  return result.rows[0];
}

export async function getPaymentsByBookingId(bookingId) {
  const result = await pool.query(
    "SELECT * FROM payments WHERE booking_id = $1 ORDER BY created_at DESC",
    [bookingId],
  );
  return result.rows;
}

export async function updatePayment(id, updates) {
  const fields = Object.keys(updates);
  const values = Object.values(updates);

  if (fields.length === 0) return null;

  const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(", ");

  const result = await pool.query(
    `UPDATE payments SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, id],
  );
  return result.rows[0];
}

export async function deletePayment(id) {
  const result = await pool.query(
    "DELETE FROM payments WHERE id = $1 RETURNING id",
    [id],
  );
  return result.rows.length > 0;
}
