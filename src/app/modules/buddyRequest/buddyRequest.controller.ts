import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { BuddyService } from "./buddyRequest.service";
import { IPaginationOptions } from "../../interfaces/pagination";
import { BuddyStatus } from "@prisma/client";

 const createBuddyRequest = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await BuddyService.createBuddyRequest(req.user.id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Buddy request created successfully",
    data: result,
  });
});

 const getAllBuddyRequests = catchAsync(async (req: Request, res: Response) => {
  const filters = {
    tripId: req.query.tripId as string,
    senderId: req.query.senderId as string,
    receiverId: req.query.receiverId as string,
    status: req.query.status as string,
  };
  const options: IPaginationOptions = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as "asc" | "desc",
  };

  const result = await BuddyService.getAllBuddyRequests(filters, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Buddy requests fetched successfully",
    data: result,
  });
});

 const getOwnBuddyRequests = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const options: IPaginationOptions = {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
    sortBy: req.query.sortBy as string,
    sortOrder: req.query.sortOrder as "asc" | "desc",
  };

  const result = await BuddyService.getOwnBuddyRequests(req.user.id, options);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Your buddy requests fetched successfully",
    data: result,
  });
});

 const deleteBuddyRequest = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const result = await BuddyService.deleteBuddyRequest(req.user.id, req.params.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Buddy request deleted successfully",
    data: result,
  });
});

const updateBuddyRequest = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  const { status } = req.body as { status: BuddyStatus };
  const result = await BuddyService.updateBuddyRequestStatus(req.user.id, req.params.id, status);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Buddy request updated successfully",
    data: result,
  });
});



export const buddyRequestController = {
    createBuddyRequest,
    getAllBuddyRequests,
    getOwnBuddyRequests,
    deleteBuddyRequest,
    updateBuddyRequest
}