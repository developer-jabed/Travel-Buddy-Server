import { z } from "zod";

// Admin creation
export const createAdminSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  superAdmin: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
});

// Moderator creation
export const createModeratorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Traveler creation
export const createTravelerSchema = z.object({
  name: z.string().min(1, "Name is required"), // top-level user name
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  TravelerProfile: z.object({
    name: z.string().min(1, "TravelerProfile name is required"),
    bio: z.string().optional(),
    age: z.number().int().positive().optional(),
    gender: z.enum(["Male", "Female", "Other"]).optional(),
    travelStyle: z.enum(["BUDGET", "LUXURY", "ADVENTURE"]).optional(),
    interests: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    profilePhoto: z.string().url().optional(),
  }),
});

// Update status
export const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "BANNED"]),
});

// Update profile
export const updateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  TravelerProfile: z.object({
    name: z.string().optional(),
    bio: z.string().optional(),
    age: z.number().int().positive().optional(),
    gender: z.enum(["Male", "Female", "Other"]).optional(),
    travelStyle: z.enum(["BUDGET", "LUXURY", "ADVENTURE"]).optional(),
    interests: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    city: z.string().optional(),
    country: z.string().optional(),
    profilePhoto: z.string().url().optional(),
  }).optional(),
});
