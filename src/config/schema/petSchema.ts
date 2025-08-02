// schemas/userSchema.ts
import { z } from 'zod';

export const createPetSchema = z.object({
    name: z.string(),
    type: z.string(),
    breed: z.string(),
    gender: z.string(),
    age: z.number(),
    date_of_birth: z.string(),
    size: z.string(),
    weight: z.string(),
    is_vaccinated: z.boolean(),
    is_spayed_or_neutured: z.boolean(),
    health_status: z.string(),
    good_with: z.array(z.string()),
    is_trained: z.boolean(),
    rescue_address: z.string(),
    description:z.string(),
    special_needs: z.string(),
    added_by: z.uuid(),
});

export type CreatePetDto = z.infer<typeof createPetSchema>;
