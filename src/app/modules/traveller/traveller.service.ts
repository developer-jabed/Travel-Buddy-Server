import prisma from "../../../shared/prisma";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { Prisma } from "@prisma/client";
import { ITravelerFilterRequest } from "./traveller.interface";

const getAllTravelers = async (filters: ITravelerFilterRequest, options: any) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.TravelerProfileWhereInput[] = [];

  // Exact filters
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map(key => ({
        [key]: { equals: (filterData as any)[key] }
      }))
    });
  }

  // Search term logic
  if (searchTerm && searchTerm.trim() !== '') {
    const search = searchTerm.trim();
    andConditions.push({
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { country: { contains: search, mode: 'insensitive' } },
      ]
    });
  }

  // Always exclude deleted
  andConditions.push({ isDeleted: false });

  const where: Prisma.TravelerProfileWhereInput = { AND: andConditions };

  const result = await prisma.travelerProfile.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: { user: true },
  });

  const total = await prisma.travelerProfile.count({ where });

  return { meta: { page, limit, total }, data: result };
};



const getTravelerById = async (id: string) => {
  return prisma.travelerProfile.findUnique({
    where: { id },
    include: { user: true }
  });
};

const softDeleteTraveler = async (id: string) => {
  const traveler = await prisma.travelerProfile.findUniqueOrThrow({ where: { id } });

  // Toggle status
  const newStatus = traveler.isDeleted ? false : true;

  const result = await prisma.$transaction(async tx => {
    await tx.travelerProfile.update({
      where: { id },
      data: { isDeleted: newStatus }
    });

    await tx.user.update({
      where: { id: traveler.userId },
      data: { status: newStatus ? 'INACTIVE' : 'ACTIVE' }
    });

    return { id, isDeleted: newStatus };
  });

  return result;
};

export const TravelerService = {
  getAllTravelers,
  getTravelerById,
  softDeleteTraveler
};
