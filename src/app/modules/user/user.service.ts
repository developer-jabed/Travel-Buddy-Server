import { Prisma, UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { Request } from "express";
import config from "../../../config";
import prisma from "../../../shared/prisma";
import { fileUploader } from "../../../helpers/fileUploader";

// CREATE ADMIN
const createAdmin = async (req: Request) => {
  const { name, email, password, superAdmin, permissions } = req.body;

  if (!email) throw new Error("Email is required");
  if (!password) throw new Error("Password is required");

  const normalizedEmail = email.trim().toLowerCase();

  // Prevent duplicate
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) throw new Error("User with this email already exists");

  const hashedPassword = await bcrypt.hash(password, Number(config.salt_round));

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      Admin: {
        create: {
          name,
          email: normalizedEmail, // store email in Admin too
          superAdmin: superAdmin || false,
          permissions: permissions || [],
        },
      },
    },
    include: { Admin: true },
  });

  return user;
};

// CREATE MODERATOR
const createModerator = async (req: Request) => {
  const { name, email, password } = req.body;
  if (!email) throw new Error("Email is required");
  if (!password) throw new Error("Password is required");

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) throw new Error("User with this email already exists");

  const hashedPassword = await bcrypt.hash(password, Number(config.salt_round));

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      Moderator: {
        create: {
          name,
          email: normalizedEmail, // store email in Moderator too
        },
      },
    },
    include: { Moderator: true },
  });

  return user;
};

// CREATE TRAVELER
const createTraveler = async (req: Request) => {
  const { password, traveler } = req.body;
  if (!traveler) throw new Error("Traveler data is required");
  if (!traveler.email) throw new Error("Traveler email is required");

  const normalizedEmail = traveler.email.trim().toLowerCase();

  // Prevent duplicate
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) throw new Error("User with this email already exists");

  const hashedPassword = await bcrypt.hash(password, Number(config.salt_round));

  // File upload
  if (req.file) {
    const uploadResult = await fileUploader.uploadToCloudinary(req.file);
    traveler.profilePhoto = uploadResult?.secure_url;
  }

  if (traveler.age) traveler.age = Number(traveler.age);
  if (traveler.interests && typeof traveler.interests === "string") traveler.interests = JSON.parse(traveler.interests);
  if (traveler.languages && typeof traveler.languages === "string") traveler.languages = JSON.parse(traveler.languages);

  const { name, ...profileData } = traveler;

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
          email: normalizedEmail, // store email in TravelerProfile too
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
    include: { TravelerProfile: true },
  });

  return user;
};

export const userService = {
  createAdmin,
  createModerator,
  createTraveler,
};
