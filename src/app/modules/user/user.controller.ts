import { Request, Response } from "express";
import { userService } from "./user.service";
import httpStatus from "http-status";
import { IPaginationOptions } from "../../interfaces/pagination";
import { userFilterableFields } from "./user.constant";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import pick from "../../../shared/pick";
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
  const result = await userService.createTraveler(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Traveler created successfully!",
    data: result,
  });
});

// GET ALL USERS
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, userFilterableFields);
  const options: IPaginationOptions = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as "asc" | "desc",
  };
  const result = await userService.getAllUsers(filters, options);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Users fetched successfully!",
    data: result,
  });
});

// GET LOGGED-IN USER PROFILE
const getMyProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IAuthUser
  ;
  const result = await userService.getMyProfile(user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged-in user profile fetched successfully!",
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
  getAllUsers,
  getMyProfile,
  updateStatus,
  updateProfile,
};
