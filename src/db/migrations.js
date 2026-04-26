import fs from "fs";
import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function runMigrations() {
  try {
    console.log("Starting database migrations...");

    const schema = fs.readFileSync("./src/db/schema.sql", "utf-8");
    await pool.query(schema);

    console.log("✓ Database migrations completed successfully");
    console.log("✓ Tables created: users, listings, bookings, payments");
    console.log("✓ Foreign key constraints applied");

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error("✗ Migration failed:", error.message);
    await pool.end();
    process.exit(1);
  }
}

runMigrations();
