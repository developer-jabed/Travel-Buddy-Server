// src/app/modules/trip/trip.service.ts
import { PrismaClient, Trip } from "@prisma/client";

import { tripFilterableFields, tripSearchableFields } from "./trip.constant";

const prisma = new PrismaClient();

// Create Trip
export const createTrip = async (userId: string, payload: any): Promise<Trip> => {
  return prisma.trip.create({
    data: { ...payload, userId },
  });
};

// Get All Trips (Admin)
export const getAllTrips = async (filters: any, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: any[] = [];

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

// Get Own Trips
export const getOwnTrips = async (userId: string, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const trips = await prisma.trip.findMany({
    where: { userId },
    skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  const total = await prisma.trip.count({ where: { userId } });

  return { meta: { page, limit, total }, data: trips };
};

// Get Trip by ID
export const getTripById = async (id: string) => {
  return prisma.trip.findUnique({ where: { id } });
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
