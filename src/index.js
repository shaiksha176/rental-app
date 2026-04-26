import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db/client.js";
import { requestLogger } from "./middleware/logger.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import userRoutes from "./routes/users.js";
import listingRoutes from "./routes/listings.js";
import bookingRoutes from "./routes/bookings.js";
import paymentRoutes from "./routes/payments.js";
import redisClient from "./db/redis.js";


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(requestLogger);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/listings", listingRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/payments", paymentRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

// Graceful shutdown
async function shutdown() {
  console.log("Shutting down gracefully...");

  server.close(async () => {
    console.log("Server closed");
    await pool.end();
    console.log("Database connections closed");
    await redisClient.quit();
    console.log("Redis connection closed");
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Start server
let server;

async function start() {
  try {
    // Test database connection
    await pool.query("SELECT 1");
    console.log("✓ Connected to PostgreSQL");

    // Connect to Redis
    await redisClient.connect();

    server = app.listen(PORT, () => {
      console.log(`✓ Server running on http://localhost:${PORT}`);
      console.log(`✓ Health check: http://localhost:${PORT}/health`);
      console.log(`✓ Routes:`);
      console.log(`  - POST   /users`);
      console.log(`  - GET    /users`);
      console.log(`  - GET    /users/:id`);
      console.log(`  - PATCH  /users/:id`);
      console.log(`  - DELETE /users/:id`);
      console.log(`  - POST   /listings`);
      console.log(`  - GET    /listings`);
      console.log(`  - GET    /listings/:id`);
      console.log(`  - GET    /listings/host/:hostId`);
      console.log(`  - PATCH  /listings/:id`);
      console.log(`  - DELETE /listings/:id`);
      console.log(`  - POST   /bookings`);
      console.log(`  - GET    /bookings/:id`);
      console.log(`  - GET    /bookings/listing/:listingId`);
      console.log(`  - GET    /bookings/guest/:guestId`);
      console.log(`  - PATCH  /bookings/:id`);
      console.log(`  - DELETE /bookings/:id`);
      console.log(`  - POST   /payments`);
      console.log(`  - GET    /payments/:id`);
      console.log(`  - GET    /payments/idempotency/:idempotencyKey`);
      console.log(`  - GET    /payments/booking/:bookingId`);
      console.log(`  - PATCH  /payments/:id`);
      console.log(`  - DELETE /payments/:id`);
    });
  } catch (error) {
    console.error("✗ Failed to start:", error.message);
    process.exit(1);
  }
}

start();
