// src/app/modules/trip/trip.route.ts
import { Router } from "express";
import * as tripController from "./trip.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = Router();

// Create a trip - USER, ADMIN, MODERATOR
router.post("/", auth(UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR), tripController.createTrip);

// Get all trips - ADMIN or MODERATOR
router.get("/", auth(UserRole.ADMIN, UserRole.MODERATOR), tripController.getAllTrips);

// Get own trips - USER, ADMIN, MODERATOR
router.get("/own", auth(UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR), tripController.getOwnTrips);

// Get trip by ID - USER, ADMIN, MODERATOR
router.get("/:id", auth(UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR), tripController.getTripById);

// Update own trip - only USER or MODERATOR if needed
router.patch("/:id", auth(UserRole.USER, UserRole.MODERATOR), tripController.updateOwnTrip);

// Delete own trip - only USER or MODERATOR if needed
router.delete("/:id", auth(UserRole.USER, UserRole.MODERATOR), tripController.deleteOwnTrip);

export const tripRoutes = router;
