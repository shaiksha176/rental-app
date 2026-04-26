import pool from "../db/client.js";

export async function createBooking(
  listingId,
  guestId,
  checkIn,
  checkOut,
  totalPrice,
) {
  const result = await pool.query(
    "INSERT INTO bookings (listing_id, guest_id, check_in, check_out, total_price) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [listingId, guestId, checkIn, checkOut, totalPrice],
  );
  return result.rows[0];
}

export async function getBookingById(id) {
  const result = await pool.query("SELECT * FROM bookings WHERE id = $1", [id]);
  return result.rows[0];
}

export async function getBookingsByListingId(
  listingId,
  limit = 20,
  offset = 0,
) {
  const result = await pool.query(
    "SELECT * FROM bookings WHERE listing_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
    [listingId, limit, offset],
  );
  return result.rows;
}

export async function getBookingsByGuestId(guestId, limit = 20, offset = 0) {
  const result = await pool.query(
    "SELECT * FROM bookings WHERE guest_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
    [guestId, limit, offset],
  );
  return result.rows;
}

export async function updateBooking(id, updates) {
  const fields = Object.keys(updates);
  const values = Object.values(updates);

  if (fields.length === 0) return null;

  const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(", ");

  const result = await pool.query(
    `UPDATE bookings SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, id],
  );
  return result.rows[0];
}

export async function deleteBooking(id) {
  const result = await pool.query(
    "DELETE FROM bookings WHERE id = $1 RETURNING id",
    [id],
  );
  return result.rows.length > 0;
}
