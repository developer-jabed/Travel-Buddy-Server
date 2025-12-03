import express from "express";
import { UserRole } from "@prisma/client";
import auth from "../../middlewares/auth";
import { TravelerController } from "./traveller.controller";

const router = express.Router();

router.get("/",   TravelerController.getAllTravelers);
router.get("/:id", auth(UserRole.ADMIN), TravelerController.getTravelerById);
router.patch("/soft/:id", auth(UserRole.ADMIN), TravelerController.softDeleteTraveler);
router.get("/recommendations",  TravelerController.getRecommendedTravelers);

export const TravelerRoutes = router;
