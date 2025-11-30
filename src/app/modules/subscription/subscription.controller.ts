import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { SubscriptionService } from "./subscription.service";

const createSubscription = catchAsync(async (req, res) => {
  const { plan } = req.body;
  const userId = req.user.id;

  const result = await SubscriptionService.subscribe(userId, plan);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription activated successfully",
    data: result,
  });
});

const getMySubscription = catchAsync(async (req, res) => {
  const userId = req.user.id;

  const result = await SubscriptionService.getMySubscription(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Subscription retrieved",
    data: result,
  });
});

export const SubscriptionController = {
  createSubscription,
  getMySubscription,
};
