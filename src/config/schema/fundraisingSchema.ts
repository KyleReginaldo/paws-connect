import z from 'zod';

const statusEnum = z.enum(['PENDING', 'ONGOING', 'COMPLETE', 'REJECTED', 'CANCELLED']);

export const createFundraisingSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  target_amount: z
    .number()
    .min(100, 'Target amount must be at least ₱100')
    .max(10000000, 'Target amount cannot exceed ₱10,000,000'),
  created_by: z.uuid(),
  status: statusEnum.optional().default('PENDING'),
});

export const updateFundraisingSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title must be less than 100 characters')
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  target_amount: z
    .number()
    .min(100, 'Target amount must be at least ₱100')
    .max(10000000, 'Target amount cannot exceed ₱10,000,000')
    .optional(),
  raised_amount: z.number().min(0, 'Raised amount cannot be negative').optional(),
  status: statusEnum.optional(),
});

export type CreateFundraisingDto = z.infer<typeof createFundraisingSchema>;
export type UpdateFundraisingDto = z.infer<typeof updateFundraisingSchema>;
