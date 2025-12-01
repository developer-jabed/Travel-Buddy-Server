import { RequestHandler } from "express";
import httpStatus from "http-status";
import { travelerFilterableFields } from "./traveller.constant";
import pick from "../../../shared/pick";
import { TravelerService } from "./traveller.service";
import sendResponse from "../../../shared/sendResponse";

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

const getTravelerById: RequestHandler = async (req, res) => {
  const { id } = req.params;
  const traveler = await TravelerService.getTravelerById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Traveler fetched successfully!",
    data: traveler
  });
};

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
  softDeleteTraveler
};
