import { addBookingExpiryJob, bookingQueue } from "./src/queues/bookingQueue.js";
import { initBookingWorker } from "./src/workers/bookingWorker.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Test script for BullMQ
 * Note: Since we don't have a real DB connection in this standalone script,
 * the worker might fail the DB check, but we can verify it triggers.
 */
async function testQueue() {
  console.log("Starting BullMQ test...");

  // Initialize worker
  const worker = initBookingWorker();

  const testBookingId = uuidv4();
  const delay = 3000; // 3 seconds for testing

  console.log(`Adding test job for booking ${testBookingId} with ${delay}ms delay...`);
  await addBookingExpiryJob(testBookingId, delay);

  console.log("Waiting for worker to process...");
  
  // Keep script alive for a few seconds to see the result
  setTimeout(async () => {
    console.log("Closing connections...");
    await worker.close();
    await bookingQueue.close();
    process.exit(0);
  }, 10000);
}

// Note: This script needs the redis server to be running.
testQueue();
