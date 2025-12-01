import { Request, Response } from "express";
import { SubscriptionService } from "./subscription.service";
import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";

const createSubscription = catchAsync(async (req: Request, res: Response) => {
  const user = req.user; // from auth middleware
  const { plan, paymentMethodId } = req.body;

  const result = await SubscriptionService.subscribe(user.id, plan, paymentMethodId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription created successfully",
    data: result,
  });
});

const getMySubscription = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await SubscriptionService.getMySubscription(user.id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Active subscription fetched",
    data: result,
  });
});

export const SubscriptionController = {
  createSubscription,
  getMySubscription,
};
