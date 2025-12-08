import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import { SubscriptionService } from "./subscription.service";
import { IPaginationOptions } from "../../interfaces/pagination";

export const SubscriptionController = {
  // ------------------------------------
  // CREATE SUBSCRIPTION (USER ONLY)
  // ------------------------------------
  createSubscription: catchAsync(async (req: Request, res: Response) => {
    const user = req.user; // Provided by auth middleware
    const { amount,  plan   } = req.body;
    

    const result = await SubscriptionService.createSubscription(
      user.id,
      plan,

      amount,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Subscription created successfully",
      data: result,
    });
  }),

  // ------------------------------------
  // ADMIN: GET ALL SUBSCRIPTIONS
  // ------------------------------------
  getAllSubscriptions: catchAsync(async (req: Request, res: Response) => {
    const paginationOptions = req.query as unknown as IPaginationOptions;

    const result = await SubscriptionService.getAllSubscriptions(
      paginationOptions
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Subscriptions retrieved successfully",
      meta: result.meta,
      data: result.data,
    });
  }),

  // ------------------------------------
  // USER + ADMIN GET BY ID
  // ------------------------------------
  getSubscriptionById: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await SubscriptionService.getSubscriptionById(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Subscription retrieved successfully",
      data: result,
    });
  }),

  // ------------------------------------
  // ADMIN UPDATE SUBSCRIPTION
  // ------------------------------------
  updateSubscription: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body;

    const result = await SubscriptionService.updateSubscription(id, payload);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Subscription updated successfully",
      data: result,
    });
  }),

  // ------------------------------------
  // ADMIN DELETE SUBSCRIPTION
  // ------------------------------------
  deleteSubscription: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await SubscriptionService.deleteSubscription(id);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Subscription deleted successfully",
      data: result,
    });
  }),
};
