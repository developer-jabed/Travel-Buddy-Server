// src/app/modules/trip/trip.validation.ts

import { z } from "zod";

// -----------------------------
// CREATE TRIP VALIDATION
// -----------------------------
export const createTripSchema = z.object({
  title: z.string().min(1, { message: "Title is required" }),
  destination: z.string().min(1, { message: "Destination is required" }),
  startDate: z.string().min(1, { message: "Start date is required" }),
  endDate: z.string().min(1, { message: "End date is required" }),
  budget: z.number().optional(),
  description: z.string().optional(),

  // NEW: interests array
  interests: z
    .array(z.string().min(1))
    .optional()
    .default([]), // empty array by default
});

// -----------------------------
// UPDATE TRIP VALIDATION
// -----------------------------
export const updateTripSchema = z.object({
  title: z.string().optional(),
  destination: z.string().optional(),
  startDate: z
    .string()
    .refine(val => !isNaN(Date.parse(val)), {
      message: "Invalid start date format",
    })
    .optional(),
  endDate: z
    .string()
    .refine(val => !isNaN(Date.parse(val)), {
      message: "Invalid end date format",
    })
    .optional(),
  budget: z.number().int().positive().optional(),
  description: z.string().optional(),

  // NEW: update interests
  interests: z.array(z.string().min(1)).optional(),

  tripStatus: z
    .enum(["UPCOMING", "ONGOING", "COMPLETED", "CANCELLED"])
    .optional(),
});
