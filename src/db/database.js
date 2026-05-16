import dotenv from "dotenv";

dotenv.config();

const databaseConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5434", 10),
  user: process.env.DB_USER || "rental",
  password: process.env.DB_PASSWORD || "pwd",
  database: process.env.DB_NAME || "rental_db",
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export default databaseConfig;
