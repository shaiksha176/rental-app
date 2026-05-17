import * as listingRepository from "../repository/listingRepository.js";
import * as userRepository from "../repository/userRepository.js";
import * as cacheService from "./cacheService.js";


export async function createListing(
  hostId,
  title,
  description,
  pricePerNight,
  location,
  images,
  accommodation,
  offerings,
) {
  // Validation
  if (!hostId || !title || !pricePerNight || !location) {
    throw new Error("Missing required fields");
  }

  if (pricePerNight <= 0) {
    throw new Error("Price per night must be greater than 0");
  }

  if (accommodation && accommodation <= 0) {
    throw new Error("Accommodation must be greater than 0");
  }

  // Verify host exists
  const host = await userRepository.getUserById(hostId);
  if (!host) {
    throw new Error("Host not found");
  }

  if (host.role !== "host") {
    throw new Error("Only hosts can create listings");
  }

  // Create listing
  return await listingRepository.createListing(
    hostId,
    title,
    description,
    pricePerNight,
    location,
    images,
    accommodation,
    offerings,
  );
}

export async function getListingById(id) {
  if (!id) {
    throw new Error("Listing ID is required");
  }

  const cacheKey = `${cacheService.CACHE_PREFIX.LISTING}${id}`;

  // Concept: Cache-Aside (Read) - Check Redis before hitting the Database
  const cachedListing = await cacheService.get(cacheKey);
  if (cachedListing) {
    return cachedListing;
  }

  const listing = await listingRepository.getListingById(id);
  if (!listing) {
    throw new Error("Listing not found");
  }

  // Concept: Cache-Aside (Populate) - Save data for subsequent requests
  await cacheService.set(cacheKey, listing);

  return listing;
}

export async function getAllListings(limit = 20, offset = 0) {
  if (limit < 1 || offset < 0) {
    throw new Error("Invalid pagination parameters");
  }

  return await listingRepository.getAllListings(limit, offset);
}

export async function getListingsByHostId(hostId, limit = 20, offset = 0) {
  if (!hostId) {
    throw new Error("Host ID is required");
  }

  if (limit < 1 || offset < 0) {
    throw new Error("Invalid pagination parameters");
  }

  // Verify host exists
  const host = await userRepository.getUserById(hostId);
  if (!host) {
    throw new Error("Host not found");
  }

  return await listingRepository.getListingsByHostId(hostId, limit, offset);
}

export async function updateListing(id, updates) {
  if (!id) {
    throw new Error("Listing ID is required");
  }

  const listing = await listingRepository.getListingById(id);
  if (!listing) {
    throw new Error("Listing not found");
  }

  // Validation
  if (updates.pricePerNight && updates.pricePerNight <= 0) {
    throw new Error("Price per night must be greater than 0");
  }

  if (updates.accommodation && updates.accommodation <= 0) {
    throw new Error("Accommodation must be greater than 0");
  }

  const updatedListing = await listingRepository.updateListing(id, updates);

  await cacheService.del(`${cacheService.CACHE_PREFIX.LISTING}${id}`);

  return updatedListing;
}

export async function deleteListing(id) {
  if (!id) {
    throw new Error("Listing ID is required");
  }

  const listing = await listingRepository.getListingById(id);
  if (!listing) {
    throw new Error("Listing not found");
  }

  const result = await listingRepository.deleteListing(id);

  await cacheService.del(`${cacheService.CACHE_PREFIX.LISTING}${id}`);

  return result;
}
