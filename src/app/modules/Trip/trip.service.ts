// src/app/modules/trip/trip.service.ts
import { PrismaClient, Trip } from "@prisma/client";
import httpStatus from "http-status";
import { tripFilterableFields, tripSearchableFields } from "./trip.constant";
import { IPaginationOptions } from "../../interfaces/pagination";
import { paginationHelper } from "../../../helpers/paginationHelper";
import ApiError from "../../errors/ApiError";
import prisma from "../../../shared/prisma";


// Create Trip
export const createTrip = async (userId: string, payload: any): Promise<Trip> => {
  return prisma.trip.create({
    data: { ...payload, userId },
  });
};

// Get All Trips (Admin)
export const getAllTrips = async (filters: any, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, startDate, endDate, ...filterData } = filters;

  const andConditions: any[] = [];

  // Search by title, destination, description
  if (searchTerm) {
    const search = searchTerm.trim();
    andConditions.push({
      OR: tripSearchableFields.map(field => ({
        [field]: { contains: search, mode: "insensitive" },
      })),
    });
  }

  // Filter by exact fields (tripStatus, userId)
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map(key => ({ [key]: { equals: filterData[key] } })),
    });
  }

  // Filter by startDate / endDate
  if (startDate || endDate) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    andConditions.push({ startDate: dateFilter });
  }

  const where = andConditions.length > 0 ? { AND: andConditions } : {};

  const trips = await prisma.trip.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.trip.count({ where });

  return { meta: { page, limit, total }, data: trips };
};

export const getOwnTrips = async (userId: string, filters: any, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, startDate, endDate, ...filterData } = filters;

  const andConditions: any[] = [{ userId }];

  if (searchTerm) {
    const search = searchTerm.trim();
    andConditions.push({
      OR: tripSearchableFields.map(field => ({
        [field]: { contains: search, mode: "insensitive" },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map(key => ({ [key]: { equals: filterData[key] } })),
    });
  }

  if (startDate || endDate) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);
    andConditions.push({ startDate: dateFilter });
  }

  const where = { AND: andConditions };

  const trips = await prisma.trip.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.trip.count({ where });

  return { meta: { page, limit, total }, data: trips };
};

export const getTripById = async (tripId: string) => {
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      user: true, // include trip owner
      buddyRequests: true,
      meetups: true,
    },
  });

  if (!trip) {
    throw new ApiError(httpStatus.NOT_FOUND, "Trip not found");
  }

  return trip;
};
// Update Own Trip
export const updateTrip = async (userId: string, tripId: string, payload: any) => {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new Error("Trip not found");
  if (trip.userId !== userId) throw new Error("Unauthorized");

  return prisma.trip.update({ where: { id: tripId }, data: payload });
};

// Delete Own Trip
export const deleteTrip = async (userId: string, tripId: string) => {
  const trip = await prisma.trip.findUnique({ where: { id: tripId } });
  if (!trip) throw new Error("Trip not found");
  if (trip.userId !== userId) throw new Error("Unauthorized");

  return prisma.trip.delete({ where: { id: tripId } });
};
