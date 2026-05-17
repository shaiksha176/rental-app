import * as listingService from "../services/listingService.js";

export async function createListing(req, res, next) {
  try {
    const {
      hostId,
      title,
      description,
      pricePerNight,
      location,
      images,
      accommodation,
      offerings,
    } = req.body;
    const listing = await listingService.createListing(
      hostId,
      title,
      description,
      pricePerNight,
      location,
      images,
      accommodation,
      offerings,
    );
    res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
}

export async function getListing(req, res, next) {
  try {
    const { id } = req.params;
    const listing = await listingService.getListingById(id);
    res.json(listing);
  } catch (error) {
    next(error);
  }
}

export async function getAllListings(req, res, next) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const listings = await listingService.getAllListings(limit, offset);
    res.json(listings);
  } catch (error) {
    next(error);
  }
}

export async function getListingsByHost(req, res, next) {
  try {
    const { hostId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    const listings = await listingService.getListingsByHostId(
      hostId,
      limit,
      offset,
    );
    res.json(listings);
  } catch (error) {
    next(error);
  }
}

export async function updateListing(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const listing = await listingService.updateListing(id, updates);
    res.json(listing);
  } catch (error) {
    next(error);
  }
}

export async function deleteListing(req, res, next) {
  try {
    const { id } = req.params;
    await listingService.deleteListing(id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

