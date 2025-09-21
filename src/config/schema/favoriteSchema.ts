import { z } from 'zod';

export const createFavoriteSchema = z.object({
  user: z.string().uuid('User must be a valid UUID'),
  pet: z.number().positive('Pet id must be a positive number'),
});

export type CreateFavoriteDto = z.infer<typeof createFavoriteSchema>;

export const getFavoritesQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .default('50')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val <= 500, { message: 'Limit must be between 1 and 500' }),
  offset: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 0))
    .refine((val) => !isNaN(val) && val >= 0, { message: 'Offset must be a non-negative number' }),
});

export type GetFavoritesQueryDto = z.infer<typeof getFavoritesQuerySchema>;
