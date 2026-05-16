import { Queue } from "bullmq";
import { redisConfig } from "../db/redis.js";

export const BOOKING_QUEUE_NAME = "booking-queue";

export const bookingQueue = new Queue(BOOKING_QUEUE_NAME, {
  connection: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
    removeOnComplete: true,
    removeOnFail: { count: 100 },
  },
});

export async function addBookingExpiryJob(bookingId, delayMs = 15 * 60 * 1000) {
  try {
    await bookingQueue.add("CHECK_BOOKING_EXPIRY", { bookingId }, { delay: delayMs });
    console.log(`[Queue] Expiry job added for booking: ${bookingId}`);
  } catch (error) {
    console.error(`[Queue] Failed to add job for booking ${bookingId}:`, error.message);
  }
}
