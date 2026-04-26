import * as paymentService from "../services/paymentService.js";

export async function createPayment(req, res, next) {
  try {
    const { bookingId, amount, currency, stripeChargeId, idempotencyKey } =
      req.body;
    const payment = await paymentService.createPayment(
      bookingId,
      amount,
      currency,
      stripeChargeId,
      idempotencyKey,
    );
    res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
}

export async function getPayment(req, res, next) {
  try {
    const { id } = req.params;
    const payment = await paymentService.getPaymentById(id);
    res.json(payment);
  } catch (error) {
    next(error);
  }
}

export async function getPaymentByIdempotencyKey(req, res, next) {
  try {
    const { idempotencyKey } = req.params;
    const payment =
      await paymentService.getPaymentByIdempotencyKey(idempotencyKey);
    res.json(payment);
  } catch (error) {
    next(error);
  }
}

export async function getPaymentsByBooking(req, res, next) {
  try {
    const { bookingId } = req.params;
    const payments = await paymentService.getPaymentsByBookingId(bookingId);
    res.json(payments);
  } catch (error) {
    next(error);
  }
}

export async function updatePayment(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const payment = await paymentService.updatePayment(id, updates);
    res.json(payment);
  } catch (error) {
    next(error);
  }
}

export async function deletePayment(req, res, next) {
  try {
    const { id } = req.params;
    await paymentService.deletePayment(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
