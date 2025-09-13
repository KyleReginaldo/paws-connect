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
  created_by: z.string().min(1, 'User ID is required'),
  images: z.array(z.string()).optional(),
  status: statusEnum.optional().default('PENDING'),
  end_date: z
    .string()
    .optional()
    .transform((val) => (val === '' ? null : val)),
  facebook_link: z
    .string()
    .optional()
    .transform((val) => (val === '' ? null : val))
    .refine(
      (val) => val === null || val === undefined || z.string().url().safeParse(val).success,
      'Invalid Facebook URL',
    ),
  // Note: raised_amount is NOT included in create schema - it starts at 0 and is updated via donations
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
  images: z.array(z.string()).optional(),
  end_date: z
    .string()
    .transform((val) => (val === '' ? null : val))
    .optional(),
  facebook_link: z
    .string()
    .transform((val) => (val === '' ? null : val))
    .refine(
      (val) => val === null || val === undefined || z.string().url().safeParse(val).success,
      'Invalid Facebook URL',
    )
    .optional(),
});

export type CreateFundraisingDto = z.infer<typeof createFundraisingSchema>;
export type UpdateFundraisingDto = z.infer<typeof updateFundraisingSchema>;
