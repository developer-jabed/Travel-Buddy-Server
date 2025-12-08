import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { IJWTPayload } from "../../../types/common";
import { MetaService } from "./meta.service";

const fetchDashboardMetaData = catchAsync(
  async (req: Request & { user?: IJWTPayload }, res: Response) => {

    const user = req.user as IJWTPayload;

    console.log( req.user)

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
