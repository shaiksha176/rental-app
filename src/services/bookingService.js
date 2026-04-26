import * as bookingRepository from "../repository/bookingRepository.js";
import * as listingRepository from "../repository/listingRepository.js";
import * as userRepository from "../repository/userRepository.js";

export async function createBooking(
  listingId,
  guestId,
  checkIn,
  checkOut,
  totalPrice,
) {
  // Validation
  if (!listingId || !guestId || !checkIn || !checkOut || !totalPrice) {
    throw new Error("Missing required fields");
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);

  if (checkOutDate <= checkInDate) {
    throw new Error("Check-out date must be after check-in date");
  }

  if (totalPrice <= 0) {
    throw new Error("Total price must be greater than 0");
  }

  // Verify listing exists
  const listing = await listingRepository.getListingById(listingId);
  if (!listing) {
    throw new Error("Listing not found");
  }

  // Verify guest exists
  const guest = await userRepository.getUserById(guestId);
  if (!guest) {
    throw new Error("Guest not found");
  }

  if (guest.role !== "guest") {
    throw new Error("Only guests can make bookings");
  }

  // Business logic: check for overlapping bookings (simplified)
  // In real app, check if dates overlap with existing bookings

  // Create booking
  return await bookingRepository.createBooking(
    listingId,
    guestId,
    checkIn,
    checkOut,
    totalPrice,
  );
}

export async function getBookingById(id) {
  if (!id) {
    throw new Error("Booking ID is required");
  }

  const booking = await bookingRepository.getBookingById(id);
  if (!booking) {
    throw new Error("Booking not found");
  }

  return booking;
}

export async function getBookingsByListingId(
  listingId,
  limit = 20,
  offset = 0,
) {
  if (!listingId) {
    throw new Error("Listing ID is required");
  }

  const listing = await listingRepository.getListingById(listingId);
  if (!listing) {
    throw new Error("Listing not found");
  }

  return await bookingRepository.getBookingsByListingId(
    listingId,
    limit,
    offset,
  );
}

export async function getBookingsByGuestId(guestId, limit = 20, offset = 0) {
  if (!guestId) {
    throw new Error("Guest ID is required");
  }

  const guest = await userRepository.getUserById(guestId);
  if (!guest) {
    throw new Error("Guest not found");
  }

  return await bookingRepository.getBookingsByGuestId(guestId, limit, offset);
}

export async function updateBooking(id, updates) {
  if (!id) {
    throw new Error("Booking ID is required");
  }

  const booking = await bookingRepository.getBookingById(id);
  if (!booking) {
    throw new Error("Booking not found");
  }

  // Business logic: validate status transitions
  if (updates.status) {
    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
    if (!validStatuses.includes(updates.status)) {
      throw new Error("Invalid booking status");
    }
  }

  return await bookingRepository.updateBooking(id, updates);
}

export async function deleteBooking(id) {
  if (!id) {
    throw new Error("Booking ID is required");
  }

  const booking = await bookingRepository.getBookingById(id);
  if (!booking) {
    throw new Error("Booking not found");
  }

  return await bookingRepository.deleteBooking(id);
}
