import { Prisma, UserRole, UserStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { Request } from "express";
import config from "../../../config";
import prisma from "../../../shared/prisma";
import { fileUploader } from "../../../helpers/fileUploader";

// CREATE ADMIN
const createAdmin = async (req: Request) => {
  const { password, admin } = req.body;

  if (!admin?.email) throw new Error("Email is required");
  if (!password) throw new Error("Password is required");

  const { name, email, superAdmin, permissions } = admin;
  const normalizedEmail = email.trim().toLowerCase();

  // Prevent duplicate
  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) throw new Error("User with this email already exists");

  // Hash password
  const hashedPassword = await bcrypt.hash(password, Number(config.salt_round));

  // Upload profile picture if exists
  let profilePhoto: string | null = null;
  if (req.file) {
    const uploadResult = await fileUploader.uploadToCloudinary(req.file);
    profilePhoto = uploadResult?.secure_url || null;
  }

  // Create user and admin
  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      photoURL: profilePhoto, // store in user table
      Admin: {
        create: {
          name,
          email: normalizedEmail,  // store email in Admin table too
          profilePhoto,            // store uploaded photo
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
  const { password, moderator } = req.body;

  if (!moderator) throw new Error("Moderator data is required");

  const { name, email } = moderator;

  if (!email) throw new Error("Email is required");
  if (!password) throw new Error("Password is required");

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existingUser) throw new Error("User with this email already exists");

  const hashedPassword = await bcrypt.hash(password, Number(config.salt_round));

  // Upload profile photo if exists
  let profilePhoto: string | null = null;
  if (req.file) {
    const uploadResult = await fileUploader.uploadToCloudinary(req.file);
    profilePhoto = uploadResult?.secure_url || null;
  }

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      photoURL: profilePhoto,
      Moderator: {
        create: {
          name,
          email: normalizedEmail, // store email in Moderator too
          profilePhoto,           // store uploaded URL
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


const updateStatus = async (id: string, status: UserStatus) => {
  // Update only the status of the user
  const user = await prisma.user.update({
    where: { id },
    data: { status },
  });

  return user;
};


const updateProfile = async (userId: string, data: any, file?: Express.Multer.File) => {
  // Handle profile picture upload
  let profilePhotoUrl: string | undefined;
  if (file) {
    const uploadResult = await fileUploader.uploadToCloudinary(file);
    profilePhotoUrl = uploadResult?.secure_url;
  }

  // Prepare data for Prisma update
  const userData: any = {};

  // Update user's name if provided
  if (data.name) userData.name = data.name;

  // Update user's profile picture if uploaded
  if (profilePhotoUrl) userData.photoURL = profilePhotoUrl;

  // Include nested updates for related profiles if any
  if (data.TravelerProfile || profilePhotoUrl) {
    userData.TravelerProfile = {
      update: {
        ...(data.TravelerProfile || {}),
        ...(profilePhotoUrl ? { profilePhoto: profilePhotoUrl } : {}),
      },
    };
  }

  if (data.Admin || profilePhotoUrl) {
    userData.Admin = {
      update: {
        ...(data.Admin || {}),
        ...(profilePhotoUrl ? { profilePhoto: profilePhotoUrl } : {}),
      },
    };
  }

  if (data.Moderator || profilePhotoUrl) {
    userData.Moderator = {
      update: {
        ...(data.Moderator || {}),
        ...(profilePhotoUrl ? { profilePhoto: profilePhotoUrl } : {}),
      },
    };
  }

  // Update the user in database
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: userData,
    include: {
      TravelerProfile: true,
      Admin: true,
      Moderator: true,
    },
  });

  return updatedUser;
};




export const userService = {
  createAdmin,
  createModerator,
  createTraveler,
  updateStatus,
  updateProfile
};
