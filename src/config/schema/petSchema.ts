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
  description: z.string(),
  special_needs: z.string(),
  added_by: z.uuid(),
  request_status: z.string().default('pending'),
  photo: z.string().min(1, 'Photo is required'),
});

// Schema for bulk imports - allows photo to be optional with default
export const bulkCreatePetSchema = z.object({
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
  description: z.string(),
  special_needs: z.string(),
  added_by: z.uuid(),
  request_status: z.string().default('pending'),
  photo: z.string().default('/empty_pet.png'), // Default photo for imports
});

export type CreatePetDto = z.infer<typeof createPetSchema>;
export type BulkCreatePetDto = z.infer<typeof bulkCreatePetSchema>;
export const updatePetSchema = z.object({
  name: z.string().optional(),
  type: z.string().optional(),
  breed: z.string().optional(),
  gender: z.string().optional(),
  age: z.number().optional(),
  date_of_birth: z.string().optional(),
  size: z.string().optional(),
  weight: z.string().optional(),
  is_vaccinated: z.boolean().optional(),
  is_spayed_or_neutured: z.boolean().optional(),
  health_status: z.string().optional(),
  good_with: z.array(z.string()).optional(),
  is_trained: z.boolean().optional(),
  rescue_address: z.string().optional(),
  description: z.string().optional(),
  special_needs: z.string().optional(),
  request_status: z.string().optional(),
  photo: z.string().optional(),
});

export type UpdatePetDto = z.infer<typeof updatePetSchema>;
