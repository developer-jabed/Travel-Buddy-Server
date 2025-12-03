import { Router } from "express";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { buddyRequestController } from "./buddyRequest.controller";

const router = Router();

router.post("/", auth(UserRole.USER), buddyRequestController.createBuddyRequest);
router.get("/", auth(), buddyRequestController.getAllBuddyRequests);
router.patch("/:id", auth(UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR), buddyRequestController.updateBuddyRequest);
router.get("/own", auth(UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR), buddyRequestController.getOwnBuddyRequests);
router.delete("/:id", auth(UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR), buddyRequestController.deleteBuddyRequest);

export const buddyRoutes = router;
