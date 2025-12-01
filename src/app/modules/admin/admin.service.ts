import { Admin, Prisma, UserStatus } from "@prisma/client";
import { adminSearchAbleFields } from "./admin.constant";
import { IAdminFilterRequest } from "./admin.interface";
import { IOptions, paginationHelper } from "../../../helpers/paginationHelper";
import prisma from "../../../shared/prisma";



const getAllFromDB = async (params: IAdminFilterRequest, options: IOptions) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = params;

    const andCondions: Prisma.AdminWhereInput[] = [];

    if (params.searchTerm) {
        andCondions.push({
            OR: adminSearchAbleFields.map(field => ({
                [field]: {
                    contains: params.searchTerm,
                    mode: 'insensitive'
                }
            }))
        })
    };

    if (Object.keys(filterData).length > 0) {
        andCondions.push({
            AND: Object.keys(filterData).map(key => ({
                [key]: {
                    equals: (filterData as any)[key]
                }
            }))
        })
    };

    andCondions.push({
        isDeleted: false
    })

    //console.dir(andCondions, { depth: 'inifinity' })
    const whereConditons: Prisma.AdminWhereInput = { AND: andCondions }

    const result = await prisma.admin.findMany({
        where: whereConditons,
        skip,
        take: limit,
        orderBy: options.sortBy && options.sortOrder ? {
            [options.sortBy]: options.sortOrder
        } : {
            createdAt: 'desc'
        }
    });

    const total = await prisma.admin.count({
        where: whereConditons
    });

    return {
        meta: {
            page,
            limit,
            total
        },
        data: result
    };
};

const getByIdFromDB = async (id: string): Promise<Admin | null> => {
    const result = await prisma.admin.findUnique({
        where: {
            id,
            isDeleted: false
        }
    })

    return result;
};

const updateIntoDB = async (id: string, data: Partial<Admin>): Promise<Admin> => {
    await prisma.admin.findUniqueOrThrow({
        where: {
            id,
            isDeleted: false
        }
    });

    const result = await prisma.admin.update({
        where: {
            id
        },
        data
        
    });

    return result;
};
const deleteFromDB = async (id: string): Promise<Admin> => {
  // Ensure admin exists
  const admin = await prisma.admin.findUniqueOrThrow({
    where: { id },
  });

  if (!admin.email) {
    throw new Error("Admin email is missing, cannot delete associated user");
  }

  // Transaction: delete admin and associated user
  const result = await prisma.$transaction(async (tx) => {
    const deletedAdmin = await tx.admin.delete({
      where: { id },
    });

    await tx.user.delete({
      where: { email: admin.email },
    });

    return deletedAdmin;
  });

  return result;
};

const softDeleteFromDB = async (id: string): Promise<Admin> => {
  // Ensure admin exists and is not already deleted
  const admin = await prisma.admin.findUniqueOrThrow({
    where: { id },
  });

  if (!admin.email) {
    throw new Error("Admin email is missing, cannot update associated user");
  }

  // Transaction: soft delete admin and deactivate user
  const result = await prisma.$transaction(async (tx) => {
    const updatedAdmin = await tx.admin.update({
      where: { id },
      data: { isDeleted: true },
    });

    await tx.user.update({
      where: { email: admin.email },
      data: { status: UserStatus.INACTIVE },
    });

    return updatedAdmin;
  });

  return result;
};



export const AdminService = {
    getAllFromDB,
    getByIdFromDB,
    updateIntoDB,
    deleteFromDB,
    softDeleteFromDB
}