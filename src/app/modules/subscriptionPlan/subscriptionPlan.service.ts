import httpStatus from "http-status";
import prisma from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { IPaginationOptions } from "../../interfaces/pagination";
import { paginationHelper } from "../../../helpers/paginationHelper";

type FilterOptions = {
    searchTerm?: string;
    isActive?: string;
};

const createPlan = async (payload: any) => {
    const plan = await prisma.subscriptionPlanPricing.create({
        data: payload,
    });

    return plan;
};

const getAllPlans = async (
    filters: FilterOptions,
    paginationOptions: IPaginationOptions
) => {
    const { limit, page, skip } = paginationHelper.calculatePagination(
        paginationOptions
    );

    const { searchTerm, ...filterData } = filters;

    const andConditions: any[] = [];

    // 🔍 Search
    if (searchTerm) {
        andConditions.push({
            OR: [
                { name: { contains: searchTerm, mode: "insensitive" } },
                { description: { contains: searchTerm, mode: "insensitive" } },
            ],
        });
    }

    // 🔎 Exact filters
    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.entries(filterData).map(([key, value]) => ({
                [key]: value,
            })),
        });
    }

    const whereCondition = andConditions.length > 0 ? { AND: andConditions } : {};

    const result = await prisma.subscriptionPlanPricing.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
    });

    const total = await prisma.subscriptionPlanPricing.count({
        where: whereCondition,
    });

    return {
        meta: { page, limit, total },
        data: result,
    };
};

const getPlanById = async (id: string) => {
    const plan = await prisma.subscriptionPlanPricing.findUnique({ where: { id } });

    if (!plan) {
        throw new ApiError(httpStatus.NOT_FOUND, "Plan not found");
    }

    return plan;
};

const updatePlan = async (id: string, payload: any) => {
    await getPlanById(id); // ensures exists

    const updated = await prisma.subscriptionPlanPricing.update({
        where: { id },
        data: payload,
    });

    return updated;
};

const deletePlan = async (id: string) => {
    await getPlanById(id);

    await prisma.subscriptionPlanPricing.delete({
        where: { id },
    });

    return null;
};

export const SubscriptionPlanService = {
    createPlan,
    getAllPlans,
    getPlanById,
    updatePlan,
    deletePlan,
};
