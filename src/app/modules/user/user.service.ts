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

const createTraveler = async (req: Request) => {
  const { password, traveler } = req.body;

  if (!traveler) throw new Error("Traveler data is required");
  if (!traveler.email) throw new Error("Traveler email is required");

  // Normalize email
  const normalizedEmail = traveler.email.trim().toLowerCase();

  // Check duplicate
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) {
    console.log("Existing user:", existingUser);
    throw new Error("User with this email already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // File upload
  if (req.file) {
    const uploadResult = await fileUploader.uploadToCloudinary(req.file);
    traveler.profilePhoto = uploadResult?.secure_url;
  }

  // Ensure age is a number
  if (traveler.age) traveler.age = Number(traveler.age);

  // Parse interests & languages if strings
  if (traveler.interests && typeof traveler.interests === "string") {
    traveler.interests = JSON.parse(traveler.interests);
  }
  if (traveler.languages && typeof traveler.languages === "string") {
    traveler.languages = JSON.parse(traveler.languages);
  }

  const { name, ...profileData } = traveler;

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      photoURL: profileData.profilePhoto || null,
      TravelerProfile: {
        create: {
          name,
          bio: profileData.bio || "",
          age: profileData.age,
          gender: profileData.gender,
          travelStyle: profileData.travelStyle || "BUDGET",
          interests: profileData.interests || [],
          languages: profileData.languages || [],
          city: profileData.city,
          country: profileData.country,
          profilePhoto: profileData.profilePhoto,
        },
      },
    },
  });

  return user;
};

const getAllUsers = async (filters: any, options: IPaginationOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const { searchTerm, ...filterData } = filters;

  const andConditions: Prisma.UserWhereInput[] = [];

  // --- SearchTerm logic ---
  if (searchTerm && searchTerm.trim() !== "") {
    const search = searchTerm.trim();

    // Top-level User fields
    const userOr = userSearchableFields.map((field) => ({
      [field]: { contains: search, mode: "insensitive" },
    }));

    // Nested relations: TravelerProfile, Admin, Moderator
    const nestedOr: Prisma.UserWhereInput[] = [
      {
        TravelerProfile: {
          is: { name: { contains: search, mode: "insensitive" } },
        },
      },
      {
        Admin: {
          is: { name: { contains: search, mode: "insensitive" } },
        },
      },
      {
        Moderator: {
          is: { name: { contains: search, mode: "insensitive" } },
        },
      },
    ];

    andConditions.push({ OR: [...userOr, ...nestedOr] });
  }

  // --- Exact filters ---
  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: { equals: filterData[key] },
      })),
    });
  }

  const where: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // Debug log
  console.log("Prisma where:", JSON.stringify(where, null, 2));

  const users = await prisma.user.findMany({
    where,
    skip,
    take: limit,
    orderBy:
      options.sortBy && options.sortOrder
        ? { [options.sortBy]: options.sortOrder }
        : { createdAt: "desc" },
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
