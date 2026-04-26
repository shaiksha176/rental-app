import pool from "../db/client.js";

export async function createUser(email, username, password, role) {
  const result = await pool.query(
    "INSERT INTO users (email, username, password, role) VALUES ($1, $2, $3, $4) RETURNING *",
    [email, username, password, role],
  );
  return result.rows[0];
}

export async function getUserById(id) {
  const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return result.rows[0];
}

export async function getUserByEmail(email) {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return result.rows[0];
}

export async function updateUser(id, updates) {
  const fields = Object.keys(updates);
  const values = Object.values(updates);

  if (fields.length === 0) return null;

  const setClause = fields.map((field, i) => `${field} = $${i + 1}`).join(", ");

  const result = await pool.query(
    `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${fields.length + 1} RETURNING *`,
    [...values, id],
  );
  return result.rows[0];
}

export async function deleteUser(id) {
  const result = await pool.query(
    "DELETE FROM users WHERE id = $1 RETURNING id",
    [id],
  );
  return result.rows.length > 0;
}

export async function getAllUsers(limit = 20, offset = 0) {
  const result = await pool.query(
    "SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2",
    [limit, offset],
  );
  return result.rows;
}
