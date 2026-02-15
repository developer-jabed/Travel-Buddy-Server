import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { IJWTPayload } from "../../../types/common";
import { MetaService } from "./meta.service";


const fetchDashboardMetaData = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    if (!req.user) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        success: false,
        message: "User not authenticated",
        data: null,
      });
    }

    const user = req.user;


    const data = await MetaService.fetchDashboardMetaData(user);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Dashboard metadata retrieved successfully!",
      data,
    });
  }
);

export const MetaController = {
  fetchDashboardMetaData,
};
