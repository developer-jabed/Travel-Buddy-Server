import { z } from "zod";

const update = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    photoURL: z.string().url().optional(),
    isActive: z.boolean().optional(),
    isDeleted: z.boolean().optional(),
  }),
});

export const moderatorValidationSchemas = {
  update,
};
