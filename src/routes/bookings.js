import express from "express";
import * as bookingController from "../controllers/bookingController.js";

const router = express.Router();

router.post("/", bookingController.createBooking);
router.get("/:id", bookingController.getBooking);
router.get("/listing/:listingId", bookingController.getBookingsByListing);
router.get("/guest/:guestId", bookingController.getBookingsByGuest);
router.patch("/:id", bookingController.updateBooking);
router.delete("/:id", bookingController.deleteBooking);

export default router;
