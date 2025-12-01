import express from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import { TravelerController } from "./traveller.controller";

const router = express.Router();

router.get("/", auth(UserRole.ADMIN), TravelerController.getAllTravelers);
router.get("/:id", auth(UserRole.ADMIN), TravelerController.getTravelerById);
router.patch("/soft/:id", auth(UserRole.ADMIN), TravelerController.softDeleteTraveler);

export const TravelerRoutes = router;
