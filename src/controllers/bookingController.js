import * as bookingService from "../services/bookingService.js";

export async function createBooking(req, res, next) {
  try {
    const { listingId, guestId, checkIn, checkOut, totalPrice } = req.body;
    const booking = await bookingService.createBooking(
      listingId,
      guestId,
      checkIn,
      checkOut,
      totalPrice,
    );
    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
}

export async function getBooking(req, res, next) {
  try {
    const { id } = req.params;
    const booking = await bookingService.getBookingById(id);
    res.json(booking);
  } catch (error) {
    next(error);
  }
}

export async function getBookingsByListing(req, res, next) {
  try {
    const { listingId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const bookings = await bookingService.getBookingsByListingId(
      listingId,
      limit,
      offset,
    );
    res.json(bookings);
  } catch (error) {
    next(error);
  }
}

export async function getBookingsByGuest(req, res, next) {
  try {
    const { guestId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const bookings = await bookingService.getBookingsByGuestId(
      guestId,
      limit,
      offset,
    );
    res.json(bookings);
  } catch (error) {
    next(error);
  }
}

export async function updateBooking(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const booking = await bookingService.updateBooking(id, updates);
    res.json(booking);
  } catch (error) {
    next(error);
  }
}

export async function deleteBooking(req, res, next) {
  try {
    const { id } = req.params;
    await bookingService.deleteBooking(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
