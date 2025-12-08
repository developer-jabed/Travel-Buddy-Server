import httpStatus from "http-status";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import pick from "../../../shared/pick";
import { SubscriptionPlanService } from "./subscriptionPlan.service";

const createPlan = catchAsync(async (req, res) => {
    const result = await SubscriptionPlanService.createPlan(req.body);

    sendResponse(res, {
        statusCode: httpStatus.CREATED,
        success: true,
        message: "Subscription plan created successfully",
        data: result,
    });
});

const getAllPlans = catchAsync(async (req, res) => {
    const filters = pick(req.query, ["searchTerm", "isActive"]);
    const paginationOptions = pick(req.query, [
        "page",
        "limit",
        "sortBy",
        "sortOrder",
    ]);

    const result = await SubscriptionPlanService.getAllPlans(
        filters,
        paginationOptions
    );

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Subscription plans retrieved successfully",
        meta: result.meta,
        data: result.data,
    });
});

const getPlanById = catchAsync(async (req, res) => {
    const planId = req.params.id;

    const result = await SubscriptionPlanService.getPlanById(planId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Subscription plan retrieved successfully",
        data: result,
    });
});

const updatePlan = catchAsync(async (req, res) => {
    const planId = req.params.id;

    const result = await SubscriptionPlanService.updatePlan(planId, req.body);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Subscription plan updated successfully",
        data: result,
    });
});

const deletePlan = catchAsync(async (req, res) => {
    const planId = req.params.id;

    const  deletePlan=await SubscriptionPlanService.deletePlan(planId);

    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Subscription plan deleted successfully",
        data: deletePlan
    });
});

export const SubscriptionPlanController = {
    createPlan,
    getAllPlans,
    getPlanById,
    updatePlan,
    deletePlan,
};
