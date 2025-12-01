import express from "express";
import { ModeratorController } from "./moderator.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";


const router = express.Router();


router.get(
  "/",
  auth(UserRole.ADMIN),
  ModeratorController.getAllFromDB
);

router.get(
  "/:id",
  auth(UserRole.ADMIN),
  ModeratorController.getByIdFromDB
);



router.delete(
  "/soft/:id",
  auth(UserRole.ADMIN),
  ModeratorController.softDeleteFromDB
);

export const ModeratorRoutes = router;
