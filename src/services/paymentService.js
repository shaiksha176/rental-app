import * as paymentRepository from "../repository/paymentRepository.js";
import * as bookingRepository from "../repository/bookingRepository.js";

export async function createPayment(
  bookingId,
  amount,
  currency,
  stripeChargeId,
  idempotencyKey,
) {
  // Validation
  if (!bookingId || !amount || !idempotencyKey) {
    throw new Error("Missing required fields");
  }

  if (amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  // Idempotency: check if payment already exists for this key
  const existingPayment =
    await paymentRepository.getPaymentByIdempotencyKey(idempotencyKey);
  if (existingPayment) {
    return existingPayment; // Return existing payment instead of creating duplicate
  }

  // Verify booking exists
  const booking = await bookingRepository.getBookingById(bookingId);
  if (!booking) {
    throw new Error("Booking not found");
  }

  // Create payment
  return await paymentRepository.createPayment(
    bookingId,
    amount,
    currency || "USD",
    "pending",
    stripeChargeId,
    idempotencyKey,
  );
}

export async function getPaymentById(id) {
  if (!id) {
    throw new Error("Payment ID is required");
  }

  const payment = await paymentRepository.getPaymentById(id);
  if (!payment) {
    throw new Error("Payment not found");
  }

  return payment;
}

export async function getPaymentByIdempotencyKey(idempotencyKey) {
  if (!idempotencyKey) {
    throw new Error("Idempotency key is required");
  }

  return await paymentRepository.getPaymentByIdempotencyKey(idempotencyKey);
}

export async function getPaymentsByBookingId(bookingId) {
  if (!bookingId) {
    throw new Error("Booking ID is required");
  }

  const booking = await bookingRepository.getBookingById(bookingId);
  if (!booking) {
    throw new Error("Booking not found");
  }

  return await paymentRepository.getPaymentsByBookingId(bookingId);
}

export async function updatePayment(id, updates) {
  if (!id) {
    throw new Error("Payment ID is required");
  }

  const payment = await paymentRepository.getPaymentById(id);
  if (!payment) {
    throw new Error("Payment not found");
  }

  // Business logic: validate status transitions
  if (updates.status) {
    const validStatuses = ["pending", "completed", "failed", "refunded"];
    if (!validStatuses.includes(updates.status)) {
      throw new Error("Invalid payment status");
    }
  }

  return await paymentRepository.updatePayment(id, updates);
}

export async function deletePayment(id) {
  if (!id) {
    throw new Error("Payment ID is required");
  }

  const payment = await paymentRepository.getPaymentById(id);
  if (!payment) {
    throw new Error("Payment not found");
  }

  return await paymentRepository.deletePayment(id);
}
