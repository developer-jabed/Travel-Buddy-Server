import express, { NextFunction, Request, Response } from "express";
import { userController } from "./user.controller";
// import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../../helpers/fileUploader";
import { createTravelerValidationSchema } from "./user.validation";

const router = express.Router();

// CREATE ADMIN
router.post(
  "/create-admin",
  // auth(UserRole.ADMIN),
  fileUploader.upload.single("file"),
  userController.createAdmin
);

// CREATE MODERATOR
router.post(
  "/create-moderator",
  // auth(UserRole.ADMIN),
  userController.createModerator
);

// CREATE TRAVELER
router.post(
  "/create-traveler",
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate JSON from req.body.data
      req.body = createTravelerValidationSchema.parse(JSON.parse(req.body.data));
      return userController.createTraveler(req, res, next);
    } catch (error) {
      next(error); // Let your error handler catch Zod validation errors
    }
  }
);

// GET ALL USERS
router.get(
  "/",
  // auth(UserRole.ADMIN),
  userController.getAllUsers
);

// GET LOGGED-IN USER PROFILE
router.get(
  "/me",
  // auth(UserRole.USER, UserRole.ADMIN),
  userController.getMyProfile
);

// UPDATE STATUS
router.patch(
  "/:id/status",
  // auth(UserRole.ADMIN),
  userController.updateStatus
);

// UPDATE PROFILE
router.patch(
  "/update-my-profile",
  // auth(UserRole.USER, UserRole.ADMIN),
  fileUploader.upload.single("file"),
  userController.updateProfile
);

export const userRoutes = router;
