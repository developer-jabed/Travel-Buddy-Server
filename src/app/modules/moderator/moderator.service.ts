import prisma from "../../../shared/prisma";
import { Moderator, Prisma, UserStatus, UserRole } from "@prisma/client";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { moderatorSearchableFields } from "./moderator.constant";
import { IModeratorFilterRequest } from "./moderator.interface";



const getAllModerators = async (filters: IModeratorFilterRequest, options: any) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = filters;

    const andConditions: Prisma.ModeratorWhereInput[] = [];

    if (searchTerm) {
        andConditions.push({
            OR: moderatorSearchableFields.map(field => ({
                [field]: { contains: searchTerm, mode: "insensitive" }
            }))
        });
    }

    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: { equals: (filterData as any)[key] }
            }))
        });
    }

    andConditions.push({ isDeleted: false });

    const where: Prisma.ModeratorWhereInput = { AND: andConditions };

    const result = await prisma.moderator.findMany({
        where,
        skip,
        take: limit,
        orderBy: options.sortBy && options.sortOrder ? { [options.sortBy]: options.sortOrder } : { createdAt: "desc" },
        include: { user: true },
    });

    const total = await prisma.moderator.count({ where });

    return { meta: { page, limit, total }, data: result };
};

// Get by ID
const getModeratorById = async (id: string): Promise<Moderator> => {
    const moderator = await prisma.moderator.findUniqueOrThrow({
        where: { id, isDeleted: false },
        include: { user: true },
    });
    return moderator;
};

// Update moderator
const updateModerator = async (id: string, data: Partial<Moderator>): Promise<Moderator> => {
    const moderator = await prisma.moderator.findUniqueOrThrow({ where: { id } });

    const updated = await prisma.$transaction(async (tx) => {
        const updatedModerator = await tx.moderator.update({
            where: { id },
            data,
        });

        if (data.name || data.email) {
            await tx.user.update({
                where: { id: moderator.userId },
                data: { name: data.name, email: data.email },
            });
        }

        return updatedModerator;
    });

    return updated;
};

// Delete moderator

// Soft delete
const softDeleteModerator = async (id: string): Promise<Moderator> => {
    const moderator = await prisma.moderator.findUniqueOrThrow({ where: { id } });

    const updated = await prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: moderator.userId }, data: { status: UserStatus.INACTIVE } });
        return await tx.moderator.update({ where: { id }, data: { isDeleted: true } });
    });

    return updated;
};

export const ModeratorService = {
    getAllModerators,
    getModeratorById,
    updateModerator,
    softDeleteModerator,
};
