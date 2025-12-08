import { RequestHandler } from "express";
import httpStatus from "http-status";
import { travelerFilterableFields } from "./traveller.constant";
import pick from "../../../shared/pick";
import { TravelerService } from "./traveller.service";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";

const getAllTravelers: RequestHandler = async (req, res) => {
  // Pick exact filters from query
  const filters = pick(req.query, travelerFilterableFields);

  // Add searchTerm if provided
  const searchTerm = req.query.searchTerm as string;
  if (searchTerm) {
    (filters as any).searchTerm = searchTerm;
  }

  // Pagination & sorting
  const options = pick(req.query, ['limit', 'page', 'sortBy', 'sortOrder']);

  // Fetch travelers from service
  const result = await TravelerService.getAllTravelers(filters, options);

  // Send response
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Travelers fetched successfully!",
    meta: result.meta,
    data: result.data
  });
};

 const getRecommendedTravelers = catchAsync(async (req, res) => {
  const userId = req.user?.id;

  console.log(req.user)

  const travelers = await TravelerService.getRecommendedTravelers(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Recommended travelers fetched successfully!",
    data: travelers,
  });
});

const getTravelerById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await TravelerService.getTravelerById(id);

  sendResponse(res, {
    statusCode: result.success ? httpStatus.OK : httpStatus.NOT_FOUND,
    success: result.success,
    message: result.message,
    data: result.data,
  });
});


const softDeleteTraveler: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const result = await TravelerService.softDeleteTraveler(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.isDeleted ? "Traveler deactivated!" : "Traveler activated!",
    data: result
  });
};

export const TravelerController = {
  getAllTravelers,
  getTravelerById,
  softDeleteTraveler,
  getRecommendedTravelers
};
