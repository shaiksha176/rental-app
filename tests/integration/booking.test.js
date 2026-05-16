import pool from "../../src/db/client.js";
import { createBookingAtomic } from "../../src/repository/bookingRepository.js";

describe("Concurrent Booking — Pessimistic Locking", () => {
  let hostId, guestId, listingId;

  beforeAll(async () => {
    const host = await pool.query(
      "INSERT INTO users (email, username, role) VALUES ($1, $2, 'host') RETURNING id",
      ["load-test-host@test.com", "loadtesthost"],
    );
    hostId = host.rows[0].id;

    const guest = await pool.query(
      "INSERT INTO users (email, username, role) VALUES ($1, $2, 'guest') RETURNING id",
      ["load-test-guest@test.com", "loadtestguest"],
    );
    guestId = guest.rows[0].id;

    const listing = await pool.query(
      "INSERT INTO listings (host_id, title, price_per_night, location) VALUES ($1, $2, $3, $4) RETURNING id",
      [hostId, "Concurrency Test Listing", 100, "Test City"],
    );
    listingId = listing.rows[0].id;
  });

  afterAll(async () => {
    await pool.query("DELETE FROM bookings WHERE listing_id = $1", [listingId]);
    await pool.query("DELETE FROM listings WHERE id = $1", [listingId]);
    await pool.query("DELETE FROM users WHERE id IN ($1, $2)", [hostId, guestId]);
  });

  it("allows exactly one booking when 10 requests race for the same dates", async () => {
    const checkIn = "2027-06-01";
    const checkOut = "2027-06-07";
    const CONCURRENT = 10;

    const results = await Promise.allSettled(
      Array.from({ length: CONCURRENT }, () =>
        createBookingAtomic(listingId, guestId, checkIn, checkOut, 600),
      ),
    );

    const successes = results.filter((r) => r.status === "fulfilled");
    const conflicts = results.filter(
      (r) => r.status === "rejected" && r.reason.code === "BOOKING_CONFLICT",
    );

    expect(successes).toHaveLength(1);
    expect(conflicts).toHaveLength(CONCURRENT - 1);
  });

  it("allows non-overlapping bookings to succeed concurrently", async () => {
    const bookings = [
      { checkIn: "2027-07-01", checkOut: "2027-07-05" },
      { checkIn: "2027-07-10", checkOut: "2027-07-15" },
      { checkIn: "2027-07-20", checkOut: "2027-07-25" },
    ];

    const results = await Promise.allSettled(
      bookings.map(({ checkIn, checkOut }) =>
        createBookingAtomic(listingId, guestId, checkIn, checkOut, 400),
      ),
    );

    const successes = results.filter((r) => r.status === "fulfilled");
    expect(successes).toHaveLength(3);
  });
});
