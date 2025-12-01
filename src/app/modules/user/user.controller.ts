import { Request, Response } from "express";
import { userService } from "./user.service";
import httpStatus from "http-status";

import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";

import { IAuthUser } from "./user.interface";

// CREATE ADMIN
const createAdmin = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createAdmin(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Admin created successfully!",
    data: result,
  });
});

// CREATE MODERATOR
const createModerator = catchAsync(async (req: Request, res: Response) => {
  const result = await userService.createModerator(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Moderator created successfully!",
    data: result,
  });
});

// CREATE TRAVELER
const createTraveler = catchAsync(async (req: Request, res: Response) => {

  console.log(req.body)
  const result = await userService.createTraveler(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Traveler created successfully!",
    data: result,
  });
});






// UPDATE STATUS
const updateStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await userService.updateStatus(id, status);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User status updated successfully!",
    data: result,
  });
});

// UPDATE PROFILE
const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser;
  const file = req.file;
  const result = await userService.updateProfile(user.id, req.body, file);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Profile updated successfully!",
    data: result,
  });
});

export const userController = {
  createAdmin,
  createModerator,
  createTraveler,
  updateStatus,
  updateProfile,
};
