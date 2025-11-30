// src/app/modules/trip/trip.controller.ts
import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import httpStatus from "http-status";
import * as tripService from "./trip.service";
import { IPaginationOptions } from "../../../interfaces/pagination";
import pick from "../../../shared/pick";
import { tripFilterableFields } from "./trip.constant";

export const createTrip = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id; // set by auth middleware
    const payload = req.body;
    const trip = await tripService.createTrip(userId, payload);
    sendResponse(res, { statusCode: httpStatus.CREATED, success: true, message: "Trip created", data: trip });
});

export const getAllTrips = catchAsync(async (req: Request, res: Response) => {
    const filters = pick(req.query, tripFilterableFields);
    const searchTerm = req.query.searchTerm as string;
    if (searchTerm) (filters as any).searchTerm = searchTerm;

    const options: IPaginationOptions = {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10,
    };

    const result = await tripService.getAllTrips(filters, options);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Trips fetched", data: result });
});

export const getOwnTrips = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const options: IPaginationOptions = { page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 10 };
    const result = await tripService.getOwnTrips(userId, options);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Your trips fetched", data: result });
});

export const getTripById = catchAsync(async (req: Request, res: Response) => {
    const trip = await tripService.getTripById(req.params.id);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Trip fetched", data: trip });
});

export const updateOwnTrip = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const tripId = req.params.id;
    const payload = req.body;
    const updated = await tripService.updateTrip(userId, tripId, payload);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Trip updated", data: updated });
});

export const deleteOwnTrip = catchAsync(async (req: Request, res: Response) => {
    const userId = req.user.id;
    const tripId = req.params.id;
    const deleted = await tripService.deleteTrip(userId, tripId);
    sendResponse(res, { statusCode: httpStatus.OK, success: true, message: "Trip deleted", data: deleted });
});
