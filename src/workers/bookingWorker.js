import { Worker } from "bullmq";
import { redisConfig } from "../db/redis.js";
import { BOOKING_QUEUE_NAME } from "../queues/bookingQueue.js";
import * as bookingRepository from "../repository/bookingRepository.js";

export function initBookingWorker() {
  const worker = new Worker(
    BOOKING_QUEUE_NAME,
    async (job) => {
      if (job.name === "CHECK_BOOKING_EXPIRY") {
        await handleBookingExpiry(job.data.bookingId);
      }
    },
    { connection: redisConfig },
  );

  worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Job ${job.id} failed: ${err.message}`);
  });

  console.log("✓ Booking Worker initialized");
  return worker;
}

async function handleBookingExpiry(bookingId) {
  const booking = await bookingRepository.getBookingById(bookingId);

  if (!booking) {
    console.log(`[Worker] Booking ${bookingId} not found. Skipping.`);
    return;
  }

  if (booking.booking_status === "pending") {
    console.log(`[Worker] Expiring booking ${bookingId} due to inactivity.`);
    await bookingRepository.updateBooking(bookingId, {
      booking_status: "cancelled",
      payment_status: "failed",
    });
  } else {
    console.log(`[Worker] Booking ${bookingId} already ${booking.booking_status}. No action.`);
  }
}
