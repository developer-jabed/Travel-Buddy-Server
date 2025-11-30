import { z } from "zod";

export const createAdminSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
  superAdmin: z.boolean().optional(),
  permissions: z.array(z.string()).optional(),
});

export const createModeratorSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
});

export const createTravelerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  TravelerProfile: z.object({
    name: z.string(),
    bio: z.string().optional(),
    age: z.number().optional(),
    gender: z.string().optional(),
    travelStyle: z.enum(["BUDGET", "LUXURY", "ADVENTURE"]).optional(),
    interests: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    city: z.string().optional(),
    country: z.string().optional(),
  }),
});

export const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "BANNED"]),
});

export const updateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  TravelerProfile: z.object({
    name: z.string().optional(),
    bio: z.string().optional(),
    age: z.number().optional(),
    gender: z.string().optional(),
    travelStyle: z.enum(["BUDGET", "LUXURY", "ADVENTURE"]).optional(),
    interests: z.array(z.string()).optional(),
    languages: z.array(z.string()).optional(),
    city: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
});
