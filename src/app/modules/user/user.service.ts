import { Prisma, UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { Request } from "express";
import config from "../../../config";
import prisma from "../../../shared/prisma";
import { IPaginationOptions } from "../../interfaces/pagination";
import { fileUploader } from "../../../helpers/fileUploader";
import { paginationHelper } from "../../../helpers/paginationHelper";
import { userSearchableFields } from "./user.constant";
import { IAuthUser } from "./user.interface";

// CREATE ADMIN
const createAdmin = async (req: Request) => {
    const hashedPassword = await bcrypt.hash(req.body.password, Number(config.salt_round));
    const { name, superAdmin, permissions, email } = req.body;

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: UserRole.ADMIN,
            status: UserStatus.ACTIVE,
            Admin: {
                create: { name, superAdmin: superAdmin || false, permissions: permissions || [] },
            },
        },
    });
    return user;
};

// CREATE MODERATOR
const createModerator = async (req: Request) => {
    const hashedPassword = await bcrypt.hash(req.body.password, Number(config.salt_round));
    const { name, email } = req.body;

    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: UserRole.USER,
            status: UserStatus.ACTIVE,
            Moderator: { create: { name } },
        },
    });
    return user;
};

// CREATE TRAVELER
const createTraveler = async (req: Request) => {
  const hashedPassword = await bcrypt.hash(req.body.password, Number(config.salt_round));
  const { name: userName, email, TravelerProfile } = req.body;

  const file = req.file;
  if (file) {
    const uploadResult = await fileUploader.uploadToCloudinary(file);
    if (uploadResult?.secure_url) {
      TravelerProfile.profilePhoto = uploadResult.secure_url;
    }
  }

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: userName,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      TravelerProfile: { create: TravelerProfile },
    },
  });

  return user;
};


// GET ALL USERS
const getAllUsers = async (filters: any, options: IPaginationOptions) => {
    const { page, limit, skip } = paginationHelper.calculatePagination(options);
    const { searchTerm, ...filterData } = filters;

    const andConditions: Prisma.UserWhereInput[] = [];

    if (searchTerm) {
        andConditions.push({
            OR: userSearchableFields.map(field => ({ [field]: { contains: searchTerm, mode: "insensitive" } })),
        });
    }

    if (Object.keys(filterData).length > 0) {
        andConditions.push({
            AND: Object.keys(filterData).map(key => ({ [key]: { equals: filterData[key] } })),
        });
    }

    const where: Prisma.UserWhereInput = andConditions.length ? { AND: andConditions } : {};

    const users = await prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: options.sortBy && options.sortOrder ? { [options.sortBy]: options.sortOrder } : { createdAt: "desc" },
        include: { Admin: true, Moderator: true, TravelerProfile: true },
    });

    const total = await prisma.user.count({ where });

    return { meta: { page, limit, total }, data: users };
};

// GET LOGGED-IN USER PROFILE
const getMyProfile = async (user: IAuthUser) => {
    const userInfo = await prisma.user.findUniqueOrThrow({
        where: { id: user.id, status: UserStatus.ACTIVE },
        include: { Admin: true, Moderator: true, TravelerProfile: true },
    });

    return userInfo;
};

// UPDATE STATUS
const updateStatus = async (id: string, status: UserStatus) => {
    const user = await prisma.user.update({ where: { id }, data: { status } });
    return user;
};

// UPDATE PROFILE
const updateProfile = async (userId: string, data: any, file?: Express.Multer.File) => {
    if (file) data.TravelerProfile.profilePhoto = (await fileUploader.uploadToCloudinary(file))?.secure_url;

    const user = await prisma.user.update({
        where: { id: userId },
        data,
        include: { TravelerProfile: true, Admin: true, Moderator: true },
    });
    return user;
};

export const userService = {
    createAdmin,
    createModerator,
    createTraveler,
    getAllUsers,
    getMyProfile,
    updateStatus,
    updateProfile,
};
