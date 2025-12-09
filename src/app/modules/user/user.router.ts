import express, { NextFunction, Request, Response } from "express";
import { userController } from "./user.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { fileUploader } from "../../../helpers/fileUploader";
import { createAdminSchema, createModeratorSchema, createTravelerValidationSchema } from "./user.validation";

const router = express.Router();

// CREATE ADMIN
router.post(
  "/create-admin",
  auth(UserRole.ADMIN),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate JSON from req.body.data
      req.body = createAdminSchema.parse(JSON.parse(req.body.data));
      return userController.createAdmin(req, res, next);
    } catch (error) {
      next(error); // Let your error handler catch Zod validation errors
    }
  }
);

// CREATE MODERATOR
router.post(
  "/create-moderator",
  auth(UserRole.ADMIN),
  fileUploader.upload.single("file"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate JSON from req.body.data
      req.body = createModeratorSchema.parse(JSON.parse(req.body.data));
      return userController.createModerator(req, res, next);
    } catch (error) {
      next(error); // Let your error handler catch Zod validation errors
    }
  }

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



// UPDATE STATUS
router.patch(
  "/:id/status",
  auth(UserRole.ADMIN),
  userController.updateStatus
);

router.patch(
  "/update-my-profile",
  auth(UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR),

  // Multer file upload
  fileUploader.upload.single("file"),

  // Parse JSON body from FormData
  (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body?.data) {
        req.body = JSON.parse(req.body.data);
      }
      next();
    } catch (error) {
      next(error);
    }
  },

  userController.updateProfile
);



export const userRoutes = router;
