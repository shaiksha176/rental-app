import express from "express";
import * as paymentController from "../controllers/paymentController.js";

const router = express.Router();

router.post("/", paymentController.createPayment);
router.get("/:id", paymentController.getPayment);
router.get(
  "/idempotency/:idempotencyKey",
  paymentController.getPaymentByIdempotencyKey,
);
router.get("/booking/:bookingId", paymentController.getPaymentsByBooking);
router.patch("/:id", paymentController.updatePayment);
router.delete("/:id", paymentController.deletePayment);

export default router;
