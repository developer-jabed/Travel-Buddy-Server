import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { MetaService } from "./meta.service";
import { IJWTPayload } from "../../../types/common";
import httpStatus from "http-status";

const fetchDashboardMetaData = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {
    const user = req.user as IJWTPayload;

    const result = await MetaService.fetchDashboardMetaData(user);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Dashboard metadata retrieved successfully!",
      data: result,
    });
  }
);

export const MetaController = {
  fetchDashboardMetaData,
};
