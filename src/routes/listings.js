import express from "express";
import * as listingController from "../controllers/listingController.js";

const router = express.Router();

router.post("/", listingController.createListing);
router.get("/", listingController.getAllListings);
router.get("/:id", listingController.getListing);
router.get("/host/:hostId", listingController.getListingsByHost);
router.patch("/:id", listingController.updateListing);
router.delete("/:id", listingController.deleteListing);

export default router;
