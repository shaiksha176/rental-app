import pool from "../db/client.js";

export async function createListing(
  hostId,
  title,
  description,
  pricePerNight,
  location,
  images,
  accommodation,
  offerings,
) {
  const result = await pool.query(
    "INSERT INTO listings (host_id, title, description, price_per_night, location, images, accommodation, offerings) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *",
    [
      hostId,
      title,
      description,
      pricePerNight,
      location,
      images,
      accommodation,
      offerings,
    ],
  );
  return result.rows[0];
}

export async function getListingById(id) {
  const result = await pool.query("SELECT * FROM listings WHERE id = $1", [id]);
  return result.rows[0];
}

export async function getListingsByHostId(hostId, limit = 20, offset = 0) {
  const result = await pool.query(
    "SELECT * FROM listings WHERE host_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
    [hostId, limit, offset],
  );
  return result.rows;
}

export async function getAllListings(limit = 20, offset = 0) {
  const result = await pool.query(
    "SELECT * FROM listings ORDER BY created_at DESC LIMIT $1 OFFSET $2",
    [limit, offset],
  );
  return result.rows;
}

export async function updateListing(id, updates) {
  const fields = Object.keys(updates);
  const values = Object.values(updates);

  if (fields.length === 0) return null;

  const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(", ");

  const result = await pool.query(
    `UPDATE listings SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, id],
  );
  return result.rows[0];
}

export async function deleteListing(id) {
  const result = await pool.query(
    "DELETE FROM listings WHERE id = $1 RETURNING id",
    [id],
  );
  return result.rows.length > 0;
}
