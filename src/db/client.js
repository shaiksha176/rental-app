import { Pool } from "pg";
import databaseConfig from "./database.js";

const pool = new Pool(databaseConfig);

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
});

export default pool;
