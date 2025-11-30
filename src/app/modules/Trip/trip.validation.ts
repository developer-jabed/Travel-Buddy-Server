// src/app/modules/trip/trip.validation.ts
import { z } from "zod";

export const createTripSchema = z.object({
  title: z.string().min(1, "Title is required"),
  destination: z.string().min(1, "Destination is required"),
  startDate: z.string().refine(val => !isNaN(Date.parse(val)), "Invalid date"),
  endDate: z.string().refine(val => !isNaN(Date.parse(val)), "Invalid date"),
  budget: z.number().int().positive().optional(),
  description: z.string().optional(),
  tripStatus: z.enum(["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
});

export const updateTripSchema = z.object({
  title: z.string().optional(),
  destination: z.string().optional(),
  startDate: z.string().refine(val => !isNaN(Date.parse(val))).optional(),
  endDate: z.string().refine(val => !isNaN(Date.parse(val))).optional(),
  budget: z.number().int().positive().optional(),
  description: z.string().optional(),
  tripStatus: z.enum(["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
});
