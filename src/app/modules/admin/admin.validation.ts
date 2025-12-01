import { z } from "zod";

const update = z.object({
    body: z.object({
        name: z.string().optional(),
    })
});


export const adminValidationSchemas = {
    update
}